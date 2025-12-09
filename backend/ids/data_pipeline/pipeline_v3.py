"""
Aegis IDS - Advanced Preprocessing Pipeline v3

Key Improvements:
1. Uses actual dataset column names (SYN_FEATURES, MITM_FEATURES)
2. Aggressive downsampling + SMOTE strategy for severe imbalance
3. Target 500k samples max with 1:1 or 2:1 ratio
4. Supports multiple MITM CSV files (All_Labelled, CIC, GIT, IoT, UQ)
5. Computes and saves class weights for model training

Dataset Strategy:
- Syn (4.3M, 120:1): Downsample to 500k attack, SMOTE benign to 250k-500k
- MITM datasets: Combine all 5 CSVs, balance with SMOTE if needed

Expected structure:
    datasets/raw/
        Syn/
            Syn.csv
        mitm_arp/
            All_Labelled.csv
            CIC_MITM_ArpSpoofing_All_Labelled.csv
            GIT_arpspoofLabelledData.csv
            iot_intrusion_MITM_ARP_labeled_data.csv
            UQ_MITM_ARP_labeled_data.csv

Output structure:
    datasets/processed/
        Syn/
            train.parquet
            val.parquet
            test.parquet
            metadata.json (includes class_weights)
        mitm_arp/
            train.parquet
            ...

Usage:
    python -m backend.ids.data_pipeline.pipeline_v3 --dataset Syn
    python -m backend.ids.data_pipeline.pipeline_v3 --dataset mitm_arp
    python -m backend.ids.data_pipeline.pipeline_v3 --all
"""

import argparse
import json
from pathlib import Path
from typing import Dict, List, Tuple
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.utils.class_weight import compute_class_weight
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from tqdm import tqdm
import warnings
warnings.filterwarnings('ignore')

from backend.ids.schemas import SYN_FEATURES, MITM_FEATURES, DNS_STATELESS_FEATURES, DNS_STATEFUL_FEATURES, LABELS

# =============================================================================
# Configuration
# =============================================================================

ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = ROOT / "datasets" / "raw"
PROCESSED_DIR = ROOT / "datasets" / "processed"

TRAIN_SIZE = 0.70
VAL_SIZE = 0.15
TEST_SIZE = 0.15
RANDOM_STATE = 42

# Downsampling + SMOTE strategy
MAX_SAMPLES = 500_000  # Max samples for majority class before SMOTE
TARGET_RATIO = 1.0     # 1:1 ratio (majority:minority) after SMOTE

# =============================================================================
# Dataset Loading
# =============================================================================

def load_syn_dataset() -> pd.DataFrame:
    """Load Syn.csv dataset"""
    syn_path = RAW_DIR / "Syn" / "Syn.csv"
    
    if not syn_path.exists():
        raise FileNotFoundError(f"Syn.csv not found: {syn_path}")
    
    print(f"  📂 Loading {syn_path.name}...")
    df = pd.read_csv(syn_path, low_memory=False)
    
    # Clean column names - strip whitespace
    df.columns = df.columns.str.strip()
    
    print(f"  ✓ Loaded {len(df):,} records with {len(df.columns)} columns")
    return df


def load_mitm_datasets() -> pd.DataFrame:
    """Load and combine all MITM ARP datasets"""
    mitm_dir = RAW_DIR / "mitm_arp"
    
    if not mitm_dir.exists():
        raise FileNotFoundError(f"MITM directory not found: {mitm_dir}")
    
    csv_files = list(mitm_dir.glob("*.csv"))
    
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in {mitm_dir}")
    
    print(f"  📂 Found {len(csv_files)} MITM CSV file(s)")
    
    dfs = []
    for csv_file in tqdm(csv_files, desc="  Loading MITM files", unit="file"):
        df = pd.read_csv(csv_file, low_memory=False)
        print(f"    {csv_file.name}: {len(df):,} rows")
        dfs.append(df)
    
    # Combine all datasets
    combined_df = pd.concat(dfs, ignore_index=True)
    
    print(f"  ✓ Combined {len(combined_df):,} records with {len(combined_df.columns)} columns")
    return combined_df


