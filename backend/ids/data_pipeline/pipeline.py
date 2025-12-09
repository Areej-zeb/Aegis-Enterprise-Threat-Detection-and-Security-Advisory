"""
Aegis IDS - Multi-Dataset Preprocessing Pipeline v2

Auto-discovers datasets in raw/ subdirectories and processes them independently.

Expected structure:
    datasets/raw/
        cicddos2019/
            *.csv
        mitm_arp/
            *.csv
        Syn/
            Syn.csv
        
Output structure:
    datasets/processed/
        cicddos2019/
            train.parquet
            val.parquet
            test.parquet
            metadata.json
        mitm_arp/
            train.parquet
            ...
        Syn/
            train.parquet
            ...

Usage:
    # Process all datasets
    python -m backend.ids.data_pipeline.pipeline_v2 --all
    
    # Process specific dataset
    python -m backend.ids.data_pipeline.pipeline_v2 --dataset Syn
"""

import argparse
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
from tqdm import tqdm
import warnings
warnings.filterwarnings('ignore')

from backend.ids.schemas import FEATURES, LABELS

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
SMOTE_RATIO = 0.5

# =============================================================================
# Dataset Auto-Discovery
# =============================================================================

def discover_datasets() -> List[Path]:
    """Discover all dataset subdirectories in datasets/raw/"""
    if not RAW_DIR.exists():
        raise FileNotFoundError(f"Raw directory not found: {RAW_DIR}")
    
    datasets = [d for d in RAW_DIR.iterdir() if d.is_dir()]
    return sorted(datasets)


def load_dataset_files(dataset_dir: Path) -> pd.DataFrame:
    """Load all CSV/Parquet files from a dataset directory"""
    files = list(dataset_dir.glob("*.csv")) + list(dataset_dir.glob("*.parquet"))
    
    if not files:
        raise FileNotFoundError(f"No CSV/Parquet files found in {dataset_dir}")
    
    print(f"  📂 Found {len(files)} file(s)")
    dfs = []
    
    for file_path in tqdm(files, desc="  Loading files", unit="file"):
        if file_path.suffix.lower() == ".csv":
            df = pd.read_csv(file_path, low_memory=False)
        else:
            df = pd.read_parquet(file_path)
        dfs.append(df)
    
    df = pd.concat(dfs, ignore_index=True)
    print(f"  ✓ Loaded {len(df):,} records with {len(df.columns)} columns")
    return df


# =============================================================================
# Data Cleaning
# =============================================================================

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Remove invalid/missing data"""
    print("  🧹 Cleaning data...")
    
    # Clean column names - strip whitespace
    df.columns = df.columns.str.strip()
    
    initial_count = len(df)
    
    # Remove rows with missing values
    missing_count = df.isnull().sum().sum()
    if missing_count > 0:
        print(f"  ⚠️  Found {missing_count:,} missing values")
    
    df = df.dropna()
    
    # Remove infinite values
    df = df.replace([np.inf, -np.inf], np.nan).dropna()
    
    # Remove duplicates
    df = df.drop_duplicates()
    
    removed = initial_count - len(df)
    pct = (removed / initial_count) * 100 if initial_count > 0 else 0
    
    print(f"  ✓ Cleaned: {removed:,} rows removed ({pct:.1f}%)")
    return df


# =============================================================================
# Feature Engineering - Flexible Mapping
# =============================================================================

def engineer_dns_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer features for DNS exfiltration datasets.
    Handles both stateless and stateful DNS features.
    """
    print("  ⚙️  Engineering DNS features...")
    
    # Normalize column names
    df.columns = df.columns.str.strip()
    
    # Detect feature type
    has_stateless = 'FQDN_count' in df.columns or 'subdomain_length' in df.columns
    has_stateful = 'A_frequency' in df.columns or 'rr_count' in df.columns
    
    feature_df = df.copy()
    
    if has_stateless:
        print("    → Processing stateless features")
        # Remove timestamp
        if 'timestamp' in feature_df.columns:
            feature_df = feature_df.drop('timestamp', axis=1)
        
        # Convert object columns to numeric
        if 'longest_word' in feature_df.columns:
            feature_df['longest_word_len'] = feature_df['longest_word'].astype(str).str.len()
            feature_df = feature_df.drop('longest_word', axis=1)
        
        if 'sld' in feature_df.columns:
            feature_df['sld_len'] = feature_df['sld'].astype(str).str.len()
            feature_df = feature_df.drop('sld', axis=1)
    
    if has_stateful:
        print("    → Processing stateful features")
        # Remove high-cardinality and text columns
        cols_to_remove = ['rr', 'rr_type', 'distinct_ip', 'unique_country', 
                         'unique_asn', 'distinct_domains', 'reverse_dns', 'unique_ttl']
        for col in cols_to_remove:
            if col in feature_df.columns:
                feature_df = feature_df.drop(col, axis=1)
    
    print(f"    ✓ Engineered {len([c for c in feature_df.columns if c not in ['label', 'attack_type', 'Label']])} features")
    return feature_df

