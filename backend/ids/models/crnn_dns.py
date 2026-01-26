"""
Aegis IDS - CRNN Model for DNS Exfiltration Detection

Implements the research paper's CRNN architecture:
- CNN feature extractor (convolutional + pooling layers)
- LSTM temporal modeling
- Fully connected classifier
- Target: 99.23% accuracy (3-class: Benign/Light Attack/Heavy Attack)

Usage:
    python -m backend.ids.models.crnn_dns --type stateful
    python -m backend.ids.models.crnn_dns --type stateless
"""

import argparse
import json
import time
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.metrics import (
    accuracy_score, f1_score, confusion_matrix, classification_report,
    precision_score, recall_score
)
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, TensorDataset
import warnings
warnings.filterwarnings('ignore')

# =============================================================================
# Configuration
# =============================================================================

ROOT = Path(__file__).resolve().parents[3]
RAW_DIR = ROOT / "datasets" / "raw" / "CIC-Bell-DNS-EXF-2021"
ARTIFACTS_DIR = ROOT / "artifacts"
RANDOM_STATE = 42

# Device configuration
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"🔧 Using device: {DEVICE}")

# Feature sets (from baseline_ml_dns.py)
STATEFUL_FEATURES = [
    'rr', 'A_frequency', 'NS_frequency', 'CNAME_frequency', 'SOA_frequency',
    'NULL_frequency', 'PTR_frequency', 'HINFO_frequency', 'MX_frequency',
    'TXT_frequency', 'AAAA_frequency', 'SRV_frequency', 'OPT_frequency',
    'rr_count', 'rr_name_entropy', 'rr_name_length', 'distinct_ns',
    'a_records', 'ttl_mean', 'ttl_variance',
    'ttl_range', 'rr_type_variety', 'response_diversity', 
    'query_burst_indicator', 'ttl_inconsistency', 'a_record_ratio'
]

STATELESS_FEATURES = [
    'FQDN_count', 'subdomain_length', 'upper', 'lower', 'numeric',
    'entropy', 'special', 'labels', 'labels_max', 'labels_average',
    'len', 'subdomain',
    'unique_chars_ratio', 'special_to_length_ratio', 'alpha_numeric_ratio',
    'label_length_variance', 'entropy_per_char'
]

# CRNN Hyperparameters (optimized for DNS detection)
CRNN_CONFIG = {
    'cnn_channels': [64, 128, 256],  # Convolutional channels
    'kernel_size': 3,
    'pool_size': 2,
    'lstm_hidden_size': 128,
    'lstm_layers': 2,
    'fc_hidden_size': 256,
    'dropout': 0.3,
    'batch_size': 128,
    'epochs': 50,
    'learning_rate': 0.001,
    'early_stopping_patience': 10
}


# =============================================================================
# Data Loading (Reuse from baseline_ml_dns.py)
# =============================================================================