def load_dns_datasets(feature_type: str) -> pd.DataFrame:
    """Load and combine all DNS exfiltration datasets (stateless or stateful)"""
    dns_dir = RAW_DIR / "CIC-Bell-DNS-EXF-2021"
    
    if not dns_dir.exists():
        raise FileNotFoundError(f"DNS dataset directory not found: {dns_dir}")
    
    pattern = f"{feature_type}_features-*.csv"
    print(f"  📂 Loading DNS {feature_type} features from {dns_dir.name}...")
    
    all_dfs = []
    # Only load Attack_heavy_Benign and Attack_Light_Benign folders
    # Skip standalone Benign/ folder since benign samples are already in excess (61%)
    folders = ["Attack_heavy_Benign", "Attack_Light_Benign"]
    
    for folder in folders:
        folder_path = dns_dir / folder
        if not folder_path.exists():
            print(f"    ⚠️  Folder not found: {folder}")
            continue
        
        subfolders = ["Attacks", "Benign"] if folder != "Benign" else ["."]
        
        for subfolder in subfolders:
            if subfolder == ".":
                search_path = folder_path
                label = "BENIGN"
            else:
                search_path = folder_path / subfolder
                label = "DNS_EXFILTRATION" if subfolder == "Attacks" else "BENIGN"
            
            if not search_path.exists():
                continue
            
            csv_files = list(search_path.glob(pattern))
            if csv_files:
                print(f"    📁 {folder}/{subfolder if subfolder != '.' else ''}: {len(csv_files)} files")
                for csv_file in csv_files:
                    df = pd.read_csv(csv_file, low_memory=False)
                    df['label'] = label
                    all_dfs.append(df)
    
    if not all_dfs:
        raise FileNotFoundError(f"No {feature_type} CSV files found")
    
    combined = pd.concat(all_dfs, ignore_index=True)
    
    if 'timestamp' in combined.columns:
        combined = combined.drop(columns=['timestamp'])
    
    print(f"  ✓ Combined total: {len(combined):,} records")
    label_dist = combined['label'].value_counts()
    for label, count in label_dist.items():
        pct = (count / len(combined)) * 100
        print(f"     {label:20s}: {count:8,} ({pct:5.2f}%)")
    
    return combined


