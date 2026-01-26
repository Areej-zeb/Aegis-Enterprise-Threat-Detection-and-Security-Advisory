"""
Aegis IDS - CNN-LSTM for DNS Exfiltration Detection

Temporal deep learning model that captures:
- Local flow transitions (1D CNN)
- Long-term sequence behavior (LSTM)

Architecture:
- 1D CNN Layer: 32 filters, kernel_size=3
- LSTM Layer: 64 units
- Dense + Dropout: 0.3
- Binary classification with class weights

Training:
- 70/15/15 split
- Early stopping on val_f1
- Epochs: 15-30
- Batch size: 64

Usage:
    python -m backend.ids.models.cnn_lstm_dns --dataset dns_unified_stateful
"""

import argparse
import json
import time
from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    average_precision_score
)
import warnings
warnings.filterwarnings('ignore')

# TensorFlow/Keras imports
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model, callbacks
from tensorflow.keras.utils import to_categorical

# =============================================================================
# Configuration
# =============================================================================

ROOT = Path(__file__).resolve().parents[3]
PROCESSED_DIR = ROOT / "datasets" / "processed" / "dns_unified"
ARTIFACTS_DIR = ROOT / "artifacts"
EXPERIMENTS_DIR = ROOT / "backend" / "ids" / "experiments"

SEQUENCE_LENGTH = 10  # 10 flows per sequence
RANDOM_STATE = 42

# =============================================================================
# GPU Check
# =============================================================================

def check_gpu() -> tuple:
    """Check GPU availability for TensorFlow"""
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        try:
            # Enable memory growth
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
            gpu_name = tf.config.experimental.get_device_details(gpus[0]).get('device_name', 'Unknown')
            return True, f"{gpu_name} (TensorFlow)"
        except:
            return True, f"{len(gpus)} GPU(s) detected"
    return False, "No GPU available"


# =============================================================================
# Sequence Generation
# =============================================================================

def create_sequences(df: pd.DataFrame, sequence_length: int = 10) -> tuple:
    """
    Convert flat dataframe into sequences for CNN-LSTM.
    
    Strategy:
    1. Group by source IP (or just use sequential flows if no src_ip)
    2. Slide window of N flows across each group
    3. Label sequence as attack if ANY flow in window is attack
    
    Args:
        df: DataFrame with features + 'label' column
        sequence_length: Number of flows per sequence
    
    Returns:
        (X_sequences, y_sequences) where X is (num_sequences, seq_len, num_features)
    """
    
    print(f"\n{'=' * 70}")
    print(f"🔄 CREATING SEQUENCES (Window: {sequence_length} flows)")
    print(f"{'=' * 70}")
    
    # Separate features and labels
    feature_cols = [col for col in df.columns if col != 'label']
    X = df[feature_cols].values
    y = df['label'].values
    
    sequences = []
    labels = []
    
    # Since we don't have src_ip or timestamp in processed data,
    # we'll create sequences by sliding window across all flows
    # This treats the dataset as a continuous stream
    
    print(f"\n📊 Creating sliding window sequences...")
    print(f"  Total flows: {len(df):,}")
    print(f"  Sequence length: {sequence_length}")
    print(f"  Stride: 1 (overlapping windows)")
    
    for i in range(len(X) - sequence_length + 1):
        # Get sequence of flows
        seq = X[i:i + sequence_length]
        # Label as attack if ANY flow in sequence is attack
        label = int(np.any(y[i:i + sequence_length] == 1))
        
        sequences.append(seq)
        labels.append(label)
        
        # Progress update every 50k sequences
        if (i + 1) % 50000 == 0:
            print(f"  Generated {i + 1:,} sequences...")
    
    X_seq = np.array(sequences)
    y_seq = np.array(labels)
    
    print(f"\n✅ Sequence Generation Complete:")
    print(f"  Shape: {X_seq.shape} (num_sequences, {sequence_length}, {len(feature_cols)} features)")
    print(f"  Labels: {y_seq.shape}")
    
    # Class distribution
    benign_count = np.sum(y_seq == 0)
    attack_count = np.sum(y_seq == 1)
    print(f"\n📊 Sequence Class Distribution:")
    print(f"  BENIGN sequences:  {benign_count:,} ({benign_count / len(y_seq) * 100:.2f}%)")
    print(f"  ATTACK sequences:  {attack_count:,} ({attack_count / len(y_seq) * 100:.2f}%)")
    
    return X_seq, y_seq, feature_cols