def load_all_dns_data(feature_type: str):
    """
    Load ALL DNS data from CIC-Bell-DNS-EXF-2021 dataset.
    Keeps attack labels separate: Light Attack vs Heavy Attack
    """
    
    print("\n" + "=" * 70)
    print(f"📦 LOADING CIC-Bell-DNS-EXF-2021 DATA ({feature_type.upper()})")
    print(f"    3-Class Classification: Benign / Light Attack / Heavy Attack")
    print("=" * 70)
    
    if not RAW_DIR.exists():
        raise FileNotFoundError(f"Dataset not found: {RAW_DIR}")
    
    all_dfs = []
    counts = {"heavy_attacks": 0, "light_attacks": 0, "benign": 0}
    
    # Load Attack_heavy_Benign - ATTACKS (label: HEAVY_ATTACK)
    heavy_attack_dir = RAW_DIR / "Attack_heavy_Benign" / "Attacks"
    print(f"\n📁 Loading Heavy Attacks from: {heavy_attack_dir.name}/Attacks/")
    if heavy_attack_dir.exists():
        files = sorted(heavy_attack_dir.glob(f"*_features-*.csv"))
        print(f"  Found {len(files)} CSV files")
        for f in files:
            df = pd.read_csv(f, low_memory=False)
            df['label'] = 'HEAVY_ATTACK'  # Keep separate label
            all_dfs.append(df)
            counts["heavy_attacks"] += len(df)
    
    # Load Attack_heavy_Benign - BENIGN
    heavy_benign_dir = RAW_DIR / "Attack_heavy_Benign" / "Benign"
    print(f"\n📁 Loading Benign from: {heavy_benign_dir.name}/Benign/")
    if heavy_benign_dir.exists():
        files = sorted(heavy_benign_dir.glob(f"*_features-*.csv"))
        print(f"  Found {len(files)} CSV files")
        for f in files:
            df = pd.read_csv(f, low_memory=False)
            df['label'] = 'BENIGN'
            all_dfs.append(df)
            counts["benign"] += len(df)
    
    # Load Attack_Light_Benign - ATTACKS (label: LIGHT_ATTACK)
    light_attack_dir = RAW_DIR / "Attack_Light_Benign" / "Attacks"
    print(f"\n📁 Loading Light Attacks from: {light_attack_dir.name}/Attacks/")
    if light_attack_dir.exists():
        files = sorted(light_attack_dir.glob(f"*_features-*.csv"))
        print(f"  Found {len(files)} CSV files")
        for f in files:
            df = pd.read_csv(f, low_memory=False)
            df['label'] = 'LIGHT_ATTACK'  # Keep separate label
            all_dfs.append(df)
            counts["light_attacks"] += len(df)
    
    # Load Attack_Light_Benign - BENIGN
    light_benign_dir = RAW_DIR / "Attack_Light_Benign" / "Benign"
    print(f"\n📁 Loading Benign from: {light_benign_dir.name}/Benign/")
    if light_benign_dir.exists():
        files = sorted(light_benign_dir.glob(f"*_features-*.csv"))
        print(f"  Found {len(files)} CSV files")
        for f in files:
            df = pd.read_csv(f, low_memory=False)
            df['label'] = 'BENIGN'
            all_dfs.append(df)
            counts["benign"] += len(df)
    
    # Load standalone Benign folder
    benign_dir = RAW_DIR / "Benign"
    print(f"\n📁 Loading Benign from: Benign/ (standalone)")
    if benign_dir.exists():
        files = sorted(benign_dir.glob(f"*_features-*.csv"))
        print(f"  Found {len(files)} CSV files")
        for f in files:
            df = pd.read_csv(f, low_memory=False)
            df['label'] = 'BENIGN'
            all_dfs.append(df)
            counts["benign"] += len(df)
    
    # Merge all
    print(f"\n🔗 Merging {len(all_dfs)} dataframes...")
    df_merged = pd.concat(all_dfs, ignore_index=True)
    
    # Show counts
    print(f"\n{'=' * 70}")
    print(f"📊 FINAL SAMPLE COUNTS (3-Class)")
    print(f"{'=' * 70}")
    print(f"\n  Benign:        {counts['benign']:,}")
    print(f"  Light Attack:  {counts['light_attacks']:,}")
    print(f"  Heavy Attack:  {counts['heavy_attacks']:,}")
    print(f"  {'─' * 50}")
    print(f"  GRAND TOTAL:   {len(df_merged):,}")
    
    return df_merged


# =============================================================================
# Data Preprocessing
# =============================================================================