def engineer_features(df: pd.DataFrame, dataset_name: str) -> pd.DataFrame:
    """Engineer features based on available columns in dataset"""
    print("  ⚙️  Engineering features...")
    
    # Check if this is a DNS dataset
    if 'dns' in dataset_name.lower() or 'FQDN_count' in df.columns or 'A_frequency' in df.columns:
        return engineer_dns_features(df)
    
    # Normalize column names
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('/', '_')
    
    # Initialize feature dict
    features = {}
    
    # Flow duration
    if 'flow_duration' in df.columns:
        features['flow_duration'] = df['flow_duration'] / 1_000_000.0  # microseconds to seconds
    elif 'duration' in df.columns:
        features['flow_duration'] = df['duration']
    elif 'bidirectional_duration_ms' in df.columns:
        features['flow_duration'] = df['bidirectional_duration_ms'] / 1000.0
    else:
        features['flow_duration'] = 0.0
    
    # Packet counts
    if 'total_fwd_packets' in df.columns:
        fwd_pkts = df['total_fwd_packets']
        bwd_pkts = df.get('total_backward_packets', 0)
    elif 'bidirectional_packets' in df.columns:
        total_pkts = df['bidirectional_packets']
        fwd_pkts = df.get('src2dst_packets', total_pkts / 2)
        bwd_pkts = df.get('dst2src_packets', total_pkts / 2)
    else:
        fwd_pkts = 0
        bwd_pkts = 0
    
    total_packets = fwd_pkts + bwd_pkts
    
    # Packet rates
    features['flow_packets_per_s'] = total_packets / (features['flow_duration'] + 1e-6)
    features['fwd_packets_per_s'] = fwd_pkts / (features['flow_duration'] + 1e-6)
    features['bwd_packets_per_s'] = bwd_pkts / (features['flow_duration'] + 1e-6)
    
    # Byte counts
    if 'total_length_of_fwd_packets' in df.columns:
        fwd_bytes = df['total_length_of_fwd_packets']
        bwd_bytes = df.get('total_length_of_bwd_packets', 0)
    elif 'bidirectional_bytes' in df.columns:
        total_bytes = df['bidirectional_bytes']
        fwd_bytes = df.get('src2dst_bytes', total_bytes / 2)
        bwd_bytes = df.get('dst2src_bytes', total_bytes / 2)
    else:
        fwd_bytes = 0
        bwd_bytes = 0
    
    total_bytes = fwd_bytes + bwd_bytes
    
    # Byte rate
    features['flow_bytes_per_s'] = total_bytes / (features['flow_duration'] + 1e-6)
    
    # Packet length statistics
    if 'packet_length_mean' in df.columns:
        features['pkt_len_mean'] = df['packet_length_mean']
        features['pkt_len_std'] = df.get('packet_length_std', 0)
        features['pkt_len_max'] = df.get('max_packet_length', 0)
    elif 'bidirectional_mean_ps' in df.columns:
        features['pkt_len_mean'] = df['bidirectional_mean_ps']
        features['pkt_len_std'] = df.get('bidirectional_stddev_ps', 0)
        features['pkt_len_max'] = total_bytes / (total_packets + 1e-6) * 2
    else:
        features['pkt_len_mean'] = total_bytes / (total_packets + 1e-6)
        features['pkt_len_std'] = 0
        features['pkt_len_max'] = features['pkt_len_mean'] * 2
    
    # Forward/backward packet length means
    features['fwd_pkt_len_mean'] = fwd_bytes / (fwd_pkts + 1e-6)
    features['bwd_pkt_len_mean'] = bwd_bytes / (bwd_pkts + 1e-6)
    
    # Inter-arrival times
    if 'flow_iat_mean' in df.columns:
        features['flow_iat_mean'] = df['flow_iat_mean']
        features['fwd_iat_mean'] = df.get('fwd_iat_mean', df['flow_iat_mean'])
        features['bwd_iat_mean'] = df.get('bwd_iat_mean', df['flow_iat_mean'])
    elif 'bidirectional_mean_piat_ms' in df.columns:
        features['flow_iat_mean'] = df['bidirectional_mean_piat_ms']
        features['fwd_iat_mean'] = df.get('src2dst_mean_piat_ms', df['bidirectional_mean_piat_ms'])
        features['bwd_iat_mean'] = df.get('dst2src_mean_piat_ms', df['bidirectional_mean_piat_ms'])
    else:
        features['flow_iat_mean'] = features['flow_duration'] / (total_packets + 1e-6)
        features['fwd_iat_mean'] = features['flow_iat_mean']
        features['bwd_iat_mean'] = features['flow_iat_mean']
    
    # TCP flag ratios
    if 'syn_flag_count' in df.columns:
        syn_count = df['syn_flag_count']
        rst_count = df.get('rst_flag_count', 0)
        ack_count = df.get('ack_flag_count', 0)
    elif 'bidirectional_syn_packets' in df.columns:
        syn_count = df['bidirectional_syn_packets']
        rst_count = df.get('bidirectional_rst_packets', 0)
        ack_count = df.get('bidirectional_ack_packets', 0)
    else:
        syn_count = 0
        rst_count = 0
        ack_count = 0
    
    features['syn_ratio'] = syn_count / (total_packets + 1e-6)
    features['rst_ratio'] = rst_count / (total_packets + 1e-6)
    features['ack_ratio'] = ack_count / (total_packets + 1e-6)
    
    # Create DataFrame from features
    feature_df = pd.DataFrame(features)
    
    # Preserve label column
    label_col = None
    for possible_label in ['label', 'attack', 'attack_type', 'category']:
        if possible_label in df.columns:
            label_col = possible_label
            break
    
    if label_col:
        feature_df['Label'] = df[label_col]
    
    # Verify all required features exist
    missing_features = set(FEATURES) - set(feature_df.columns)
    if missing_features:
        print(f"  ⚠️  Missing features: {missing_features}")
        # Fill with zeros
        for feat in missing_features:
            feature_df[feat] = 0.0
    
    print(f"  ✓ Engineered {len(FEATURES)} features")
    
    return feature_df[FEATURES + (['Label'] if 'Label' in feature_df.columns else [])]


