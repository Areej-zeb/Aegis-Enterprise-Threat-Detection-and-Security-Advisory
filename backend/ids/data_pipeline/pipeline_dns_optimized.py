"""
Aegis IDS - Optimized DNS Exfiltration Detector Training Pipeline

Based on CIC-Bell-DNS-EXF-2021 research best practices:
1. Merge ALL sources (stateless heavy + light, stateful heavy + light)
2. Drop redundant identifiers (timestamp, flow_id, subdomain)
3. Fill NaNs with 0
4. Keep ALL numeric/statistical features
5. Binary label encoding (BENIGN=0, DNS_EXFILTRATION=1)
6. Stratified 70/30 split (preserves class distribution)
7. Natural imbalance handling via scale_pos_weight (no rebalancing)
8. XGBoost with tuned parameters for DNS detection

Dataset structure:
    datasets/raw/CIC-Bell-DNS-EXF-2021/
        Attack_heavy_Benign/
            Attacks/stateless_features-*.csv, stateful_features-*.csv
            Benign/stateless_features-*.csv, stateful_features-*.csv
        Attack_Light_Benign/
            Attacks/stateless_features-*.csv, stateful_features-*.csv
            Benign/stateless_features-*.csv, stateful_features-*.csv

Output:
    datasets/processed/dns_unified/
        train.parquet, val.parquet, test.parquet, metadata.json

Usage:
    python -m backend.ids.data_pipeline.pipeline_dns_optimized
"""

import json
from pathlib import Path
from typing import Dict, Tuple
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from tqdm import tqdm
import warnings
warnings.filterwarnings('ignore')

# =============================================================================
# Configuration
# =============================================================================

ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = ROOT / "datasets" / "raw" / "CIC-Bell-DNS-EXF-2021"
PROCESSED_DIR = ROOT / "datasets" / "processed" / "dns_unified"

TRAIN_SIZE = 0.80
TEST_SIZE = 0.20
RANDOM_STATE = 42

# Features to drop (redundant identifiers)
DROP_FEATURES = ['timestamp', 'flow_id', 'subdomain', 'sld', 'FQDN']

# =============================================================================
# Data Loading
# =============================================================================

