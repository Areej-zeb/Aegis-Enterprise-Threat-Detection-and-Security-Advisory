"""
cnn_lstm.py
CNN-LSTM Hybrid Model for Network Intrusion Detection

Architecture:
  - 1D CNN layers for spatial feature extraction
  - LSTM layers for temporal sequence modeling  
  - Dense layers for classification
  - Designed for anomaly detection in network traffic

Features:
  - GPU acceleration with CUDA
  - Progress monitoring with tqdm
  - Automatic checkpointing
  - SHAP & LIME explainability
  - Multi-dataset support

Usage:
    python -m backend.ids.models.cnn_lstm --dataset Syn --gpu-only
"""

import os, json, time, argparse
from pathlib import Path
from datetime import datetime
import numpy as np
import pandas as pd
from joblib import dump, load
from sklearn.metrics import (
    f1_score, precision_score, recall_score, roc_auc_score,
    confusion_matrix, classification_report, accuracy_score
)
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

# Deep Learning
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, TensorDataset
from tqdm import tqdm

# Explainability
import shap

# =============================================================================
# Paths
# =============================================================================
ROOT = Path(__file__).parent.parent.parent.parent
PROCESSED_DIR = ROOT / "datasets" / "processed"
ARTIFACTS = ROOT / "artifacts"
CHECKPOINTS_DIR = ROOT / "checkpoints"
SEED = ROOT / "seed"
EXPERIMENTS = ROOT / "backend" / "ids" / "experiments"

# Create directories
for dir_path in [ARTIFACTS, CHECKPOINTS_DIR, SEED, EXPERIMENTS]:
    dir_path.mkdir(parents=True, exist_ok=True)


# =============================================================================
# CUDA Verification
# =============================================================================