# =============================================================================
# Label Mapping
# =============================================================================

def map_labels(df: pd.DataFrame, dataset_name: str) -> pd.DataFrame:
    """Map dataset-specific labels to canonical labels"""
    print("  🏷️  Mapping labels...")
    
    if 'Label' not in df.columns:
        # Check for 'label' or 'attack_type' columns (DNS datasets)
        if 'label' in df.columns:
            # DNS dataset already has label column
            label_dist = df['label'].value_counts()
            print(f"  ✓ Using existing label column: {list(label_dist.index)}")
            for label, count in label_dist.items():
                print(f"    {str(label):15s}: {count:,} samples")
            return df
        
        print("  ⚠️  No Label column found, adding 'unknown'")
        df['label'] = 'unknown'
        return df
    
    # Normalize labels
    df['Label'] = df['Label'].astype(str).str.strip()
    
    # Dataset-specific mapping
    label_map = {}
    
    # DNS Exfiltration
    if 'dns' in dataset_name.lower() or 'exfiltration' in dataset_name.lower():
        # DNS datasets use 'attack_type' column for original labels
        if 'attack_type' in df.columns:
            df['label'] = df['attack_type'].apply(lambda x: 1 if x == 'dns_exfiltration' else 0)
            label_dist = df['label'].value_counts()
            print(f"  ✓ DNS exfiltration dataset: Binary classification (0=benign, 1=exfiltration)")
            for label, count in label_dist.items():
                label_name = 'dns_exfiltration' if label == 1 else 'benign'
                print(f"    {label_name:15s}: {count:,} samples")
            return df
        else:
            # Fallback: treat as binary
            df['label'] = df['Label'].apply(lambda x: 'dns_exfiltration' if str(x).lower() != 'benign' else 'benign')
            return df
    
    # Syn dataset
    if dataset_name.lower() in ['syn']:
        label_map = {
            'Syn': 'DDoS_SYN',
            'BENIGN': 'BENIGN'
        }
    
    # CICDDoS2019
    elif 'ddos' in dataset_name.lower():
        label_map = {
            'BENIGN': 'BENIGN',
            'DrDoS_DNS': 'DDoS_DNS',
            'DrDoS_LDAP': 'DDoS_LDAP',
            'DrDoS_MSSQL': 'DDoS_MSSQL',
            'DrDoS_NTP': 'DDoS_NTP',
            'DrDoS_NetBIOS': 'DDoS_NetBIOS',
            'DrDoS_SNMP': 'DDoS_SNMP',
            'DrDoS_SSDP': 'DDoS_SSDP',
            'DrDoS_UDP': 'DDoS_UDP',
            'Syn': 'DDoS_SYN',
            'UDP-lag': 'DDoS_UDP',
        }
    
    # MITM_ARP
    elif 'mitm' in dataset_name.lower() or 'arp' in dataset_name.lower():
        label_map = {
            'BENIGN': 'BENIGN',
            'ARP_poisoning': 'Spoofing',
            'MITM': 'Spoofing',
        }
    
    # Default: try to match to canonical labels
    else:
        # Auto-detect mapping
        unique_labels = df['Label'].unique()
        for orig_label in unique_labels:
            orig_lower = orig_label.lower()
            if 'benign' in orig_lower or 'normal' in orig_lower:
                label_map[orig_label] = 'BENIGN'
            elif 'ddos' in orig_lower or 'dos' in orig_lower:
                label_map[orig_label] = 'DDoS_SYN'
            elif 'port' in orig_lower or 'scan' in orig_lower:
                label_map[orig_label] = 'PortScan'
            elif 'brute' in orig_lower or 'force' in orig_lower:
                label_map[orig_label] = 'BruteForce'
            elif 'bot' in orig_lower:
                label_map[orig_label] = 'Botnet'
            elif 'spoof' in orig_lower or 'mitm' in orig_lower or 'arp' in orig_lower:
                label_map[orig_label] = 'Spoofing'
            else:
                label_map[orig_label] = orig_label
    
    # Apply mapping
    df['label'] = df['Label'].map(label_map).fillna('unknown')
    
    # Show distribution
    label_dist = df['label'].value_counts()
    print(f"  ✓ Mapped to {len(label_dist)} classes: {list(label_dist.index)}")
    for label, count in label_dist.items():
        print(f"    {label:15s}: {count:,} samples")
    
    return df