def preprocess_data(df: pd.DataFrame, feature_type: str):
    """
    Preprocess data following research methodology:
    1. Drop identifiers
    2. Replace NaN with 0
    3. Remove duplicates (per class)
    4. Select features
    5. One-Hot Encode categorical features
    6. Standard Scaling (mean=0, std=1)
    7. Encode labels (3-class: 0=BENIGN, 1=LIGHT_ATTACK, 2=HEAVY_ATTACK)
    
    Returns:
        X_scaled: Scaled features
        y: Encoded labels
        scaler: Fitted StandardScaler
        feature_names: List of feature names
    """
    
    print(f"\n{'=' * 70}")
    print(f"🔧 PREPROCESSING ({feature_type.upper()})")
    print(f"{'=' * 70}")
    
    df = df.copy()
    
    # 1. Drop identifiers
    drop_cols = ['timestamp', 'flow_id', 'src_ip', 'dst_ip', 'sld', 'FQDN']
    cols_to_drop = [col for col in drop_cols if col in df.columns]
    if cols_to_drop:
        df = df.drop(columns=cols_to_drop)
    
    # 2. Replace NaN
    df = df.fillna(0)
    
    # 3. Remove duplicates (per class to preserve attack patterns)
    print(f"\n📊 Removing duplicates per class...")
    df_benign = df[df['label'] == 'BENIGN'].drop_duplicates(keep='first')
    df_light = df[df['label'] == 'LIGHT_ATTACK'].drop_duplicates(keep='first')
    df_heavy = df[df['label'] == 'HEAVY_ATTACK'].drop_duplicates(keep='first')
    
    print(f"   BENIGN:       {len(df_benign):,}")
    print(f"   LIGHT_ATTACK: {len(df_light):,}")
    print(f"   HEAVY_ATTACK: {len(df_heavy):,}")
    
    df = pd.concat([df_benign, df_light, df_heavy], ignore_index=True).sample(frac=1, random_state=RANDOM_STATE)
    print(f"   Total after deduplication: {len(df):,}")
    
    # 4. Select features
    feature_list = STATEFUL_FEATURES if feature_type == 'stateful' else STATELESS_FEATURES
    available_features = [f for f in feature_list if f in df.columns]
    
    print(f"\n🔍 Selected {len(available_features)} features")
    
    # Handle object columns
    for col in available_features:
        if col in df.columns and df[col].dtype == 'object':
            try:
                df[col] = df[col].astype(str).str.len()
            except:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    # Ensure numeric
    for col in available_features:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    # 5. One-Hot Encoding (if any categorical features remain)
    # (In our case, all features are already numeric, so this step is minimal)
    
    # 6. Standard Scaling
    print(f"\n📏 Applying Standard Scaling (mean=0, std=1)...")
    X = df[available_features].values
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    print(f"   Original mean: {X.mean():.4f}, std: {X.std():.4f}")
    print(f"   Scaled mean:   {X_scaled.mean():.4f}, std: {X_scaled.std():.4f}")
    
    # 7. Encode labels (3-class)
    print(f"\n🏷️  Encoding labels (3-class)...")
    label_map = {'BENIGN': 0, 'LIGHT_ATTACK': 1, 'HEAVY_ATTACK': 2}
    y = df['label'].map(label_map).values
    
    print(f"   BENIGN → 0")
    print(f"   LIGHT_ATTACK → 1")
    print(f"   HEAVY_ATTACK → 2")
    
    # Show class distribution
    print(f"\n📊 Class Distribution:")
    for cls_name, cls_idx in label_map.items():
        count = np.sum(y == cls_idx)
        print(f"   {cls_name:15s} ({cls_idx}): {count:,} ({count/len(y)*100:.2f}%)")
    
    return X_scaled, y, scaler, available_features


# =============================================================================
# CRNN Model Architecture
# =============================================================================