# =============================================================================
# CNN-LSTM Model
# =============================================================================

def build_cnn_lstm(
    sequence_length: int,
    num_features: int
) -> Model:
    """
    Build CNN-LSTM hybrid model for temporal DNS detection.
    
    Architecture:
    1. 1D CNN: Captures local flow transitions (patterns within short windows)
    2. LSTM: Learns long-term dependencies (evolving attack behavior)
    3. Dense + Dropout: Final classification
    
    Args:
        sequence_length: Number of timesteps (flows per sequence)
        num_features: Number of features per flow
    
    Returns:
        Compiled Keras model
    """
    
    print(f"\n{'=' * 70}")
    print(f"🧠 BUILDING CNN-LSTM MODEL")
    print(f"{'=' * 70}")
    
    # Input layer
    inputs = layers.Input(shape=(sequence_length, num_features), name='sequence_input')
    
    # 1D Convolutional layer - captures local patterns
    x = layers.Conv1D(
        filters=32,
        kernel_size=3,
        padding='same',
        activation='relu',
        name='conv1d_1'
    )(inputs)
    x = layers.BatchNormalization(name='bn_1')(x)
    x = layers.MaxPooling1D(pool_size=2, name='pool_1')(x)
    
    # Another Conv layer for deeper patterns
    x = layers.Conv1D(
        filters=64,
        kernel_size=3,
        padding='same',
        activation='relu',
        name='conv1d_2'
    )(x)
    x = layers.BatchNormalization(name='bn_2')(x)
    
    # LSTM layer - captures temporal dependencies
    x = layers.LSTM(
        units=64,
        return_sequences=False,  # Only return final output
        dropout=0.3,
        recurrent_dropout=0.2,
        name='lstm_1'
    )(x)
    
    # Dense layers for classification
    x = layers.Dense(32, activation='relu', name='dense_1')(x)
    x = layers.Dropout(0.3, name='dropout_1')(x)
    
    # Output layer
    outputs = layers.Dense(1, activation='sigmoid', name='output')(x)
    
    # Create model
    model = Model(inputs=inputs, outputs=outputs, name='CNN_LSTM_DNS_Detector')
    
    # Compile
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss='binary_crossentropy',
        metrics=[
            'accuracy',
            keras.metrics.Precision(name='precision'),
            keras.metrics.Recall(name='recall'),
            keras.metrics.AUC(name='auc'),
            keras.metrics.AUC(curve='PR', name='pr_auc')
        ]
    )
    
    print(f"\n📋 Model Architecture:")
    model.summary()
    
    return model


# =============================================================================
# Training
# =============================================================================

def train_cnn_lstm(
    model: Model,
    X_train, y_train,
    X_val, y_val,
    class_weight: dict,
    dataset_name: str
) -> tuple:
    """
    Train CNN-LSTM with class weighting and early stopping.
    
    Args:
        model: Compiled Keras model
        X_train, y_train: Training data
        X_val, y_val: Validation data
        class_weight: Dict of class weights {0: weight, 1: weight}
        dataset_name: Name for saving artifacts
    
    Returns:
        (history, train_time)
    """
    
    print(f"\n{'=' * 70}")
    print(f"⏳ TRAINING CNN-LSTM")
    print(f"{'=' * 70}")
    
    output_dir = ARTIFACTS_DIR / f"{dataset_name}_cnnlstm"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Callbacks
    early_stop = callbacks.EarlyStopping(
        monitor='val_pr_auc',  # Monitor PR-AUC (good for imbalanced data)
        patience=5,
        restore_best_weights=True,
        verbose=1,
        mode='max'
    )
    
    reduce_lr = callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=3,
        verbose=1,
        min_lr=1e-6
    )
    
    checkpoint = callbacks.ModelCheckpoint(
        filepath=str(output_dir / 'best_model.h5'),
        monitor='val_pr_auc',
        save_best_only=True,
        verbose=1,
        mode='max'
    )
    
    print(f"\n📊 Training Configuration:")
    print(f"  Epochs: 30 (with early stopping)")
    print(f"  Batch size: 64")
    print(f"  Class weights: {class_weight}")
    print(f"  Callbacks: EarlyStopping (patience=5), ReduceLROnPlateau, ModelCheckpoint")
    
    # Train
    start_time = time.time()
    
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=30,
        batch_size=64,
        class_weight=class_weight,
        callbacks=[early_stop, reduce_lr, checkpoint],
        verbose=1
    )
    
    train_time = time.time() - start_time
    
    print(f"\n✅ Training complete in {train_time:.2f} seconds ({train_time / 60:.2f} minutes)")
    
    return history, train_time