# =============================================================================
# Data Splitting
# =============================================================================

def split_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Split into train/val/test sets"""
    print("5️⃣ Splitting data...")
    
    # DNS datasets: feature columns are everything except label and attack_type
    label_columns = ['label', 'Label', 'attack_type']
    feature_columns = [col for col in df.columns if col not in label_columns]
    
    # Determine if we have FEATURES constant or use all columns
    if 'label' in df.columns:
        X = df[feature_columns]
        y = df['label']
    else:
        # Fallback to FEATURES constant for network flow datasets
        X = df[FEATURES]
        y = df['label']
    
    # Check class distribution
    class_counts = y.value_counts()
    if len(class_counts) == 0:
        raise ValueError("No valid labels found in dataset")
    
    # Handle stratification
    try:
        # First split: train + (val+test)
        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y, test_size=(VAL_SIZE + TEST_SIZE), random_state=RANDOM_STATE, stratify=y
        )
        
        # Second split: val + test
        relative_test_size = TEST_SIZE / (VAL_SIZE + TEST_SIZE)
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=relative_test_size, random_state=RANDOM_STATE, stratify=y_temp
        )
    except ValueError as e:
        # If stratification fails (too few samples), split without stratify
        print(f"  ⚠️  Stratification failed: {e}. Splitting without stratify.")
        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y, test_size=(VAL_SIZE + TEST_SIZE), random_state=RANDOM_STATE
        )
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=TEST_SIZE / (VAL_SIZE + TEST_SIZE), random_state=RANDOM_STATE
        )
    
    # Combine back into DataFrames
    train_df = X_train.copy()
    train_df['label'] = y_train
    
    val_df = X_val.copy()
    val_df['label'] = y_val
    
    test_df = X_test.copy()
    test_df['label'] = y_test
    
    print(f"  ✓ Train: {len(train_df):,} samples ({TRAIN_SIZE*100:.0f}%)")
    print(f"  ✓ Val:   {len(val_df):,} samples ({VAL_SIZE*100:.0f}%)")
    print(f"  ✓ Test:  {len(test_df):,} samples ({TEST_SIZE*100:.0f}%)")
    
    return train_df, val_df, test_df


# =============================================================================
# Normalization
# =============================================================================

def normalize_features(train_df: pd.DataFrame, val_df: pd.DataFrame, test_df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Normalize features using StandardScaler"""
    print("6️⃣ Normalizing features...")
    
    scaler = StandardScaler()
    
    # Determine feature columns dynamically (everything except labels)
    label_columns = ['label', 'Label', 'attack_type']
    feature_columns = [col for col in train_df.columns if col not in label_columns]
    
    # Fit on training data only
    train_df[feature_columns] = scaler.fit_transform(train_df[feature_columns])
    
    # Transform val and test
    val_df[feature_columns] = scaler.transform(val_df[feature_columns])
    test_df[feature_columns] = scaler.transform(test_df[feature_columns])
    
    print("  ✓ Features normalized (mean=0, std=1)")
    
    return train_df, val_df, test_df