class CRNN_DNS(nn.Module):
    """
    CRNN Model for DNS Exfiltration Detection
    
    Architecture:
    1. CNN Feature Extractor:
       - Multiple Conv1D layers with increasing channels
       - BatchNorm + ReLU + MaxPooling after each conv
       - Extracts spatial/hierarchical features from DNS traffic
    
    2. LSTM Temporal Modeling:
       - Bidirectional LSTM to capture temporal patterns
       - Models sequential dependencies in DNS queries
    
    3. Fully Connected Classifier:
       - Dense layers with dropout
       - 3-way classification (Benign/Light Attack/Heavy Attack)
    """
    
    def __init__(self, input_size, num_classes=3, config=CRNN_CONFIG):
        super(CRNN_DNS, self).__init__()
        
        self.input_size = input_size
        self.num_classes = num_classes
        
        # CNN Feature Extractor
        cnn_layers = []
        in_channels = 1  # Start with 1 channel (treat features as 1D sequence)
        
        for out_channels in config['cnn_channels']:
            cnn_layers.extend([
                nn.Conv1d(in_channels, out_channels, 
                         kernel_size=config['kernel_size'], 
                         padding=config['kernel_size']//2),
                nn.BatchNorm1d(out_channels),
                nn.ReLU(),
                nn.MaxPool1d(config['pool_size']),
                nn.Dropout(config['dropout'])
            ])
            in_channels = out_channels
        
        self.cnn = nn.Sequential(*cnn_layers)
        
        # Calculate CNN output size
        with torch.no_grad():
            dummy_input = torch.zeros(1, 1, input_size)
            cnn_output = self.cnn(dummy_input)
            cnn_output_size = cnn_output.shape[2]
            cnn_channels = cnn_output.shape[1]
        
        # LSTM Temporal Modeling
        self.lstm = nn.LSTM(
            input_size=cnn_channels,
            hidden_size=config['lstm_hidden_size'],
            num_layers=config['lstm_layers'],
            batch_first=True,
            bidirectional=True,
            dropout=config['dropout'] if config['lstm_layers'] > 1 else 0
        )
        
        # Fully Connected Classifier
        lstm_output_size = config['lstm_hidden_size'] * 2  # *2 for bidirectional
        
        self.fc = nn.Sequential(
            nn.Linear(lstm_output_size * cnn_output_size, config['fc_hidden_size']),
            nn.BatchNorm1d(config['fc_hidden_size']),
            nn.ReLU(),
            nn.Dropout(config['dropout']),
            nn.Linear(config['fc_hidden_size'], num_classes)
        )
    
    def forward(self, x):
        # x shape: (batch_size, input_size)
        
        # Reshape for CNN: (batch_size, 1, input_size)
        x = x.unsqueeze(1)
        
        # CNN feature extraction: (batch_size, channels, seq_len)
        cnn_out = self.cnn(x)
        
        # Reshape for LSTM: (batch_size, seq_len, channels)
        lstm_in = cnn_out.permute(0, 2, 1)
        
        # LSTM temporal modeling: (batch_size, seq_len, hidden_size*2)
        lstm_out, _ = self.lstm(lstm_in)
        
        # Flatten LSTM output: (batch_size, seq_len * hidden_size*2)
        lstm_flat = lstm_out.reshape(lstm_out.size(0), -1)
        
        # Fully connected classifier: (batch_size, num_classes)
        output = self.fc(lstm_flat)
        
        return output


# =============================================================================
# Training
# =============================================================================

def train_model(model, train_loader, val_loader, config=CRNN_CONFIG):
    """
    Train CRNN model with early stopping
    """
    
    print(f"\n{'=' * 70}")
    print(f"🚀 TRAINING CRNN MODEL")
    print(f"{'=' * 70}")
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=config['learning_rate'])
    # ReduceLROnPlateau - verbose parameter removed for PyTorch compatibility
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=5)
    
    best_val_acc = 0
    best_model_state = None
    patience_counter = 0
    
    history = {
        'train_loss': [], 'train_acc': [],
        'val_loss': [], 'val_acc': []
    }
    
    for epoch in range(config['epochs']):
        # Training phase
        model.train()
        train_loss = 0
        train_correct = 0
        train_total = 0
        
        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(DEVICE), y_batch.to(DEVICE)
            
            optimizer.zero_grad()
            outputs = model(X_batch)
            loss = criterion(outputs, y_batch)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = outputs.max(1)
            train_total += y_batch.size(0)
            train_correct += predicted.eq(y_batch).sum().item()
        
        train_loss /= len(train_loader)
        train_acc = 100. * train_correct / train_total
        
        # Validation phase
        model.eval()
        val_loss = 0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for X_batch, y_batch in val_loader:
                X_batch, y_batch = X_batch.to(DEVICE), y_batch.to(DEVICE)
                outputs = model(X_batch)
                loss = criterion(outputs, y_batch)
                
                val_loss += loss.item()
                _, predicted = outputs.max(1)
                val_total += y_batch.size(0)
                val_correct += predicted.eq(y_batch).sum().item()
        
        val_loss /= len(val_loader)
        val_acc = 100. * val_correct / val_total
        
        # Store history
        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)
        
        # Print progress
        print(f"Epoch [{epoch+1}/{config['epochs']}] "
              f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}% | "
              f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}%")
        
        # Learning rate scheduling
        old_lr = optimizer.param_groups[0]['lr']
        scheduler.step(val_acc)
        new_lr = optimizer.param_groups[0]['lr']
        if old_lr != new_lr:
            print(f"   📉 Learning rate reduced: {old_lr:.6f} → {new_lr:.6f}")
        
        # Early stopping
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_model_state = model.state_dict().copy()
            patience_counter = 0
            print(f"   🎯 New best validation accuracy: {best_val_acc:.2f}%")
        else:
            patience_counter += 1
            if patience_counter >= config['early_stopping_patience']:
                print(f"\n⏹️  Early stopping at epoch {epoch+1}")
                break
    
    # Restore best model
    model.load_state_dict(best_model_state)
    
    print(f"\n✅ Training Complete!")
    print(f"   Best Validation Accuracy: {best_val_acc:.2f}%")
    
    return model, history