def check_cuda_availability():
    """Check if CUDA is available for PyTorch."""
    print("\n" + "="*70)
    print("🔥 CUDA / GPU VERIFICATION")
    print("="*70)
    
    cuda_available = torch.cuda.is_available()
    
    if cuda_available:
        print("✅ CUDA is AVAILABLE")
        print(f"   GPU: {torch.cuda.get_device_name(0)}")
        print(f"   CUDA Version: {torch.version.cuda}")
        print(f"   Total Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
        print(f"   Device Count: {torch.cuda.device_count()}")
    else:
        print("⚠️  CUDA is NOT available - using CPU")
        print("   For GPU acceleration, install PyTorch with CUDA:")
        print("   pip install torch --index-url https://download.pytorch.org/whl/cu118")
    
    print("="*70 + "\n")
    
    return cuda_available


def get_device():
    """Get the best available device."""
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


# =============================================================================
# CNN-LSTM Model Architecture
# =============================================================================

class CNNLSTMModel(nn.Module):
    """
    Hybrid CNN-LSTM model for network intrusion detection.
    
    Architecture:
        1. Conv1D layers extract spatial features from network flow data
        2. LSTM layers capture temporal dependencies
        3. Dense layers perform classification
    
    Args:
        input_size: Number of input features (16 for our case)
        num_classes: Number of output classes (2 for binary classification)
        sequence_length: Length of input sequence (1 for single timestep, can be increased)
        cnn_filters: Number of CNN filters
        lstm_hidden: LSTM hidden dimension
        dropout: Dropout rate
    """
    
    def __init__(self, input_size=16, num_classes=2, sequence_length=1, 
                 cnn_filters=64, lstm_hidden=128, dropout=0.3):
        super(CNNLSTMModel, self).__init__()
        
        self.input_size = input_size
        self.num_classes = num_classes
        self.sequence_length = sequence_length
        
        # CNN layers for feature extraction
        self.conv1 = nn.Conv1d(in_channels=input_size, out_channels=cnn_filters, 
                               kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm1d(cnn_filters)
        self.relu1 = nn.ReLU()
        self.dropout1 = nn.Dropout(dropout)
        
        self.conv2 = nn.Conv1d(in_channels=cnn_filters, out_channels=cnn_filters*2, 
                               kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm1d(cnn_filters*2)
        self.relu2 = nn.ReLU()
        self.dropout2 = nn.Dropout(dropout)
        
        # LSTM layers for temporal modeling
        self.lstm = nn.LSTM(input_size=cnn_filters*2, hidden_size=lstm_hidden, 
                           num_layers=2, batch_first=True, dropout=dropout if dropout > 0 else 0)
        
        # Fully connected layers
        self.fc1 = nn.Linear(lstm_hidden, 64)
        self.bn3 = nn.BatchNorm1d(64)
        self.relu3 = nn.ReLU()
        self.dropout3 = nn.Dropout(dropout)
        
        self.fc2 = nn.Linear(64, num_classes)
        
    def forward(self, x):
        """
        Forward pass.
        
        Args:
            x: Input tensor of shape (batch_size, input_size, sequence_length)
        
        Returns:
            Output logits of shape (batch_size, num_classes)
        """
        # CNN feature extraction
        # x shape: (batch, input_size, seq_len)
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu1(x)
        x = self.dropout1(x)
        
        x = self.conv2(x)
        x = self.bn2(x)
        x = self.relu2(x)
        x = self.dropout2(x)
        
        # Reshape for LSTM: (batch, seq_len, features)
        x = x.permute(0, 2, 1)
        
        # LSTM temporal modeling
        lstm_out, (hidden, cell) = self.lstm(x)
        
        # Use last hidden state
        x = lstm_out[:, -1, :]
        
        # Fully connected layers
        x = self.fc1(x)
        x = self.bn3(x)
        x = self.relu3(x)
        x = self.dropout3(x)
        
        x = self.fc2(x)
        
        return x


# =============================================================================
# Model Wrapper for Inference
# =============================================================================

class CNNLSTMWrapper:
    """Wrapper for CNN-LSTM that handles preprocessing and label encoding."""
    
    def __init__(self, model, label_encoder, device, scaler=None):
        self.model = model
        self.label_encoder = label_encoder
        self.device = device
        self.scaler = scaler
        
    def predict(self, X):
        """Predict class labels."""
        self.model.eval()
        with torch.no_grad():
            if isinstance(X, pd.DataFrame):
                X = X.values
            
            # Scale if scaler available
            if self.scaler is not None:
                X = self.scaler.transform(X)
            
            # Check if already in sequence format (3D: batch, features, seq_len)
            if len(X.shape) == 3:
                X_tensor = torch.FloatTensor(X).to(self.device)
            else:
                # Reshape for CNN: (batch, features, 1)
                X_tensor = torch.FloatTensor(X).unsqueeze(-1).permute(0, 1, 2).to(self.device)
            
            outputs = self.model(X_tensor)
            _, predicted = torch.max(outputs, 1)
            
            # Decode labels
            predictions = self.label_encoder.inverse_transform(predicted.cpu().numpy())
            
        return predictions
    
    def predict_proba(self, X):
        """Predict class probabilities."""
        self.model.eval()
        with torch.no_grad():
            if isinstance(X, pd.DataFrame):
                X = X.values
            
            # Scale if scaler available
            if self.scaler is not None:
                X = self.scaler.transform(X)
            
            # Check if already in sequence format (3D: batch, features, seq_len)
            if len(X.shape) == 3:
                X_tensor = torch.FloatTensor(X).to(self.device)
            else:
                # Reshape for CNN: (batch, features, 1)
                X_tensor = torch.FloatTensor(X).unsqueeze(-1).permute(0, 1, 2).to(self.device)
            
            outputs = self.model(X_tensor)
            probas = torch.softmax(outputs, dim=1)
            
        return probas.cpu().numpy()


# =============================================================================
# DNS Sequence Generation
# =============================================================================

def create_dns_sequences(df: pd.DataFrame, sequence_length: int = 10) -> tuple:
    """
    Convert flat DNS flows into sequences for CNN-LSTM.
    
    Strategy:
    - Slide window of N flows across dataset
    - Label sequence as attack if ANY flow in window is attack
    - Creates overlapping sequences for better coverage
    
    Args:
        df: DataFrame with features + 'label' column
        sequence_length: Number of flows per sequence (default: 10)
    
    Returns:
        (X_sequences, y_sequences) where X is (num_sequences, features, seq_len)
    """
    
    print(f"\n🔄 Creating DNS sequences (window: {sequence_length} flows)...")
    
    # Separate features and labels
    feature_cols = [col for col in df.columns if col != 'label']
    X = df[feature_cols].values
    y = df['label'].values
    
    sequences = []
    labels = []
    
    # Sliding window with stride=1 (overlapping)
    for i in range(len(X) - sequence_length + 1):
        seq = X[i:i + sequence_length]
        # Label as attack if ANY flow in sequence is attack
        label = int(np.any(y[i:i + sequence_length] == 1))
        
        sequences.append(seq)
        labels.append(label)
        
        if (i + 1) % 50000 == 0:
            print(f"  Generated {i + 1:,} sequences...")
    
    X_seq = np.array(sequences)  # (num_seq, seq_len, features)
    y_seq = np.array(labels)
    
    # Transpose to (num_seq, features, seq_len) for Conv1D
    X_seq = np.transpose(X_seq, (0, 2, 1))
    
    benign = np.sum(y_seq == 0)
    attack = np.sum(y_seq == 1)
    
    print(f"  ✓ Created {len(X_seq):,} sequences")
    print(f"  ✓ Shape: {X_seq.shape} (sequences, features, seq_len)")
    print(f"  ✓ BENIGN: {benign:,} ({benign/len(y_seq)*100:.1f}%)")
    print(f"  ✓ ATTACK: {attack:,} ({attack/len(y_seq)*100:.1f}%)")
    
    return X_seq, y_seq


# =============================================================================
# Data Loading
# =============================================================================

def load_dataset_splits(dataset_name: str, use_sequences: bool = False, sequence_length: int = 10):
    """Load train/val/test splits for a dataset."""
    dataset_dir = PROCESSED_DIR / dataset_name
    
    if not dataset_dir.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_dir}")
    
    print(f"\n📂 Loading dataset: {dataset_name}")
    print(f"   Path: {dataset_dir}")
    print(f"   Sequence mode: {'ON' if use_sequences else 'OFF'}")
    
    # Load parquet files
    train_df = pd.read_parquet(dataset_dir / "train.parquet")
    test_df = pd.read_parquet(dataset_dir / "test.parquet")
    
    # Check if val split exists (DNS datasets use 80/20 without val)
    val_path = dataset_dir / "val.parquet"
    has_val_split = val_path.exists()
    
    if has_val_split:
        val_df = pd.read_parquet(val_path)
    else:
        # Split test into val/test for DNS datasets
        from sklearn.model_selection import train_test_split
        val_df, test_df = train_test_split(
            test_df, test_size=0.5, random_state=42,
            stratify=test_df['label']
        )
        print(f"   ⚠️  No val split found, created from test (50/50)")
    
    # Load metadata
    with open(dataset_dir / "metadata.json", "r") as f:
        metadata = json.load(f)
    
    print(f"   ✓ Train: {len(train_df):,} flows")
    print(f"   ✓ Val:   {len(val_df):,} flows")
    print(f"   ✓ Test:  {len(test_df):,} flows")
    print(f"   ✓ Features: {metadata.get('num_features', len(metadata.get('features', [])))}")
    
    # Get feature list from metadata (dataset-specific)
    feature_list = metadata.get('features', [])
    if not feature_list:
        # Fallback: all columns except 'label'
        feature_list = [col for col in train_df.columns if col != 'label']
    
    if use_sequences:
        # DNS sequence generation mode
        print(f"\n🔄 Generating sequences for temporal learning...")
        
        X_train_seq, y_train = create_dns_sequences(train_df, sequence_length)
        X_val_seq, y_val = create_dns_sequences(val_df, sequence_length)
        X_test_seq, y_test = create_dns_sequences(test_df, sequence_length)
        
        # Update metadata with sequence info
        metadata['sequence_length'] = sequence_length
        metadata['sequence_mode'] = True
        
        return X_train_seq, y_train, X_val_seq, y_val, X_test_seq, y_test, metadata
    else:
        # Regular flow-by-flow mode
        X_train = train_df[feature_list]
        y_train = train_df['label']
        X_val = val_df[feature_list]
        y_val = val_df['label']
        X_test = test_df[feature_list]
        y_test = test_df['label']
        
        return X_train, y_train, X_val, y_val, X_test, y_test, metadata


# =============================================================================
# Training Functions
# =============================================================================

def train_cnn_lstm(X_train, y_train, X_val, y_val, X_test, y_test, 
                   dataset_name: str, metadata: dict, use_gpu: bool = True):
    """Train CNN-LSTM model with GPU acceleration and class weights."""
    
    print("\n" + "="*70)
    print("🤖 TRAINING CNN-LSTM HYBRID MODEL")
    print("="*70)
    
    device = get_device() if use_gpu else torch.device("cpu")
    print(f"\n📍 Using device: {device}")
    
    # Encode labels
    label_encoder = LabelEncoder()
    y_train_encoded = label_encoder.fit_transform(y_train)
    y_val_encoded = label_encoder.transform(y_val)
    y_test_encoded = label_encoder.transform(y_test)
    
    print(f"   Label encoding: {label_encoder.classes_} -> {list(range(len(label_encoder.classes_)))}")
    
    # Get class weights from metadata (use original pre-SMOTE weights)
    class_weights_dict = metadata.get('class_weights', {}).get('original', {})
    
    if class_weights_dict:
        # Convert to tensor in correct label order
        class_weights = [class_weights_dict.get(cls, 1.0) for cls in label_encoder.classes_]
        class_weights_tensor = torch.FloatTensor(class_weights).to(device)
        print(f"   ⚖️  Class weights: {dict(zip(label_encoder.classes_, class_weights))}")
    else:
        class_weights_tensor = None
        print("   ⚖️  No class weights found, using balanced weights")
    
    # Convert to tensors
    is_sequence_mode = metadata.get('sequence_mode', False)
    
    if is_sequence_mode:
        # Data already in shape (batch, features, seq_len) from create_dns_sequences
        X_train_tensor = torch.FloatTensor(X_train)
        X_val_tensor = torch.FloatTensor(X_val)
        sequence_length = metadata.get('sequence_length', 10)
        print(f"   📊 Sequence mode: {sequence_length} flows per sequence")
    else:
        # Regular mode: reshape to (batch, features, 1)
        X_train_tensor = torch.FloatTensor(X_train.values).unsqueeze(-1).permute(0, 1, 2)
        X_val_tensor = torch.FloatTensor(X_val.values).unsqueeze(-1).permute(0, 1, 2)
        sequence_length = 1
        print(f"   📊 Flow mode: single-flow classification")
    
    y_train_tensor = torch.LongTensor(y_train_encoded)
    y_val_tensor = torch.LongTensor(y_val_encoded)
    
    # Create data loaders
    batch_size = 256
    train_dataset = TensorDataset(X_train_tensor, y_train_tensor)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    
    val_dataset = TensorDataset(X_val_tensor, y_val_tensor)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    # Initialize model with actual feature count and sequence length
    is_sequence_mode = metadata.get('sequence_mode', False)
    if is_sequence_mode:
        num_features = X_train.shape[1]  # Already numpy array
        sequence_len = metadata.get('sequence_length', 10)
    else:
        num_features = X_train.shape[1]  # DataFrame
        sequence_len = 1
    
    num_classes = len(label_encoder.classes_)
    
    model = CNNLSTMModel(
        input_size=num_features,
        num_classes=num_classes,
        sequence_length=sequence_len,
        cnn_filters=64,
        lstm_hidden=128,
        dropout=0.3
    ).to(device)
    
    print(f"\n🏗️  Model Architecture:")
    print(f"   Input features: {num_features}")
    print(f"   Output classes: {num_classes}")
    print(f"   CNN filters: 64 -> 128")
    print(f"   LSTM hidden: 128")
    print(f"   Parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=3)
    
    # Training parameters
    num_epochs = 20
    best_val_f1 = 0.0  # Track F1 instead of loss
    patience = 5
    patience_counter = 0
    
    # Checkpoint manager
    checkpoint_dir = CHECKPOINTS_DIR / dataset_name
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n🎯 Training Configuration:")
    print(f"   Epochs: {num_epochs}")
    print(f"   Batch size: {batch_size}")
    print(f"   Learning rate: 0.001")
    print(f"   Early stopping patience: {patience}")
    print(f"   Best model metric: Macro F1 Score ⭐")
    print(f"   Device: {device}")
    
    # Training loop
    print(f"\n⚡ Starting training...\n")
    
    for epoch in range(num_epochs):
        # Training phase
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0
        
        with tqdm(train_loader, desc=f"Epoch {epoch+1}/{num_epochs}", unit="batch") as pbar:
            for inputs, labels in pbar:
                inputs, labels = inputs.to(device), labels.to(device)
                
                # Zero gradients
                optimizer.zero_grad()
                
                # Forward pass
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                # Backward pass
                loss.backward()
                optimizer.step()
                
                # Statistics
                train_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                train_total += labels.size(0)
                train_correct += (predicted == labels).sum().item()
                
                # Update progress bar
                pbar.set_postfix({
                    'loss': f'{loss.item():.4f}',
                    'acc': f'{100 * train_correct / train_total:.2f}%'
                })
        
        # Validation phase
        model.eval()
        val_loss = 0.0
        val_preds = []
        val_labels_list = []
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                
                val_preds.extend(predicted.cpu().numpy())
                val_labels_list.extend(labels.cpu().numpy())
        
        # Calculate epoch metrics
        train_loss = train_loss / len(train_loader)
        val_loss = val_loss / len(val_loader)
        train_acc = 100 * train_correct / train_total
        
        # Calculate validation metrics
        val_acc = accuracy_score(val_labels_list, val_preds) * 100
        val_macro_f1 = f1_score(val_labels_list, val_preds, average='macro', zero_division=0)
        val_precision = precision_score(val_labels_list, val_preds, average='macro', zero_division=0)
        val_recall = recall_score(val_labels_list, val_preds, average='macro', zero_division=0)
        
        print(f"   Epoch {epoch+1}: Train Loss={train_loss:.4f}, Train Acc={train_acc:.2f}%")
        print(f"             Val Loss={val_loss:.4f}, Val Acc={val_acc:.2f}%, Val F1={val_macro_f1:.4f} ⭐")
        print(f"             Val Precision={val_precision:.4f}, Val Recall={val_recall:.4f}")
        
        # Learning rate scheduling based on F1
        scheduler.step(val_macro_f1)
        
        # Save best model based on F1 score
        if val_macro_f1 > best_val_f1:
            best_val_f1 = val_macro_f1
            patience_counter = 0
            
            # Save checkpoint
            checkpoint_path = checkpoint_dir / f"cnn_lstm_best_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pt"
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_loss': val_loss,
                'val_acc': val_acc,
                'val_macro_f1': val_macro_f1,
                'label_encoder': label_encoder
            }, checkpoint_path)
            print(f"   🏆 New best model! Val Macro F1={val_macro_f1:.4f}")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"\n   ⏹️  Early stopping triggered after {epoch+1} epochs")
                break
    
    # Evaluate on test set
    print(f"\n📊 Evaluating on test set...")
    wrapper = CNNLSTMWrapper(model, label_encoder, device)
    
    # Test evaluation
    model.eval()
    y_pred = wrapper.predict(X_test)
    y_pred_proba = wrapper.predict_proba(X_test)
    
    # Get unique classes (handle both pandas Series and numpy arrays)
    if hasattr(y_test, 'unique'):
        classes = sorted(y_test.unique())
    else:
        classes = sorted(np.unique(y_test))
    
    # Overall metrics
    accuracy = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
    weighted_f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    macro_precision = precision_score(y_test, y_pred, average="macro", zero_division=0)
    macro_recall = recall_score(y_test, y_pred, average="macro", zero_division=0)
    
    # Per-class metrics
    per_class_f1 = f1_score(y_test, y_pred, average=None, zero_division=0, labels=classes)
    per_class_precision = precision_score(y_test, y_pred, average=None, zero_division=0, labels=classes)
    per_class_recall = recall_score(y_test, y_pred, average=None, zero_division=0, labels=classes)
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred, labels=classes)
    
    # ROC-AUC
    try:
        y_test_dummies = pd.get_dummies(y_test)
        roc = roc_auc_score(y_test_dummies, y_pred_proba, average="macro", multi_class="ovr")
    except:
        roc = 0.0
    
    # Print overall metrics
    print(f"   ✓ Accuracy:       {accuracy:.4f}")
    print(f"   ✓ Macro F1:       {macro_f1:.4f} ⭐")
    print(f"   ✓ Weighted F1:    {weighted_f1:.4f}")
    print(f"   ✓ Macro Precision: {macro_precision:.4f}")
    print(f"   ✓ Macro Recall:    {macro_recall:.4f}")
    print(f"   ✓ ROC-AUC:        {roc:.4f}")
    
    # Print per-class metrics
    print(f"\n   📊 Per-Class Metrics:")
    print(f"   {'Class':<15} {'Precision':<12} {'Recall':<12} {'F1-Score':<12}")
    print(f"   {'-'*15} {'-'*12} {'-'*12} {'-'*12}")
    for i, cls in enumerate(classes):
        print(f"   {cls:<15} {per_class_precision[i]:>11.4f} {per_class_recall[i]:>11.4f} {per_class_f1[i]:>11.4f}")
    
    # Save comprehensive metrics to JSON
    artifact_dir = ARTIFACTS / dataset_name
    artifact_dir.mkdir(parents=True, exist_ok=True)
    
    metrics_path = artifact_dir / "cnn_lstm_metrics.json"
    metrics_data = {
        'dataset': dataset_name,
        'model': 'CNN-LSTM',
        'timestamp': datetime.now().isoformat(),
        'overall_metrics': {
            'accuracy': float(accuracy),
            'f1_macro': float(macro_f1),
            'f1_weighted': float(weighted_f1),
            'precision_macro': float(macro_precision),
            'recall_macro': float(macro_recall),
            'roc_auc': float(roc)
        },
        'per_class_metrics': {
            'precision': {cls: float(prec) for cls, prec in zip(classes, per_class_precision)},
            'recall': {cls: float(rec) for cls, rec in zip(classes, per_class_recall)},
            'f1_score': {cls: float(f1) for cls, f1 in zip(classes, per_class_f1)}
        },
        'confusion_matrix': cm.tolist(),
        'best_val_f1': float(best_val_f1)
    }
    
    with open(metrics_path, 'w') as f:
        json.dump(metrics_data, f, indent=2)
    
    print(f"\n   📊 Comprehensive metrics saved to: {metrics_path}")
    
    # Legacy metrics dict for compatibility
    metrics = {
        'accuracy': accuracy,
        'f1_macro': macro_f1,
        'precision': macro_precision,
        'recall': macro_recall,
        'roc_auc': roc
    }
    
    # Save final model
    model_path = artifact_dir / "cnn_lstm.joblib"
    
    dump({
        'model_state_dict': model.state_dict(),
        'label_encoder': label_encoder,
        'model_config': {
            'input_size': num_features,
            'num_classes': num_classes,
            'cnn_filters': 64,
            'lstm_hidden': 128,
            'dropout': 0.3
        }
    }, model_path)
    
    print(f"\n🏆 Model saved to: {model_path}")
    
    return metrics, wrapper