# =============================================================================
# Evaluation
# =============================================================================

def evaluate_cnn_lstm(
    model: Model,
    X_test, y_test,
    dataset_name: str
) -> dict:
    """
    Comprehensive evaluation of CNN-LSTM model.
    """
    
    print(f"\n{'=' * 70}")
    print(f"📊 MODEL EVALUATION")
    print(f"{'=' * 70}")
    
    # Predictions
    start_time = time.time()
    y_pred_proba = model.predict(X_test, verbose=0).flatten()
    y_pred = (y_pred_proba >= 0.5).astype(int)
    inference_time = time.time() - start_time
    
    # Metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_pred_proba)
    pr_auc = average_precision_score(y_test, y_pred_proba)
    
    # Per-class metrics
    precision_per_class = precision_score(y_test, y_pred, average=None, zero_division=0)
    recall_per_class = recall_score(y_test, y_pred, average=None, zero_division=0)
    f1_per_class = f1_score(y_test, y_pred, average=None, zero_division=0)
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    
    # Print results
    print(f"\n✅ Overall Metrics:")
    print(f"  Accuracy:         {accuracy:.4f}")
    print(f"  F1 (macro):       {f1:.4f} ⭐")
    print(f"  Precision:        {precision:.4f}")
    print(f"  Recall:           {recall:.4f}")
    print(f"  ROC-AUC:          {roc_auc:.4f}")
    print(f"  PR-AUC:           {pr_auc:.4f}")
    print(f"  Inference time:   {inference_time:.2f}s ({len(X_test) / inference_time:.0f} samples/s)")
    
    print(f"\n📊 Per-Class Metrics:")
    class_names = ["BENIGN", "ATTACK"]
    for i, class_name in enumerate(class_names):
        print(f"\n  {class_name}:")
        print(f"    Precision: {precision_per_class[i]:.4f}")
        print(f"    Recall:    {recall_per_class[i]:.4f}")
        print(f"    F1-Score:  {f1_per_class[i]:.4f}")
    
    print(f"\n📋 Confusion Matrix:")
    print(f"             Predicted")
    print(f"             BENIGN  ATTACK")
    print(f"  Actual BENIGN  {cm[0][0]:6d}  {cm[0][1]:6d}")
    print(f"         ATTACK  {cm[1][0]:6d}  {cm[1][1]:6d}")
    
    # Compute macro F1 for sequences
    f1_macro = (f1_per_class[0] + f1_per_class[1]) / 2
    
    metrics = {
        "accuracy": float(accuracy),
        "f1_macro": float(f1_macro),
        "precision": float(precision),
        "recall": float(recall),
        "roc_auc": float(roc_auc),
        "pr_auc": float(pr_auc),
        "inference_time": float(inference_time),
        "per_class": {
            "BENIGN": {
                "precision": float(precision_per_class[0]),
                "recall": float(recall_per_class[0]),
                "f1": float(f1_per_class[0])
            },
            "ATTACK": {
                "precision": float(precision_per_class[1]),
                "recall": float(recall_per_class[1]),
                "f1": float(f1_per_class[1])
            }
        },
        "confusion_matrix": cm.tolist()
    }
    
    return metrics