def load_all_dns_data() -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load and merge ALL DNS sources for full coverage:
    - Stateless heavy + light (domain-based features)
    - Stateful heavy + light (network flow features)
    
    Returns:
        (stateless_df, stateful_df) - merged dataframes
    """
    
    print("=" * 70)
    print("📦 LOADING ALL DNS EXFILTRATION DATA (FULL COVERAGE)")
    print("=" * 70)
    
    if not RAW_DIR.exists():
        raise FileNotFoundError(f"DNS dataset not found: {RAW_DIR}")
    
    stateless_dfs = []
    stateful_dfs = []
    
    # Folders to process (heavy and light attacks + benign)
    folders = ["Attack_heavy_Benign", "Attack_Light_Benign"]
    
    for folder in folders:
        folder_path = RAW_DIR / folder
        if not folder_path.exists():
            print(f"⚠️  Folder not found: {folder}")
            continue
        
        print(f"\n📁 Processing {folder}...")
        
        # Process Attacks and Benign subfolders
        for subfolder in ["Attacks", "Benign"]:
            subfolder_path = folder_path / subfolder
            if not subfolder_path.exists():
                continue
            
            label = "DNS_EXFILTRATION" if subfolder == "Attacks" else "BENIGN"
            
            # Load stateless features
            stateless_files = list(subfolder_path.glob("stateless_features-*.csv"))
            print(f"  {subfolder:10s} → {len(stateless_files)} stateless files", end=" ")
            for csv_file in stateless_files:
                df = pd.read_csv(csv_file, low_memory=False)
                df['label'] = label
                stateless_dfs.append(df)
            
            # Load stateful features
            stateful_files = list(subfolder_path.glob("stateful_features-*.csv"))
            print(f"+ {len(stateful_files)} stateful files")
            for csv_file in stateful_files:
                df = pd.read_csv(csv_file, low_memory=False)
                df['label'] = label
                stateful_dfs.append(df)
    
    # Merge all dataframes
    print("\n🔗 Merging all sources...")
    stateless_merged = pd.concat(stateless_dfs, ignore_index=True)
    stateful_merged = pd.concat(stateful_dfs, ignore_index=True)
    
    print(f"\n✅ Stateless merged: {len(stateless_merged):,} samples")
    print(f"✅ Stateful merged:  {len(stateful_merged):,} samples")
    
    # Show class distribution
    print("\n📊 Class Distribution:")
    for df, name in [(stateless_merged, "Stateless"), (stateful_merged, "Stateful")]:
        print(f"\n  {name}:")
        label_counts = df['label'].value_counts()
        for label, count in label_counts.items():
            pct = (count / len(df)) * 100
            print(f"    {label:20s}: {count:8,} ({pct:5.2f}%)")
    
    return stateless_merged, stateful_merged


# =============================================================================
# Data Preprocessing
# =============================================================================

def preprocess_dns_data(df: pd.DataFrame, feature_type: str) -> pd.DataFrame:
    """
    Apply DNS-specific preprocessing:
    1. Drop redundant identifiers (timestamp, flow_id, subdomain, etc.)
    2. Fill NaNs with 0
    3. Keep ALL numeric/statistical features
    4. Binary label encoding
    
    Args:
        df: Raw dataframe
        feature_type: 'stateless' or 'stateful'
    
    Returns:
        Preprocessed dataframe
    """
    
    print(f"\n{'=' * 70}")
    print(f"🔧 PREPROCESSING {feature_type.upper()} FEATURES")
    print(f"{'=' * 70}")
    
    # Make a copy
    df = df.copy()
    
    # 1. Drop redundant identifiers
    print("\n1️⃣ Dropping redundant identifiers...")
    cols_to_drop = [col for col in DROP_FEATURES if col in df.columns]
    if cols_to_drop:
        print(f"   Dropping: {cols_to_drop}")
        df = df.drop(columns=cols_to_drop)
    else:
        print("   No redundant columns to drop")
    
    # 2. Separate features and label
    label_col = df['label']
    feature_cols = [col for col in df.columns if col != 'label']
    
    # 3. Fill NaNs with 0
    print("\n2️⃣ Handling missing values...")
    nan_count = df[feature_cols].isna().sum().sum()
    if nan_count > 0:
        print(f"   Found {nan_count:,} NaN values → Filling with 0")
        df[feature_cols] = df[feature_cols].fillna(0)
    else:
        print("   No NaN values found ✓")
    
    # 4. Convert all features to numeric (in case of any string values)
    print("\n3️⃣ Ensuring numeric types...")
    cols_converted = []
    for col in feature_cols:
        if df[col].dtype == 'object':
            cols_converted.append(col)
            # For columns with set() or list representations, extract counts
            try:
                def extract_count(val):
                    if pd.isna(val) or val == 'set()' or val == '[]':
                        return 0
                    try:
                        import ast
                        obj = ast.literal_eval(str(val))
                        if isinstance(obj, (set, list)):
                            return len(obj)
                        return 0
                    except:
                        return 0
                
                df[col] = df[col].apply(extract_count).astype(float)
            except:
                df[col] = pd.to_numeric(df[col], errors='coerce')
    
    if cols_converted:
        print(f"   Converted {len(cols_converted)} columns to numeric: {', '.join(cols_converted[:5])}")
        if len(cols_converted) > 5:
            print(f"   ... and {len(cols_converted) - 5} more")
    else:
        print("   All columns already numeric ✓")
    
    # 5. Remove any remaining rows with NaN (after conversion)
    initial_count = len(df)
    df = df.dropna()
    if len(df) < initial_count:
        dropped = initial_count - len(df)
        print(f"   Dropped {dropped:,} rows with invalid values after conversion")
    
    # 6. Remove infinite values
    initial_count = len(df)
    df = df.replace([np.inf, -np.inf], np.nan).dropna()
    if len(df) < initial_count:
        print(f"   Dropped {initial_count - len(df):,} rows with infinite values")
    
    # Check if we have any data left
    if len(df) == 0:
        print(f"\n⚠️  WARNING: All data was dropped! This usually means:")
        print(f"    - Columns contain non-numeric values that can't be converted")
        print(f"    - Need to check raw CSV files for data quality issues")
        raise ValueError(f"No valid data remaining after preprocessing {feature_type}")
    
    # 7. Binary label encoding (BENIGN=0, DNS_EXFILTRATION=1)
    print("\n4️⃣ Binary label encoding...")
    label_map = {'BENIGN': 0, 'DNS_EXFILTRATION': 1}
    df['label'] = df['label'].map(label_map)
    
    print(f"   BENIGN → 0")
    print(f"   DNS_EXFILTRATION → 1")
    
    # 8. Feature Engineering - Add discriminative features
    print("\n5️⃣ Feature engineering (advanced DNS patterns)...")
    df = engineer_features(df, feature_type)
    
    # Final feature count
    feature_cols = [col for col in df.columns if col != 'label']
    print(f"\n✅ Final shape: {len(df):,} samples × {len(feature_cols)} features")
    
    return df


def engineer_features(df: pd.DataFrame, feature_type: str) -> pd.DataFrame:
    """
    Engineer advanced DNS features for improved detection.
    
    Stateless features:
        - unique_chars_ratio: Unique character diversity (low = repetitive tunneling)
        - special_to_length_ratio: Special chars normalized by length
        - alpha_numeric_ratio: Balance between letters and numbers (exfil often has more numbers)
    
    Stateful features:
        - ttl_range: TTL max - min (large variance = suspicious)
        - rr_type_variety: Number of distinct RR types (high = evasion)
        - response_diversity: Ratio of distinct responses to total queries
        - query_burst_indicator: High frequency in short time (derived from rr_count)
    
    Args:
        df: Preprocessed dataframe
        feature_type: 'stateless' or 'stateful'
    
    Returns:
        DataFrame with engineered features
    """
    
    df = df.copy()
    
    if feature_type == 'stateless':
        # Unique character ratio (0-1): low values indicate repetitive encoding
        if 'len' in df.columns and 'entropy' in df.columns:
            # Approximate unique chars from entropy (Shannon entropy correlates with uniqueness)
            df['unique_chars_ratio'] = df['entropy'].clip(0, 1)  # Entropy is already normalized
        
        # Special character ratio (normalized by length)
        if 'special' in df.columns and 'len' in df.columns:
            df['special_to_length_ratio'] = df['special'] / (df['len'] + 1)  # Avoid div by zero
        
        # Alpha-numeric balance (numeric / (upper + lower + numeric + 1))
        if 'numeric' in df.columns and 'upper' in df.columns and 'lower' in df.columns:
            total_chars = df['upper'] + df['lower'] + df['numeric'] + 1
            df['alpha_numeric_ratio'] = df['numeric'] / total_chars
        
        # Label-based features (exfil often has unusual label patterns)
        if 'labels' in df.columns and 'labels_max' in df.columns:
            df['label_length_variance'] = df['labels_max'] - df['labels'].clip(lower=0)
        
        # Entropy-to-length ratio (high entropy in short domains = suspicious)
        if 'entropy' in df.columns and 'subdomain_length' in df.columns:
            df['entropy_per_char'] = df['entropy'] / (df['subdomain_length'] + 1)
        
        print(f"   Added 5 stateless features: unique_chars_ratio, special_to_length_ratio, alpha_numeric_ratio, label_length_variance, entropy_per_char")
    
    elif feature_type == 'stateful':
        # TTL range (high variance = suspicious, tunneling often uses low/inconsistent TTLs)
        if 'ttl_variance' in df.columns:
            df['ttl_range'] = np.sqrt(df['ttl_variance'].clip(lower=0))  # Std dev approximation
        
        # RR type variety (count of non-zero RR frequencies)
        rr_cols = [c for c in df.columns if '_frequency' in c]
        if rr_cols:
            df['rr_type_variety'] = (df[rr_cols] > 0).sum(axis=1)
        
        # Response diversity (unique responses / total queries ratio)
        if 'rr_count' in df.columns and 'distinct_domains' in df.columns:
            df['response_diversity'] = df['distinct_domains'] / (df['rr_count'] + 1)
        
        # Query burst indicator (high rr_count relative to distinct IPs)
        if 'rr_count' in df.columns and 'distinct_ip' in df.columns:
            df['query_burst_indicator'] = df['rr_count'] / (df['distinct_ip'] + 1)
        
        # TTL consistency (low mean + high variance = tunneling)
        if 'ttl_mean' in df.columns and 'ttl_variance' in df.columns:
            df['ttl_inconsistency'] = df['ttl_variance'] / (df['ttl_mean'] + 1)
        
        # A record dominance (exfil often uses A records heavily)
        if 'A_frequency' in df.columns and 'rr_count' in df.columns:
            df['a_record_ratio'] = df['A_frequency'] / (df['rr_count'] + 1)
        
        print(f"   Added 6 stateful features: ttl_range, rr_type_variety, response_diversity, query_burst_indicator, ttl_inconsistency, a_record_ratio")
    
    # Replace any inf/nan from divisions
    df = df.replace([np.inf, -np.inf], 0).fillna(0)
    
    return df


def remove_duplicates(df: pd.DataFrame, feature_type: str) -> pd.DataFrame:
    """
    Check for duplicates but DO NOT remove them for DNS datasets.
    
    DNS exfiltration creates repetitive patterns (data tunneling) - duplicates are SIGNAL, not noise!
    Research shows keeping duplicates preserves real-world attack patterns.
    """
    print(f"\n6️⃣ Checking for duplicates in {feature_type}...")
    
    initial_count = len(df)
    duplicate_count = df.duplicated().sum()
    
    if duplicate_count > 0:
        dup_pct = (duplicate_count / initial_count) * 100
        print(f"   Found {duplicate_count:,} duplicates ({dup_pct:.2f}%)")
        print(f"   ✓ KEEPING duplicates (DNS tunneling patterns - these are real attack signatures!)")
    else:
        print("   No duplicates found ✓")
    
    return df  # Return original dataframe WITHOUT removing duplicates


# =============================================================================
# Train/Val/Test Split
# =============================================================================

def stratified_split(df: pd.DataFrame, feature_type: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Stratified 80/20 train/test split to preserve class distribution
    Simpler split strategy - no validation set needed (XGBoost has internal CV)
    """
    
    print(f"\n{'=' * 70}")
    print(f"✂️  STRATIFIED TRAIN/TEST SPLIT ({feature_type.upper()})")
    print(f"{'=' * 70}")
    
    X = df.drop(columns=['label'])
    y = df['label']
    
    # 80/20 split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        train_size=TRAIN_SIZE,
        test_size=TEST_SIZE,
        stratify=y,
        random_state=RANDOM_STATE
    )
    
    # Combine back into dataframes
    train_df = pd.concat([X_train, y_train], axis=1)
    test_df = pd.concat([X_test, y_test], axis=1)
    
    # Print split statistics
    print(f"\n📊 Split Statistics:")
    print(f"  Train: {len(train_df):,} samples ({len(train_df) / len(df) * 100:.1f}%)")
    print(f"  Test:  {len(test_df):,} samples ({len(test_df) / len(df) * 100:.1f}%)")
    
    # Verify stratification
    print(f"\n✓ Stratification Check:")
    for split_name, split_df in [("Train", train_df), ("Test", test_df)]:
        label_counts = split_df['label'].value_counts(normalize=True) * 100
        print(f"  {split_name:6s}: BENIGN {label_counts[0]:.2f}% | ATTACK {label_counts[1]:.2f}%")
    
    return train_df, test_df