# =============================================================================
# Data Cleaning
# =============================================================================

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Remove invalid/missing data"""
    print("\n  🧹 Cleaning data...")
    
    initial_count = len(df)
    
    # Convert all feature columns to numeric, coercing errors to NaN
    label_cols = ['label', 'Label']
    feature_cols = [col for col in df.columns if col not in label_cols]
    
    for col in feature_cols:
        if df[col].dtype == 'object':
            print(f"    ⚠️  Converting {col} from object to numeric...")
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Remove rows with missing values
    missing_count = df.isnull().sum().sum()
    if missing_count > 0:
        print(f"    ⚠️  Found {missing_count:,} missing values")
        df = df.dropna()
    
    # Remove infinite values
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].replace([np.inf, -np.inf], np.nan)
    df = df.dropna()
    
    # DON'T remove duplicates for DNS - repetitive patterns are real traffic!
    # Duplicates in DNS exfiltration are FEATURES, not noise
    dups = df.duplicated().sum()
    if dups > 0:
        print(f"    ℹ️  Found {dups:,} duplicate rows (keeping them - they represent real patterns)")
    
    removed = initial_count - len(df)
    pct = (removed / initial_count) * 100 if initial_count > 0 else 0
    
    print(f"    ✓ Cleaned: {removed:,} rows removed ({pct:.1f}%)")
    print(f"    ✓ Remaining: {len(df):,} rows")
    
    return df


# =============================================================================
# Feature Selection - Use Raw Columns
# =============================================================================

def select_features_syn(df: pd.DataFrame) -> pd.DataFrame:
    """Select 30 Syn features + label"""
    print("\n  ⚙️  Selecting Syn features...")
    
    # Find label column (has space prefix ' Label')
    label_col = None
    for col in df.columns:
        if 'label' in col.lower():
            label_col = col
            break
    
    if not label_col:
        raise ValueError("Label column not found in Syn dataset")
    
    # Check which features exist
    available_features = []
    missing_features = []
    
    for feat in SYN_FEATURES:
        if feat in df.columns:
            available_features.append(feat)
        else:
            missing_features.append(feat)
    
    if missing_features:
        print(f"    ⚠️  Missing {len(missing_features)} features:")
        for feat in missing_features[:5]:
            print(f"       - {feat}")
        if len(missing_features) > 5:
            print(f"       ... and {len(missing_features) - 5} more")
    
    print(f"    ✓ Selected {len(available_features)}/{len(SYN_FEATURES)} features + label")
    
    # Return DataFrame with available features + label
    result_df = df[available_features + [label_col]].copy()
    result_df.rename(columns={label_col: 'Label'}, inplace=True)
    
    return result_df


def select_features_mitm(df: pd.DataFrame) -> pd.DataFrame:
    """Select 26 MITM features + label"""
    print("\n  ⚙️  Selecting MITM features...")
    
    # Find label column
    label_col = None
    for col in df.columns:
        if col.lower() == 'label':
            label_col = col
            break
    
    if not label_col:
        raise ValueError("Label column not found in MITM dataset")
    
    # First, drop application layer columns (mostly NaN for ARP attacks)
    app_cols = [
        'application_name', 'application_category_name', 'application_is_guessed',
        'application_confidence', 'requested_server_name', 'client_fingerprint',
        'server_fingerprint', 'user_agent', 'content_type'
    ]
    
    cols_to_drop = [col for col in app_cols if col in df.columns]
    if cols_to_drop:
        print(f"    🗑️  Dropping {len(cols_to_drop)} application layer columns (mostly NaN)")
        df = df.drop(columns=cols_to_drop)
    
    # Check which features exist
    available_features = []
    missing_features = []
    
    for feat in MITM_FEATURES:
        if feat in df.columns:
            available_features.append(feat)
        else:
            missing_features.append(feat)
    
    if missing_features:
        print(f"    ⚠️  Missing {len(missing_features)} features:")
        for feat in missing_features[:5]:
            print(f"       - {feat}")
        if len(missing_features) > 5:
            print(f"       ... and {len(missing_features) - 5} more")
    
    print(f"    ✓ Selected {len(available_features)}/{len(MITM_FEATURES)} features + label")
    
    # Return DataFrame with available features + label
    result_df = df[available_features + [label_col]].copy()
    result_df.rename(columns={label_col: 'Label'}, inplace=True)
    
    return result_df


def select_features_dns(df: pd.DataFrame, feature_type: str) -> pd.DataFrame:
    """Select DNS features (stateless or stateful) + label"""
    print(f"\n  ⚙️  Selecting DNS {feature_type} features...")
    
    if 'label' not in df.columns:
        raise ValueError("Label column not found in DNS dataset")
    
    feature_list = DNS_STATELESS_FEATURES if feature_type == 'stateless' else DNS_STATEFUL_FEATURES
    
    available_features = []
    missing_features = []
    
    for feat in feature_list:
        if feat in df.columns:
            available_features.append(feat)
        else:
            missing_features.append(feat)
    
    if missing_features:
        print(f"    ⚠️  Missing {len(missing_features)} features:")
        for feat in missing_features[:5]:
            print(f"       - {feat}")
    
    print(f"    ✓ Selected {len(available_features)}/{len(feature_list)} features + label")
    
    result_df = df[available_features + ['label']].copy()
    return result_df


# =============================================================================
# Label Mapping
# =============================================================================

def map_labels(df: pd.DataFrame, dataset_type: str) -> pd.DataFrame:
    """Map dataset-specific labels to canonical labels"""
    print("\n  🏷️  Mapping labels...")
    
    # Normalize labels
    df['Label'] = df['Label'].astype(str).str.strip()
    
    if dataset_type == 'Syn':
        label_map = {
            'Syn': 'DDoS_SYN',
            'BENIGN': 'BENIGN'
        }
    elif dataset_type == 'mitm_arp':
        label_map = {
            'normal': 'BENIGN',
            'arp_spoofing': 'MITM_ARP'
        }
    else:
        raise ValueError(f"Unknown dataset type: {dataset_type}")
    
    # Apply mapping
    df['label'] = df['Label'].map(label_map)
    
    # Check for unmapped labels
    unmapped = df[df['label'].isna()]
    if len(unmapped) > 0:
        print(f"    ⚠️  Found {len(unmapped)} unmapped labels:")
        print(f"       {unmapped['Label'].unique()}")
        print(f"    ⚠️  Dropping unmapped rows...")
        df = df[~df['label'].isna()]
    
    # Show distribution
    label_dist = df['label'].value_counts()
    print(f"    ✓ Mapped to {len(label_dist)} classes:")
    total = len(df)
    for label, count in label_dist.items():
        pct = (count / total) * 100
        print(f"       {label:15s}: {count:8,} ({pct:5.2f}%)")
    
    # Calculate imbalance ratio
    if len(label_dist) == 2:
        ratio = label_dist.max() / label_dist.min()
        print(f"    ⚖️  Imbalance Ratio: {ratio:.1f}:1")
    
    # Drop original Label column
    df = df.drop(columns=['Label'])
    
    return df


# =============================================================================
# Advanced Imbalance Handling
# =============================================================================

def balance_data_aggressive(X: pd.DataFrame, y: pd.Series, dataset_type: str) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Aggressive balancing strategy:
    1. Downsample majority class to MAX_SAMPLES (500k)
    2. SMOTE minority class to achieve TARGET_RATIO (1:1)
    """
    print("\n  ⚖️  Balancing data (aggressive strategy)...")
    
    # Show original distribution
    original_dist = y.value_counts()
    print(f"    📊 Original distribution:")
    for label, count in original_dist.items():
        print(f"       {label:15s}: {count:8,}")
    
    # Identify majority and minority classes
    majority_class = original_dist.idxmax()
    minority_class = original_dist.idxmin()
    
    majority_count = original_dist[majority_class]
    minority_count = original_dist[minority_class]
    
    print(f"\n    🎯 Strategy:")
    print(f"       Majority ({majority_class}): {majority_count:,} → {MAX_SAMPLES:,}")
    print(f"       Minority ({minority_class}): {minority_count:,} → {int(MAX_SAMPLES * TARGET_RATIO):,}")
    print(f"       Target Ratio: {TARGET_RATIO}:1")
    
    # Step 1: Downsample majority class
    if majority_count > MAX_SAMPLES:
        print(f"\n    ⬇️  Downsampling {majority_class} to {MAX_SAMPLES:,}...")
        
        undersampler = RandomUnderSampler(
            sampling_strategy={majority_class: MAX_SAMPLES},
            random_state=RANDOM_STATE
        )
        
        X_downsampled, y_downsampled = undersampler.fit_resample(X, y)
        
        downsampled_dist = pd.Series(y_downsampled).value_counts()
        print(f"       ✓ After downsampling:")
        for label, count in downsampled_dist.items():
            print(f"          {label:15s}: {count:8,}")
    else:
        print(f"\n    ℹ️  Majority class ({majority_count:,}) already < {MAX_SAMPLES:,}, skipping downsampling")
        X_downsampled = X
        y_downsampled = y
    
    # Step 2: Calculate target counts based on current majority
    current_majority = pd.Series(y_downsampled).value_counts()[majority_class]
    current_minority = pd.Series(y_downsampled).value_counts()[minority_class]
    
    # Target minority should match majority (for 1:1) or be proportional
    target_minority_count = int(current_majority * TARGET_RATIO)
    
    if current_minority < target_minority_count:
        print(f"\n    ⬆️  SMOTE {minority_class} from {current_minority:,} to {target_minority_count:,}...")
        
        # Calculate SMOTE sampling strategy
        sampling_strategy = {minority_class: target_minority_count}
        
        # Determine k_neighbors (must be < minority samples)
        k_neighbors = min(5, current_minority - 1)
        
        if k_neighbors < 1:
            print(f"       ⚠️  Too few minority samples ({current_minority}), skipping SMOTE")
            X_balanced = X_downsampled
            y_balanced = y_downsampled
        else:
            smote = SMOTE(
                sampling_strategy=sampling_strategy,
                random_state=RANDOM_STATE,
                k_neighbors=k_neighbors
            )
            
            X_balanced, y_balanced = smote.fit_resample(X_downsampled, y_downsampled)
            
            print(f"       ✓ After SMOTE (k_neighbors={k_neighbors}):")
            final_dist = pd.Series(y_balanced).value_counts()
            for label, count in final_dist.items():
                print(f"          {label:15s}: {count:8,}")
    else:
        print(f"\n    ℹ️  Minority class already sufficient ({current_minority:,} >= {target_minority_count:,}), skipping SMOTE")
        X_balanced = X_downsampled
        y_balanced = y_downsampled
    
    # Final stats
    final_dist = pd.Series(y_balanced).value_counts()
    final_ratio = final_dist.max() / final_dist.min()
    
    print(f"\n    ✅ Final distribution:")
    total_final = len(y_balanced)
    for label, count in final_dist.items():
        pct = (count / total_final) * 100
        print(f"       {label:15s}: {count:8,} ({pct:5.2f}%)")
    print(f"    ✅ Final Ratio: {final_ratio:.2f}:1")
    
    return pd.DataFrame(X_balanced, columns=X.columns), pd.Series(y_balanced, name='label')