# =============================================================================
# Save Results
# =============================================================================

def save_results(
    model: Model,
    history,
    metrics: dict,
    train_time: float,
    dataset_name: str
):
    """Save model, history, and metrics"""
    
    output_dir = ARTIFACTS_DIR / f"{dataset_name}_cnnlstm"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n{'=' * 70}")
    print(f"💾 SAVING RESULTS")
    print(f"{'=' * 70}")
    
    # Save final model
    model_path = output_dir / "cnn_lstm_model.h5"
    model.save(model_path)
    print(f"\n✓ Model saved: {model_path.name}")
    
    # Save training history plot
    plot_training_history(history, output_dir)
    print(f"✓ Training history plot saved: train_history.png")
    
    # Save metrics
    metrics_full = {
        "dataset": dataset_name,
        "model_type": "CNN-LSTM",
        "timestamp": pd.Timestamp.now().isoformat(),
        "train_time_seconds": train_time,
        "metrics": metrics
    }
    
    metrics_path = output_dir / "training_metrics.json"
    with open(metrics_path, 'w') as f:
        json.dump(metrics_full, f, indent=2)
    print(f"✓ Metrics saved: {metrics_path.name}")
    
    # Generate text report
    report_path = output_dir / "metrics_report.txt"
    with open(report_path, 'w') as f:
        f.write(f"CNN-LSTM DNS Exfiltration Detector\n")
        f.write(f"=" * 50 + "\n\n")
        f.write(f"Dataset: {dataset_name}\n")
        f.write(f"Training Time: {train_time:.2f} seconds\n\n")
        f.write(f"Overall Metrics:\n")
        f.write(f"  Accuracy:  {metrics['accuracy']:.4f}\n")
        f.write(f"  F1 (macro): {metrics['f1_macro']:.4f}\n")
        f.write(f"  Precision: {metrics['precision']:.4f}\n")
        f.write(f"  Recall:    {metrics['recall']:.4f}\n")
        f.write(f"  ROC-AUC:   {metrics['roc_auc']:.4f}\n")
        f.write(f"  PR-AUC:    {metrics['pr_auc']:.4f}\n\n")
        f.write(f"Per-Class Metrics:\n")
        for class_name in ["BENIGN", "ATTACK"]:
            f.write(f"\n  {class_name}:\n")
            f.write(f"    Precision: {metrics['per_class'][class_name]['precision']:.4f}\n")
            f.write(f"    Recall:    {metrics['per_class'][class_name]['recall']:.4f}\n")
            f.write(f"    F1-Score:  {metrics['per_class'][class_name]['f1']:.4f}\n")
    
    print(f"✓ Text report saved: {report_path.name}")
    print(f"\n📁 All outputs saved to: {output_dir}")