# =============================================================================
# Evaluation
# =============================================================================

def evaluate_model(model, test_loader, label_names=['BENIGN', 'LIGHT_ATTACK', 'HEAVY_ATTACK']):
    """
    Comprehensive evaluation with confusion matrix and per-class metrics
    """
    
    print(f"\n{'=' * 70}")
    print(f"📊 EVALUATING MODEL")
    print(f"{'=' * 70}")
    
    model.eval()
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for X_batch, y_batch in test_loader:
            X_batch = X_batch.to(DEVICE)
            outputs = model(X_batch)
            _, predicted = outputs.max(1)
            
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(y_batch.numpy())
    
    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)
    
    # Calculate metrics
    accuracy = accuracy_score(all_labels, all_preds)
    precision = precision_score(all_labels, all_preds, average='macro')
    recall = recall_score(all_labels, all_preds, average='macro')
    f1 = f1_score(all_labels, all_preds, average='macro')
    
    # Per-class metrics
    precision_per_class = precision_score(all_labels, all_preds, average=None)
    recall_per_class = recall_score(all_labels, all_preds, average=None)
    f1_per_class = f1_score(all_labels, all_preds, average=None)
    
    # Confusion matrix
    cm = confusion_matrix(all_labels, all_preds)
    
    # Print results
    print(f"\n✅ Overall Metrics:")
    print(f"   Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"   Precision: {precision:.4f} (macro)")
    print(f"   Recall:    {recall:.4f} (macro)")
    print(f"   F1-Score:  {f1:.4f} (macro)")
    
    print(f"\n📊 Per-Class Metrics:")
    print(f"   {'Class':<15s} {'Precision':>10s} {'Recall':>10s} {'F1-Score':>10s}")
    print("   " + "─" * 50)
    for i, label in enumerate(label_names):
        print(f"   {label:<15s} {precision_per_class[i]:>10.4f} {recall_per_class[i]:>10.4f} {f1_per_class[i]:>10.4f}")
    
    print(f"\n🎯 Confusion Matrix:")
    print(f"                   Predicted")
    print(f"            {'BENIGN':>10s} {'LIGHT_ATK':>10s} {'HEAVY_ATK':>10s}")
    print("   Actual")
    for i, label in enumerate(label_names):
        row_label = label[:10]  # Truncate for display
        print(f"   {row_label:<10s} {cm[i][0]:>10d} {cm[i][1]:>10d} {cm[i][2]:>10d}")
    
    # Classification report
    print(f"\n📋 Detailed Classification Report:")
    print(classification_report(all_labels, all_preds, target_names=label_names))
    
    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1_score': f1,
        'precision_per_class': precision_per_class.tolist(),
        'recall_per_class': recall_per_class.tolist(),
        'f1_per_class': f1_per_class.tolist(),
        'confusion_matrix': cm.tolist()
    }


# =============================================================================
# Save Model and Results
# =============================================================================

def save_model_and_results(model, metrics, history, feature_type: str):
    """
    Save trained model as H5 (PyTorch format) and metrics as JSON
    """
    
    output_dir = ARTIFACTS_DIR / f"crnn_{feature_type}"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n{'=' * 70}")
    print(f"💾 SAVING MODEL AND RESULTS")
    print(f"{'=' * 70}")
    
    # Save PyTorch model (.pth is standard, but we'll use .h5 naming as requested)
    model_path = output_dir / "crnn_model.h5"
    torch.save({
        'model_state_dict': model.state_dict(),
        'model_config': {
            'input_size': model.input_size,
            'num_classes': model.num_classes
        }
    }, model_path)
    print(f"✓ Model saved: {model_path}")
    
    # Save metrics
    results = {
        'feature_type': feature_type,
        'timestamp': pd.Timestamp.now().isoformat(),
        'model': 'CRNN',
        'metrics': metrics,
        'history': history,
        'config': CRNN_CONFIG
    }
    
    metrics_path = output_dir / "metrics.json"
    with open(metrics_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"✓ Metrics saved: {metrics_path}")
    
    print(f"\n📁 All results saved to: {output_dir}")