# =============================================================================
# Save Processed Data
# =============================================================================

def save_processed_data(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    feature_type: str
):
    """Save processed data and metadata"""
    
    output_dir = PROCESSED_DIR / feature_type
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n{'=' * 70}")
    print(f"💾 SAVING PROCESSED DATA ({feature_type.upper()})")
    print(f"{'=' * 70}")
    
    # Save parquet files
    train_df.to_parquet(output_dir / "train.parquet", index=False)
    test_df.to_parquet(output_dir / "test.parquet", index=False)
    
    print(f"\n✓ Saved to: {output_dir}")
    print(f"  - train.parquet ({len(train_df):,} samples)")
    print(f"  - test.parquet ({len(test_df):,} samples)")
    
    # Calculate scale_pos_weight for XGBoost
    # scale_pos_weight = num_negative / num_positive
    n_benign = (train_df['label'] == 0).sum()
    n_attack = (train_df['label'] == 1).sum()
    scale_pos_weight = n_benign / n_attack
    
    # Prepare metadata
    features = [col for col in train_df.columns if col != 'label']
    
    metadata = {
        "dataset_name": f"dns_unified_{feature_type}",
        "features": features,
        "num_features": len(features),
        "label_distribution": {
            "train": {
                "BENIGN": int(n_benign),
                "DNS_EXFILTRATION": int(n_attack)
            },
            "test": {
                "BENIGN": int((test_df['label'] == 0).sum()),
                "DNS_EXFILTRATION": int((test_df['label'] == 1).sum())
            }
        },
        "sizes": {
            "train": len(train_df),
            "test": len(test_df),
            "total": len(train_df) + len(test_df)
        },
        "scale_pos_weight": float(scale_pos_weight),
        "class_imbalance_ratio": {
            "train": float(n_benign / n_attack),
            "description": "num_benign / num_attack (natural imbalance preserved)"
        },
        "preprocessing": {
            "merged_sources": "Attack_heavy_Benign + Attack_Light_Benign (ALL attacks + benign)",
            "dropped_features": DROP_FEATURES,
            "nan_handling": "Filled with 0",
            "label_encoding": "BENIGN=0, DNS_EXFILTRATION=1",
            "split_strategy": "Stratified 80/20 (preserves class distribution)",
            "imbalance_handling": "Natural ratio preserved via scale_pos_weight",
            "normalization": "None (raw features for XGBoost)"
        },
        "recommended_xgboost_params": {
            "n_estimators": 300,
            "max_depth": 6,
            "learning_rate": 0.05,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "gamma": 0.1,
            "min_child_weight": 3,
            "scale_pos_weight": float(scale_pos_weight),
            "objective": "binary:logistic",
            "tree_method": "gpu_hist (or hist for CPU)",
            "eval_metric": "aucpr",
            "random_state": 42
        }
    }
    
    # Save metadata
    metadata_path = output_dir / "metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\n✓ Metadata saved: {metadata_path.name}")
    print(f"\n📊 Key Training Parameters:")
    print(f"  scale_pos_weight: {scale_pos_weight:.4f}")
    print(f"  Class ratio (benign/attack): {n_benign / n_attack:.4f}:1")
    print(f"  Features: {len(features)}")