def plot_training_history(history, output_dir):
    """Plot and save training history"""
    
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    
    # Loss
    axes[0, 0].plot(history.history['loss'], label='Train Loss')
    axes[0, 0].plot(history.history['val_loss'], label='Val Loss')
    axes[0, 0].set_title('Model Loss')
    axes[0, 0].set_xlabel('Epoch')
    axes[0, 0].set_ylabel('Loss')
    axes[0, 0].legend()
    axes[0, 0].grid(True, alpha=0.3)
    
    # Accuracy
    axes[0, 1].plot(history.history['accuracy'], label='Train Accuracy')
    axes[0, 1].plot(history.history['val_accuracy'], label='Val Accuracy')
    axes[0, 1].set_title('Model Accuracy')
    axes[0, 1].set_xlabel('Epoch')
    axes[0, 1].set_ylabel('Accuracy')
    axes[0, 1].legend()
    axes[0, 1].grid(True, alpha=0.3)
    
    # PR-AUC
    axes[1, 0].plot(history.history['pr_auc'], label='Train PR-AUC')
    axes[1, 0].plot(history.history['val_pr_auc'], label='Val PR-AUC')
    axes[1, 0].set_title('PR-AUC (Precision-Recall)')
    axes[1, 0].set_xlabel('Epoch')
    axes[1, 0].set_ylabel('PR-AUC')
    axes[1, 0].legend()
    axes[1, 0].grid(True, alpha=0.3)
    
    # Recall
    axes[1, 1].plot(history.history['recall'], label='Train Recall')
    axes[1, 1].plot(history.history['val_recall'], label='Val Recall')
    axes[1, 1].set_title('Model Recall')
    axes[1, 1].set_xlabel('Epoch')
    axes[1, 1].set_ylabel('Recall')
    axes[1, 1].legend()
    axes[1, 1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(output_dir / 'train_history.png', dpi=150, bbox_inches='tight')
    plt.close()


# =============================================================================
# Main Pipeline
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description='Train CNN-LSTM for DNS detection')
    parser.add_argument('--dataset', required=True, choices=['dns_unified_stateless', 'dns_unified_stateful'],
                       help='Dataset to train on')
    args = parser.parse_args()
    
    print("\n" + "=" * 70)
    print("🛡️  AEGIS IDS - CNN-LSTM DNS TRAINING")
    print("=" * 70)
    
    # Check GPU
    use_gpu, gpu_info = check_gpu()
    print(f"\n🔥 GPU Status: {gpu_info}")
    
    # Load data
    dataset_path = PROCESSED_DIR / args.dataset.replace("dns_unified_", "")
    train_df = pd.read_parquet(dataset_path / "train.parquet")
    test_df = pd.read_parquet(dataset_path / "test.parquet")
    
    print(f"\n📂 Loaded Dataset: {args.dataset}")
    print(f"  Train: {len(train_df):,} flows")
    print(f"  Test:  {len(test_df):,} flows")
    
    # Create sequences
    X_train_seq, y_train_seq, feature_cols = create_sequences(train_df, SEQUENCE_LENGTH)
    X_test_seq, y_test_seq, _ = create_sequences(test_df, SEQUENCE_LENGTH)
    
    # Split train into train/val (70/15/15 overall becomes 82.35/17.65 of train sequences)
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_seq, y_train_seq,
        test_size=0.176,  # ~15% of original
        random_state=RANDOM_STATE,
        stratify=y_train_seq
    )
    
    print(f"\n📊 Final Splits:")
    print(f"  Train:      {len(X_train):,} sequences")
    print(f"  Validation: {len(X_val):,} sequences")
    print(f"  Test:       {len(X_test_seq):,} sequences")
    
    # Compute class weights
    benign_count = np.sum(y_train == 0)
    attack_count = np.sum(y_train == 1)
    total = len(y_train)
    
    class_weight = {
        0: total / (2 * benign_count),
        1: total / (2 * attack_count)
    }
    
    print(f"\n⚖️  Class Weights:")
    print(f"  BENIGN: {class_weight[0]:.4f}")
    print(f"  ATTACK: {class_weight[1]:.4f}")
    
    # Build model
    model = build_cnn_lstm(SEQUENCE_LENGTH, len(feature_cols))
    
    # Train
    history, train_time = train_cnn_lstm(
        model, X_train, y_train, X_val, y_val,
        class_weight, args.dataset
    )
    
    # Load best model
    output_dir = ARTIFACTS_DIR / f"{args.dataset}_cnnlstm"
    best_model_path = output_dir / 'best_model.h5'
    model = keras.models.load_model(best_model_path)
    print(f"\n✓ Loaded best model from: {best_model_path.name}")
    
    # Evaluate
    metrics = evaluate_cnn_lstm(model, X_test_seq, y_test_seq, args.dataset)
    
    # Save results
    save_results(model, history, metrics, train_time, args.dataset)
    
    print("\n" + "=" * 70)
    print("✅ CNN-LSTM TRAINING COMPLETE!")
    print("=" * 70)
    print(f"\n🎯 Final Metrics:")
    print(f"  F1-Score (macro):  {metrics['f1_macro']:.4f}")
    print(f"  Benign Recall:     {metrics['per_class']['BENIGN']['recall']:.2%}")
    print(f"  Attack Recall:     {metrics['per_class']['ATTACK']['recall']:.2%}")
    print(f"\n📁 Results saved to: {output_dir}")


if __name__ == "__main__":
    main()