# =============================================================================
# Class Imbalance Handling
# =============================================================================

def handle_imbalance(X: pd.DataFrame, y: pd.Series) -> Tuple[pd.DataFrame, pd.Series]:
    """Handle class imbalance using SMOTE"""
    print("7️⃣ Handling class imbalance...")
    print("  ⚖️  Applying SMOTE...")
    
    initial_dist = y.value_counts()
    print(f"  Before: {dict(initial_dist)}")
    
    smote = SMOTE(
        sampling_strategy=SMOTE_RATIO,
        random_state=RANDOM_STATE,
        k_neighbors=5
    )
    
    X_balanced, y_balanced = smote.fit_resample(X, y)
    
    final_dist = pd.Series(y_balanced).value_counts()
    print(f"  After:  {dict(final_dist)}")
    
    return X_balanced, y_balanced


# =============================================================================
# Save Processed Data
# =============================================================================

def save_processed_data(train_df: pd.DataFrame, val_df: pd.DataFrame, test_df: pd.DataFrame, 
                       dataset_name: str, y_train_balanced: pd.Series):
    """Save processed data to parquet files"""
    print("8️⃣ Saving processed data...")
    
    output_dir = PROCESSED_DIR / dataset_name
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Save parquet files
    train_df.to_parquet(output_dir / "train.parquet", index=False)
    val_df.to_parquet(output_dir / "val.parquet", index=False)
    test_df.to_parquet(output_dir / "test.parquet", index=False)
    
    # Save metadata
    metadata = {
        "dataset_name": dataset_name,
        "features": FEATURES,
        "labels": LABELS,
        "label_distribution": {
            "train": {k: int(v) for k, v in y_train_balanced.value_counts().items()},
            "val": {k: int(v) for k, v in val_df['label'].value_counts().items()},
            "test": {k: int(v) for k, v in test_df['label'].value_counts().items()}
        },
        "sizes": {
            "train": int(len(train_df)),
            "val": int(len(val_df)),
            "test": int(len(test_df)),
            "total": int(len(train_df) + len(val_df) + len(test_df))
        },
        "preprocessing": {
            "normalization": "StandardScaler",
            "imbalance_handling": "SMOTE",
            "smote_ratio": SMOTE_RATIO,
            "random_state": RANDOM_STATE
        }
    }
    
    with open(output_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"  ✓ Saved to {output_dir}/")
    print(f"    - train.parquet ({len(train_df):,} records)")
    print(f"    - val.parquet ({len(val_df):,} records)")
    print(f"    - test.parquet ({len(test_df):,} records)")
    print(f"    - metadata.json\n")