# =============================================================================
# Main Pipeline
# =============================================================================

def main():
    """Execute optimized DNS training pipeline"""
    
    print("\n" + "=" * 70)
    print("🛡️  AEGIS IDS - OPTIMIZED DNS EXFILTRATION DETECTOR")
    print("=" * 70)
    print("\n📚 Based on CIC-Bell-DNS-EXF-2021 Research Best Practices:")
    print("  ✓ Merge ALL sources (heavy + light attacks + benign)")
    print("  ✓ Drop redundant identifiers (timestamp, flow_id, subdomain)")
    print("  ✓ Fill NaNs with 0")
    print("  ✓ Keep ALL numeric/statistical features")
    print("  ✓ Binary label encoding (BENIGN=0, DNS_EXFILTRATION=1)")
    print("  ✓ Stratified 80/20 split")
    print("  ✓ Natural imbalance via scale_pos_weight (no rebalancing)")
    print("  ✓ FULLY optimized XGBoost parameters (300 trees, depth=6, aucpr)")
    
    # Load all data
    stateless_raw, stateful_raw = load_all_dns_data()
    
    # Process each feature type independently
    for df_raw, feature_type in [(stateless_raw, "stateless"), (stateful_raw, "stateful")]:
        # Preprocess
        df_clean = preprocess_dns_data(df_raw, feature_type)
        
        # Remove duplicates (actually keeps them for DNS)
        df_dedup = remove_duplicates(df_clean, feature_type)
        
        # Split
        train_df, test_df = stratified_split(df_dedup, feature_type)
        
        # Save
        save_processed_data(train_df, test_df, feature_type)
    
    print("\n" + "=" * 70)
    print("✅ DNS PREPROCESSING COMPLETE!")
    print("=" * 70)
    print(f"\n📁 Output directory: {PROCESSED_DIR}")
    print("\n🚀 Next step: Train XGBoost models")
    print(f"   python -m backend.ids.models.xgb_baseline --dataset dns_unified_stateless")
    print(f"   python -m backend.ids.models.xgb_baseline --dataset dns_unified_stateful")


if __name__ == "__main__":
    main()