# =============================================================================
# Compute Class Weights
# =============================================================================

def compute_class_weights_dict(y: pd.Series) -> Dict[str, float]:
    """Compute class weights for imbalanced data"""
    print("\n  ⚖️  Computing class weights...")
    
    # Get unique classes
    classes = y.unique()
    
    # Compute weights using sklearn
    weights = compute_class_weight('balanced', classes=classes, y=y)
    
    # Create dictionary
    class_weights = {cls: float(weight) for cls, weight in zip(classes, weights)}
    
    print(f"    ✓ Class weights:")
    for cls, weight in class_weights.items():
        print(f"       {cls:15s}: {weight:.4f}")
    
    return class_weights


# =============================================================================
# Data Splitting
# =============================================================================

def split_data(df: pd.DataFrame, features: List[str]) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Split into train/val/test sets"""
    print("\n  ✂️  Splitting data...")
    
    # Split features and labels
    X = df[features]
    y = df['label']
    
    # First split: train + (val+test)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=(VAL_SIZE + TEST_SIZE), random_state=RANDOM_STATE, stratify=y
    )
    
    # Second split: val + test
    relative_test_size = TEST_SIZE / (VAL_SIZE + TEST_SIZE)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=relative_test_size, random_state=RANDOM_STATE, stratify=y_temp
    )
    
    # Combine back into DataFrames
    train_df = X_train.copy()
    train_df['label'] = y_train.values
    
    val_df = X_val.copy()
    val_df['label'] = y_val.values
    
    test_df = X_test.copy()
    test_df['label'] = y_test.values
    
    print(f"    ✓ Train: {len(train_df):8,} samples ({TRAIN_SIZE*100:.0f}%)")
    print(f"    ✓ Val:   {len(val_df):8,} samples ({VAL_SIZE*100:.0f}%)")
    print(f"    ✓ Test:  {len(test_df):8,} samples ({TEST_SIZE*100:.0f}%)")
    
    return train_df, val_df, test_df


# =============================================================================
# Normalization
# =============================================================================

def normalize_features(train_df: pd.DataFrame, val_df: pd.DataFrame, test_df: pd.DataFrame, 
                      features: List[str]) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, StandardScaler]:
    """Normalize features using StandardScaler"""
    print("\n  📐 Normalizing features...")
    
    scaler = StandardScaler()
    
    # Fit on training data only
    train_df[features] = scaler.fit_transform(train_df[features])
    
    # Transform val and test
    val_df[features] = scaler.transform(val_df[features])
    test_df[features] = scaler.transform(test_df[features])
    
    print(f"    ✓ Features normalized (mean=0, std=1)")
    
    return train_df, val_df, test_df, scaler


# =============================================================================
# Save Processed Data
# =============================================================================

def save_processed_data(train_df: pd.DataFrame, val_df: pd.DataFrame, test_df: pd.DataFrame, 
                       dataset_name: str, features: List[str], class_weights_original: Dict[str, float],
                       class_weights_balanced: Dict[str, float], scaler=None):
    """Save processed data to parquet files with metadata"""
    print("\n  💾 Saving processed data...")
    
    output_dir = PROCESSED_DIR / dataset_name
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save parquet files
    train_df.to_parquet(output_dir / "train.parquet", index=False)
    val_df.to_parquet(output_dir / "val.parquet", index=False)
    test_df.to_parquet(output_dir / "test.parquet", index=False)
    
    # Determine normalization status
    normalization_method = "StandardScaler" if scaler is not None else "None (raw features)"
    
    # Save metadata
    metadata = {
        "dataset_name": dataset_name,
        "features": features,
        "num_features": len(features),
        "label_distribution": {
            "train": {k: int(v) for k, v in train_df['label'].value_counts().items()},
            "val": {k: int(v) for k, v in val_df['label'].value_counts().items()},
            "test": {k: int(v) for k, v in test_df['label'].value_counts().items()}
        },
        "sizes": {
            "train": int(len(train_df)),
            "val": int(len(val_df)),
            "test": int(len(test_df)),
            "total": int(len(train_df) + len(val_df) + len(test_df))
        },
        "class_weights": {
            "original": class_weights_original,
            "balanced": class_weights_balanced
        },
        "preprocessing": {
            "normalization": normalization_method,
            "imbalance_handling": "Natural distribution (no SMOTE for DNS)" if 'dns' in dataset_name else "RandomUnderSampler + SMOTE",
            "max_samples": MAX_SAMPLES,
            "target_ratio": TARGET_RATIO,
            "random_state": RANDOM_STATE
        }
    }
    
    with open(output_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"    ✓ Saved to {output_dir}/")
    print(f"       - train.parquet ({len(train_df):,} records)")
    print(f"       - val.parquet ({len(val_df):,} records)")
    print(f"       - test.parquet ({len(test_df):,} records)")
    print(f"       - metadata.json")


# =============================================================================
# Main Processing Pipelines
# =============================================================================

def process_syn_dataset():
    """Process Syn DDoS dataset with aggressive balancing"""
    print(f"\n{'='*80}")
    print(f"📊 PROCESSING SYN FLOOD DATASET")
    print(f"{'='*80}")
    
    # 1. Load
    print("\n1️⃣ Loading data...")
    df = load_syn_dataset()
    
    # 2. Clean
    print("\n2️⃣ Cleaning data...")
    df = clean_data(df)
    
    # 3. Select features (use raw column names)
    print("\n3️⃣ Selecting features...")
    df = select_features_syn(df)
    
    # Get actual feature list (may be subset if some missing)
    feature_cols = [col for col in df.columns if col != 'Label' and col != 'label']
    print(f"    ✓ Using {len(feature_cols)} features")
    
    # 4. Map labels
    print("\n4️⃣ Mapping labels...")
    df = map_labels(df, 'Syn')
    
    # 5. Split BEFORE balancing (to keep val/test untouched)
    print("\n5️⃣ Splitting data...")
    train_df, val_df, test_df = split_data(df, feature_cols)
    
    # Compute original class weights (before balancing)
    y_train_original = train_df['label']
    class_weights_original = compute_class_weights_dict(y_train_original)
    
    # 6. Balance ONLY training data
    print("\n6️⃣ Balancing training data...")
    X_train = train_df[feature_cols]
    y_train = train_df['label']
    
    X_train_balanced, y_train_balanced = balance_data_aggressive(X_train, y_train, 'Syn')
    
    train_df_balanced = X_train_balanced.copy()
    train_df_balanced['label'] = y_train_balanced.values
    
    # Compute balanced class weights
    class_weights_balanced = compute_class_weights_dict(y_train_balanced)
    
    # 7. Normalize (after balancing)
    print("\n7️⃣ Normalizing features...")
    train_df_balanced, val_df, test_df, scaler = normalize_features(
        train_df_balanced, val_df, test_df, feature_cols
    )
    
    # 8. Save
    print("\n8️⃣ Saving...")
    save_processed_data(
        train_df_balanced, val_df, test_df, 'Syn', feature_cols,
        class_weights_original, class_weights_balanced
    )
    
    print(f"\n{'='*80}")
    print(f"✅ SYN DATASET PREPROCESSING COMPLETE!")
    print(f"{'='*80}\n")


def process_mitm_dataset():
    """Process MITM ARP Spoofing datasets"""
    print(f"\n{'='*80}")
    print(f"📊 PROCESSING MITM ARP SPOOFING DATASETS")
    print(f"{'='*80}")
    
    # 1. Load (combine all MITM CSVs)
    print("\n1️⃣ Loading data...")
    df = load_mitm_datasets()
    
    # 2. Select features FIRST (drops application layer columns with NaN)
    print("\n2️⃣ Selecting features...")
    df = select_features_mitm(df)
    
    # 3. Clean AFTER feature selection
    print("\n3️⃣ Cleaning data...")
    df = clean_data(df)
    
    # Get actual feature list
    feature_cols = [col for col in df.columns if col != 'Label' and col != 'label']
    print(f"    ✓ Using {len(feature_cols)} features")
    
    # 4. Map labels
    print("\n4️⃣ Mapping labels...")
    df = map_labels(df, 'mitm_arp')
    
    # 5. Split
    print("\n5️⃣ Splitting data...")
    train_df, val_df, test_df = split_data(df, feature_cols)
    
    # Compute original class weights
    y_train_original = train_df['label']
    class_weights_original = compute_class_weights_dict(y_train_original)
    
    # 6. Balance (MITM should be less severe, but apply same strategy)
    print("\n6️⃣ Balancing training data...")
    X_train = train_df[feature_cols]
    y_train = train_df['label']
    
    X_train_balanced, y_train_balanced = balance_data_aggressive(X_train, y_train, 'mitm_arp')
    
    train_df_balanced = X_train_balanced.copy()
    train_df_balanced['label'] = y_train_balanced.values
    
    # Compute balanced class weights
    class_weights_balanced = compute_class_weights_dict(y_train_balanced)
    
    # 7. Normalize
    print("\n7️⃣ Normalizing features...")
    train_df_balanced, val_df, test_df, scaler = normalize_features(
        train_df_balanced, val_df, test_df, feature_cols
    )
    
    # 8. Save
    print("\n8️⃣ Saving...")
    save_processed_data(
        train_df_balanced, val_df, test_df, 'mitm_arp', feature_cols,
        class_weights_original, class_weights_balanced
    )
    
    print(f"\n{'='*80}")
    print(f"✅ MITM DATASET PREPROCESSING COMPLETE!")
    print(f"{'='*80}\n")


def process_dns_dataset(feature_type: str):
    """Process DNS Exfiltration dataset (stateless or stateful)"""
    dataset_name = f"dns_{feature_type}"
    print(f"\n{'='*80}")
    print(f"📊 PROCESSING DNS EXFILTRATION DATASET ({feature_type.upper()})")
    print(f"{'='*80}")
    
    # 1. Load
    print("\n1️⃣ Loading data...")
    df = load_dns_datasets(feature_type)
    
    # 2. Select features
    print("\n2️⃣ Selecting features...")
    df = select_features_dns(df, feature_type)
    
    # 3. Clean
    print("\n3️⃣ Cleaning data...")
    df = clean_data(df)
    
    feature_cols = [col for col in df.columns if col != 'label']
    print(f"    ✓ Using {len(feature_cols)} features")
    
    # 4. Skip SMOTE for DNS datasets - preserve natural distribution
    print("\n4️⃣ Handling class distribution...")
    X = df[feature_cols]
    y = df['label']
    
    # Compute original class weights
    class_weights_original = compute_class_weights_dict(y)
    
    label_counts = y.value_counts()
    print(f"    📊 Original distribution:")
    for label, count in label_counts.items():
        print(f"       {label:20s}: {count:8,}")
    
    # DNS exfiltration has natural ~61% BENIGN / 39% EXFIL ratio
    # SMOTE + scale_pos_weight conflict causes severe attack-bias
    # Solution: Keep natural distribution and let XGBoost handle imbalance via scale_pos_weight
    print("\n    ℹ️  Skipping SMOTE for DNS dataset (preserving natural class distribution)")
    print("    💡 XGBoost will handle imbalance via scale_pos_weight computed from actual train data")
    df_balanced = df.copy()
    
    # 5. Split data with natural distribution
    print("\n5️⃣ Splitting data...")
    train_df, val_df, test_df = split_data(df_balanced, feature_cols)
    
    # Compute class weights from actual training data (NOT original full dataset)
    class_weights_balanced = compute_class_weights_dict(train_df['label'])
    
    print(f"\n    📊 Training set distribution:")
    train_counts = train_df['label'].value_counts()
    for label, count in train_counts.items():
        print(f"       {label:20s}: {count:8,}")
    
    # 6. Skip normalization for DNS datasets
    # Tree-based models (XGBoost) don't need normalized features
    # Normalization destroys discriminative power by collapsing distinct ranges
    print("\n6️⃣ Skipping normalization for DNS dataset...")
    print("    💡 Tree models split on thresholds, not distances")
    print("    💡 Preserving original feature ranges for better separability")
    scaler = None
    
    # 7. Save
    print("\n7️⃣ Saving...")
    save_processed_data(
        train_df, val_df, test_df, dataset_name, feature_cols,
        class_weights_original, class_weights_balanced, scaler
    )
    
    print(f"\n{'='*80}")
    print(f"✅ DNS {feature_type.upper()} DATASET PREPROCESSING COMPLETE!")
    print(f"{'='*80}\n")


# =============================================================================
# Main
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Aegis IDS Advanced Preprocessing Pipeline v3")
    parser.add_argument("--all", action="store_true", help="Process all datasets")
    parser.add_argument("--dataset", type=str, 
                       choices=['Syn', 'mitm_arp', 'dns_stateless', 'dns_stateful', 'dns'], 
                       help="Process specific dataset")
    args = parser.parse_args()
    
    print("\n" + "="*80)
    print("🛡️  AEGIS IDS - ADVANCED PREPROCESSING PIPELINE V3")
    print("="*80)
    print("\n📌 Strategy:")
    print(f"   - Downsample majority → {MAX_SAMPLES:,} samples")
    print(f"   - SMOTE minority → {TARGET_RATIO}:1 ratio")
    print(f"   - Compute class weights for model training")
    print()
    
    if args.all:
        process_syn_dataset()
        process_mitm_dataset()
        process_dns_dataset('stateless')
        process_dns_dataset('stateful')
    
    elif args.dataset == 'Syn':
        process_syn_dataset()
    
    elif args.dataset == 'mitm_arp':
        process_mitm_dataset()
    
    elif args.dataset == 'dns_stateless':
        process_dns_dataset('stateless')
    
    elif args.dataset == 'dns_stateful':
        process_dns_dataset('stateful')
    
    elif args.dataset == 'dns':
        process_dns_dataset('stateless')
        process_dns_dataset('stateful')
    
    else:
        print("❌ Please specify --all or --dataset <Syn|mitm_arp|dns_stateless|dns_stateful|dns>")
        print("\nUsage:")
        print("  python -m backend.ids.data_pipeline.pipeline_v3 --all")
        print("  python -m backend.ids.data_pipeline.pipeline_v3 --dataset dns")
        print("  python -m backend.ids.data_pipeline.pipeline_v3 --dataset dns_stateless")
        return
    
    print("\n" + "="*80)
    print("✅ ALL PREPROCESSING COMPLETE!")
    print("="*80)


if __name__ == "__main__":
    main()