# =============================================================================
# Main
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Aegis IDS - CNN-LSTM Model Training")
    parser.add_argument("--dataset", type=str, help="Dataset name (folder in processed/)")
    parser.add_argument("--all", action="store_true", help="Train on all datasets")
    parser.add_argument("--gpu-only", action="store_true", help="Force GPU usage (fail if unavailable)")
    parser.add_argument("--sequences", action="store_true", help="Use sequence mode for DNS (10-flow windows)")
    parser.add_argument("--seq-len", type=int, default=10, help="Sequence length (default: 10)")
    args = parser.parse_args()
    
    print("\n" + "="*70)
    print("🛡️  AEGIS IDS - CNN-LSTM HYBRID MODEL TRAINING")
    print("="*70)
    
    # Check CUDA
    use_gpu = check_cuda_availability()
    
    if args.gpu_only and not use_gpu:
        print("❌ GPU requested but not available. Exiting.")
        return
    
    # Discover datasets
    if args.all:
        datasets = [d.name for d in PROCESSED_DIR.iterdir() if d.is_dir()]
        print(f"\n📂 Found {len(datasets)} processed dataset(s): {', '.join(datasets)}")
    elif args.dataset:
        datasets = [args.dataset]
    else:
        print("\n❌ Please specify --dataset <name> or --all")
        return
    
    # Train on each dataset
    for dataset_name in datasets:
        print("\n" + "="*70)
        print(f"🎯 TRAINING ON DATASET: {dataset_name}")
        print("="*70)
        
        try:
            # Determine if this is a DNS dataset
            use_sequences = args.sequences or 'dns' in dataset_name.lower()
            
            # Load data
            X_train, y_train, X_val, y_val, X_test, y_test, metadata = load_dataset_splits(
                dataset_name, 
                use_sequences=use_sequences,
                sequence_length=args.seq_len
            )
            
            # Train CNN-LSTM
            start_time = time.time()
            metrics, model = train_cnn_lstm(X_train, y_train, X_val, y_val, X_test, y_test, 
                                           dataset_name, metadata, use_gpu)
            training_time = time.time() - start_time
            
            print(f"\n⏱️  Total training time: {training_time/60:.2f} minutes")
            print(f"\n✅ Training complete for {dataset_name}!")
            
        except Exception as e:
            print(f"\n❌ Error training on {dataset_name}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    print("\n" + "="*70)
    print("✅ ALL CNN-LSTM TRAINING COMPLETE!")
    print("="*70)


if __name__ == "__main__":
    main()