# =============================================================================
# Main Processing Pipeline
# =============================================================================

def preprocess_dataset(dataset_path: Path) -> None:
    """Process a single dataset"""
    dataset_name = dataset_path.name
    
    print(f"\n{'='*70}")
    print(f"📊 Processing Dataset: {dataset_name}")
    print(f"{'='*70}\n")
    
    # 1. Load data
    print("1️⃣ Loading raw data...")
    df = load_dataset_files(dataset_path)
    
    # 2. Clean data
    print("\n2️⃣ Cleaning data...")
    df = clean_data(df)
    
    # 3. Engineer features
    print("\n3️⃣ Engineering features...")
    df = engineer_features(df, dataset_name)
    
    # 4. Map labels
    print("\n4️⃣ Mapping labels...")
    df = map_labels(df, dataset_name)
    
    # 5. Split data
    print()
    train_df, val_df, test_df = split_data(df)
    
    # 6. Normalize
    print()
    train_df, val_df, test_df = normalize_features(train_df, val_df, test_df)
    
    # 7. Handle imbalance (train only)
    print()
    X_train = train_df[FEATURES]
    y_train = train_df['label']
    X_train_balanced, y_train_balanced = handle_imbalance(X_train, y_train)
    
    train_df_balanced = pd.DataFrame(X_train_balanced, columns=FEATURES)
    train_df_balanced['label'] = y_train_balanced
    
    # 8. Save
    print()
    save_processed_data(train_df_balanced, val_df, test_df, dataset_name, y_train_balanced)
    
    print(f"{'='*70}")
    print(f"✅ {dataset_name} preprocessing complete!")
    print(f"{'='*70}\n")


def main():
    parser = argparse.ArgumentParser(description="Aegis IDS Multi-Dataset Preprocessing Pipeline")
    parser.add_argument("--all", action="store_true", help="Process all datasets in raw/")
    parser.add_argument("--dataset", type=str, help="Process specific dataset (folder name)")
    args = parser.parse_args()
    
    print("\n" + "="*70)
    print("🛡️  AEGIS IDS - MULTI-DATASET PREPROCESSING PIPELINE")
    print("="*70 + "\n")
    
    if args.all:
        # Discover and process all datasets
        datasets = discover_datasets()
        print(f"🔍 Discovered {len(datasets)} dataset(s):")
        for d in datasets:
            print(f"   - {d.name}")
        print()
        
        for dataset_path in datasets:
            try:
                preprocess_dataset(dataset_path)
            except Exception as e:
                print(f"❌ Error processing {dataset_path.name}: {e}\n")
                continue
    
    elif args.dataset:
        # Process specific dataset
        dataset_path = RAW_DIR / args.dataset
        if not dataset_path.exists():
            raise FileNotFoundError(f"Dataset not found: {dataset_path}")
        
        preprocess_dataset(dataset_path)
    
    else:
        print("❌ Please specify --all or --dataset <name>")
        print("\nUsage:")
        print("  python -m backend.ids.data_pipeline.pipeline_v2 --all")
        print("  python -m backend.ids.data_pipeline.pipeline_v2 --dataset Syn")
        return
    
    print("\n" + "="*70)
    print("✅ ALL PREPROCESSING COMPLETE!")
    print("="*70)
    print("\n✅ Ready for model training!")
    print("   Run: ./scripts/train_ids.sh\n")


if __name__ == "__main__":
    main()