# =============================================================================
# Main Pipeline
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description='Train CRNN model for DNS detection')
    parser.add_argument('--type', required=True, choices=['stateful', 'stateless'],
                       help='Feature type to train on')
    args = parser.parse_args()
    
    print("\n" + "=" * 70)
    print("🛡️  AEGIS IDS - CRNN TRAINING")
    print("    Target: 99.23% accuracy (3-class classification)")
    print("    Architecture: CNN + LSTM + FC")
    print("=" * 70)
    
    # Set random seeds
    torch.manual_seed(RANDOM_STATE)
    np.random.seed(RANDOM_STATE)
    
    # Load data
    df = load_all_dns_data(args.type)
    
    # Preprocess
    X, y, scaler, feature_names = preprocess_data(df, args.type)
    
    # Train/test split (70/30)
    print(f"\n{'=' * 70}")
    print(f"✂️  TRAIN/TEST SPLIT (70/30)")
    print(f"{'=' * 70}")
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.30, random_state=RANDOM_STATE, stratify=y
    )
    
    print(f"  Train: {len(X_train):,} samples (70%)")
    print(f"  Test:  {len(X_test):,} samples (30%)")
    
    # Create data loaders
    train_dataset = TensorDataset(
        torch.FloatTensor(X_train),
        torch.LongTensor(y_train)
    )
    test_dataset = TensorDataset(
        torch.FloatTensor(X_test),
        torch.LongTensor(y_test)
    )
    
    train_loader = DataLoader(
        train_dataset, 
        batch_size=CRNN_CONFIG['batch_size'], 
        shuffle=True
    )
    test_loader = DataLoader(
        test_dataset, 
        batch_size=CRNN_CONFIG['batch_size'], 
        shuffle=False
    )
    
    # Create validation split from training data (for early stopping)
    X_train_split, X_val, y_train_split, y_val = train_test_split(
        X_train, y_train, test_size=0.15, random_state=RANDOM_STATE, stratify=y_train
    )
    
    val_dataset = TensorDataset(
        torch.FloatTensor(X_val),
        torch.LongTensor(y_val)
    )
    val_loader = DataLoader(
        val_dataset, 
        batch_size=CRNN_CONFIG['batch_size'], 
        shuffle=False
    )
    
    train_split_dataset = TensorDataset(
        torch.FloatTensor(X_train_split),
        torch.LongTensor(y_train_split)
    )
    train_split_loader = DataLoader(
        train_split_dataset, 
        batch_size=CRNN_CONFIG['batch_size'], 
        shuffle=True
    )
    
    # Initialize model
    print(f"\n{'=' * 70}")
    print(f"🏗️  INITIALIZING CRNN MODEL")
    print(f"{'=' * 70}")
    
    model = CRNN_DNS(
        input_size=X_train.shape[1],
        num_classes=3,
        config=CRNN_CONFIG
    ).to(DEVICE)
    
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    
    print(f"\n  Input Size:        {X_train.shape[1]} features")
    print(f"  Output Classes:    3 (BENIGN / LIGHT_ATTACK / HEAVY_ATTACK)")
    print(f"  Total Parameters:  {total_params:,}")
    print(f"  Trainable Params:  {trainable_params:,}")
    print(f"  Device:            {DEVICE}")
    
    print(f"\n  CNN Channels:      {CRNN_CONFIG['cnn_channels']}")
    print(f"  LSTM Hidden:       {CRNN_CONFIG['lstm_hidden_size']}")
    print(f"  LSTM Layers:       {CRNN_CONFIG['lstm_layers']}")
    print(f"  FC Hidden:         {CRNN_CONFIG['fc_hidden_size']}")
    
    # Train model
    model, history = train_model(model, train_split_loader, val_loader, CRNN_CONFIG)
    
    # Evaluate on test set
    metrics = evaluate_model(model, test_loader)
    
    # Save model and results
    save_model_and_results(model, metrics, history, args.type)
    
    print("\n" + "=" * 70)
    print("✅ CRNN TRAINING COMPLETE!")
    print(f"   Final Test Accuracy: {metrics['accuracy']*100:.2f}%")
    print(f"   Target (Paper):      99.23%")
    print("=" * 70)


if __name__ == "__main__":
    main()
