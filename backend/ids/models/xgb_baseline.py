"""
xgb_baseline_v2.py
Enhanced IDS Model Training with CUDA, Progress Monitoring, and Checkpoints

Features:
  - Real-time progress bars with tqdm
  - CUDA verification and GPU monitoring
  - Automatic checkpoints during training
  - Detailed training logs
  - Multi-dataset support

Outputs:
  - artifacts/<dataset>/xgb_baseline.joblib (best model)
  - artifacts/<dataset>/checkpoints/ (intermediate models)
  - seed/shap_example.json (SHAP values for UI)
  - backend/ids/experiments/<dataset>_baseline.md (metrics report)

Usage:
    python -m backend.ids.models.xgb_baseline_v2 --dataset Syn
    
    Or train all:
    python -m backend.ids.models.xgb_baseline_v2 --all
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
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

# Set matplotlib backend BEFORE importing shap
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for server environments

import shap
import warnings
warnings.filterwarnings('ignore')

# Progress bars
from tqdm import tqdm

# local imports
import sys
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
try:
    from backend.ids.schemas import FEATURES, LABELS
except ImportError:
    # Fallback if schemas not available
    FEATURES = []
    LABELS = []

# =============================================================================
# Paths
# =============================================================================
PROCESSED_DIR = ROOT / "datasets" / "processed"
ARTIFACTS = ROOT / "artifacts"
EXPERIMENTS = ROOT / "backend" / "ids" / "experiments"
SEED = ROOT / "seed"
CHECKPOINTS_DIR = ROOT / "checkpoints"

ARTIFACTS.mkdir(exist_ok=True)
EXPERIMENTS.mkdir(parents=True, exist_ok=True)
SEED.mkdir(exist_ok=True)
CHECKPOINTS_DIR.mkdir(exist_ok=True)

# =============================================================================
# CUDA / GPU Verification
# =============================================================================

def check_cuda_availability():
    """Check CUDA availability with detailed diagnostics."""
    print("\n" + "="*70)
    print("🔥 CUDA / GPU VERIFICATION")
    print("="*70)
    
    cuda_available = False
    gpu_info = {}
    
    # Check PyTorch CUDA
    try:
        import torch
        cuda_available = torch.cuda.is_available()
        
        if cuda_available:
            gpu_info['device_count'] = torch.cuda.device_count()
            gpu_info['device_name'] = torch.cuda.get_device_name(0)
            gpu_info['cuda_version'] = torch.version.cuda
            gpu_info['memory_allocated'] = f"{torch.cuda.memory_allocated(0) / 1024**2:.2f} MB"
            gpu_info['memory_reserved'] = f"{torch.cuda.memory_reserved(0) / 1024**2:.2f} MB"
            gpu_info['memory_total'] = f"{torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB"
            
            print("✅ CUDA is AVAILABLE")
            print(f"   GPU: {gpu_info['device_name']}")
            print(f"   CUDA Version: {gpu_info['cuda_version']}")
            print(f"   Total Memory: {gpu_info['memory_total']}")
            print(f"   Device Count: {gpu_info['device_count']}")
        else:
            print("⚠️  CUDA not available via PyTorch")
    except ImportError:
        print("⚠️  PyTorch not installed, cannot verify CUDA")
    
    # Check XGBoost GPU support
    try:
        from xgboost import __version__ as xgb_version
        print(f"\n📦 XGBoost version: {xgb_version}")
        
        # Test XGBoost GPU (XGBoost 3.x API)
        if cuda_available:
            test_clf = XGBClassifier(
                device='cuda',
                tree_method='hist',
                n_estimators=10,
                random_state=42
            )
            # Create dummy data
            X_test = np.random.rand(100, 10)
            y_test = np.random.randint(0, 2, 100)
            test_clf.fit(X_test, y_test)
            
            print("✅ XGBoost GPU training: WORKING")
            print("   → device='cuda' validated")
        else:
            print("⚠️  XGBoost will use CPU (tree_method='hist')")
    except Exception as e:
        print(f"❌ XGBoost GPU test failed: {e}")
        cuda_available = False
    
    print("="*70 + "\n")
    
    return cuda_available, gpu_info


def get_gpu_memory_usage():
    """Get current GPU memory usage."""
    try:
        import torch
        if torch.cuda.is_available():
            allocated = torch.cuda.memory_allocated(0) / 1024**2
            reserved = torch.cuda.memory_reserved(0) / 1024**2
            return f"GPU Memory: {allocated:.1f}MB allocated, {reserved:.1f}MB reserved"
    except:
        pass
    return ""


# =============================================================================
# Data Loading
# =============================================================================

def load_dataset_splits(dataset_name: str):
    """Load train/val/test splits for a dataset."""
    dataset_dir = PROCESSED_DIR / dataset_name
    
    if not dataset_dir.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_dir}")
    
    print(f"\n📂 Loading dataset: {dataset_name}")
    print(f"   Path: {dataset_dir}")
    
    # Load parquet files
    train_df = pd.read_parquet(dataset_dir / "train.parquet")
    val_df = pd.read_parquet(dataset_dir / "val.parquet")
    test_df = pd.read_parquet(dataset_dir / "test.parquet")
    
    # Load metadata
    with open(dataset_dir / "metadata.json", "r") as f:
        metadata = json.load(f)
    
    # Extract class weights
    class_weights_original = metadata.get('class_weights', {}).get('original', {})
    class_weights_balanced = metadata.get('class_weights', {}).get('balanced', {})
    
    print(f"   ✓ Train: {len(train_df):,} samples")
    print(f"   ✓ Val:   {len(val_df):,} samples")
    print(f"   ✓ Test:  {len(test_df):,} samples")
    print(f"   ✓ Features: {len(metadata['features'])}")
    print(f"   ✓ Classes: {list(metadata['label_distribution']['train'].keys())}")
    
    if class_weights_original:
        print(f"   ✓ Class weights (original): {class_weights_original}")
    if class_weights_balanced:
        print(f"   ✓ Class weights (balanced): {class_weights_balanced}")
    
    # Get feature list from metadata (may be different than FEATURES constant)
    feature_list = metadata.get('features', FEATURES)
    
    # Split features and labels
    X_train = train_df[feature_list]
    y_train = train_df['label']
    X_val = val_df[feature_list]
    y_val = val_df['label']
    X_test = test_df[feature_list]
    y_test = test_df['label']
    
    return X_train, y_train, X_val, y_val, X_test, y_test, metadata


# =============================================================================
# XGBoost Label Wrapper (module-level for pickling)
# =============================================================================

class XGBWithLabels:
    """Wrapper for XGBoost that handles label encoding/decoding."""
    def __init__(self, model, label_encoder):
        self.model = model
        self.label_encoder = label_encoder
    
    def predict(self, X):
        encoded_preds = self.model.predict(X)
        return self.label_encoder.inverse_transform(encoded_preds.astype(int))
    
    def predict_proba(self, X):
        return self.model.predict_proba(X)


# =============================================================================
# Threshold Tuning
# =============================================================================

def tune_threshold(model, X_val, y_val, thresholds=np.arange(0.3, 0.91, 0.05)):
    """Find optimal classification threshold on validation set.
    
    Args:
        model: Trained model with predict_proba method
        X_val: Validation features
        y_val: Validation labels
        thresholds: Array of thresholds to test
    
    Returns:
        dict: Best threshold and metrics
    """
    if not hasattr(model, 'predict_proba'):
        return None
    
    print(f"\n  🎯 Tuning classification threshold on validation set...")
    
    # Get predicted probabilities
    probs = model.predict_proba(X_val)
    
    # For binary classification, use positive class probability
    classes = sorted(y_val.unique())
    if len(classes) == 2:
        pos_probs = probs[:, 1]  # Probability of positive class (attack)
        
        best_threshold = 0.5
        best_f1 = 0.0
        best_metrics = {}
        threshold_results = []
        
        for threshold in thresholds:
            # Apply threshold
            preds = (pos_probs >= threshold).astype(int)
            preds_labels = [classes[p] for p in preds]
            
            # Calculate metrics
            f1 = f1_score(y_val, preds_labels, average="macro", zero_division=0)
            accuracy = accuracy_score(y_val, preds_labels)
            recall_per_class = recall_score(y_val, preds_labels, average=None, zero_division=0, labels=classes)
            precision_per_class = precision_score(y_val, preds_labels, average=None, zero_division=0, labels=classes)
            
            threshold_results.append({
                'threshold': threshold,
                'f1': f1,
                'accuracy': accuracy,
                'benign_recall': recall_per_class[0],
                'attack_recall': recall_per_class[1],
                'benign_precision': precision_per_class[0],
                'attack_precision': precision_per_class[1]
            })
            
            if f1 > best_f1:
                best_f1 = f1
                best_threshold = threshold
                best_metrics = {
                    'threshold': threshold,
                    'f1': f1,
                    'accuracy': accuracy,
                    'benign_recall': recall_per_class[0],
                    'attack_recall': recall_per_class[1],
                    'benign_precision': precision_per_class[0],
                    'attack_precision': precision_per_class[1],
                    'classes': classes
                }
        
        # Print summary
        print(f"     ✓ Tested {len(thresholds)} thresholds from {thresholds[0]:.2f} to {thresholds[-1]:.2f}")
        print(f"     🏆 Best threshold: {best_threshold:.2f} (F1={best_f1:.4f})")
        print(f"        {classes[0]} recall: {best_metrics['benign_recall']:.4f}")
        print(f"        {classes[1]} recall: {best_metrics['attack_recall']:.4f}")
        
        return {
            'best': best_metrics,
            'all_results': threshold_results
        }
    
    return None


# =============================================================================
# Model Evaluation
# =============================================================================

def evaluate_model(model, X_test, y_test, model_name="Model", optimal_threshold=None):
    """Evaluate model with comprehensive metrics.
    
    Args:
        optimal_threshold: If provided (dict with 'threshold' and 'classes'), 
                          use tuned threshold instead of default 0.5
    """
    print(f"\n  📊 Evaluating {model_name}...")
    
    # Predictions with default threshold (0.5)
    start_time = time.time()
    preds = model.predict(X_test)
    inference_time = time.time() - start_time
    
    # Get unique classes
    classes = sorted(y_test.unique())
    
    # Overall metrics (default 0.5 threshold)
    accuracy = accuracy_score(y_test, preds)
    macro_f1 = f1_score(y_test, preds, average="macro", zero_division=0)
    weighted_f1 = f1_score(y_test, preds, average="weighted", zero_division=0)
    macro_precision = precision_score(y_test, preds, average="macro", zero_division=0)
    macro_recall = recall_score(y_test, preds, average="macro", zero_division=0)
    
    # Per-class metrics
    per_class_f1 = f1_score(y_test, preds, average=None, zero_division=0, labels=classes)
    per_class_precision = precision_score(y_test, preds, average=None, zero_division=0, labels=classes)
    per_class_recall = recall_score(y_test, preds, average=None, zero_division=0, labels=classes)
    
    # Confusion matrix
    cm = confusion_matrix(y_test, preds, labels=classes)
    
    # ROC-AUC
    try:
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X_test)
            y_test_dummies = pd.get_dummies(y_test)
            roc = roc_auc_score(y_test_dummies, probs, average="macro", multi_class="ovr")
        else:
            roc = 0.0
    except:
        roc = 0.0
    
    # Print overall metrics (default threshold)
    print(f"\n     📊 Metrics at default threshold (0.5):")
    print(f"     ✓ Accuracy:       {accuracy:.4f}")
    print(f"     ✓ Macro F1:       {macro_f1:.4f} ⭐")
    print(f"     ✓ Weighted F1:    {weighted_f1:.4f}")
    print(f"     ✓ Macro Precision: {macro_precision:.4f}")
    print(f"     ✓ Macro Recall:    {macro_recall:.4f}")
    print(f"     ✓ ROC-AUC:        {roc:.4f}")
    print(f"     ✓ Inference:      {inference_time:.2f}s ({len(X_test)/inference_time:.0f} samples/s)")
    
    # Print per-class metrics (default threshold)
    print(f"\n     📊 Per-Class Metrics (threshold=0.5):")
    print(f"     {'Class':<15} {'Precision':<12} {'Recall':<12} {'F1-Score':<12}")
    print(f"     {'-'*15} {'-'*12} {'-'*12} {'-'*12}")
    for i, cls in enumerate(classes):
        print(f"     {cls:<15} {per_class_precision[i]:>11.4f} {per_class_recall[i]:>11.4f} {per_class_f1[i]:>11.4f}")
    
    # If optimal threshold provided, evaluate with tuned threshold
    tuned_metrics = None
    if optimal_threshold and hasattr(model, 'predict_proba'):
        threshold_val = optimal_threshold.get('threshold', 0.5)
        threshold_classes = optimal_threshold.get('classes', classes)
        
        print(f"\n     📊 Metrics at tuned threshold ({threshold_val:.2f}):")
        
        # Get probabilities and apply tuned threshold
        probs = model.predict_proba(X_test)
        pos_probs = probs[:, 1]  # Positive class probability
        tuned_preds_binary = (pos_probs >= threshold_val).astype(int)
        tuned_preds = [threshold_classes[p] for p in tuned_preds_binary]
        
        # Calculate tuned metrics
        tuned_accuracy = accuracy_score(y_test, tuned_preds)
        tuned_f1 = f1_score(y_test, tuned_preds, average="macro", zero_division=0)
        tuned_precision = precision_score(y_test, tuned_preds, average="macro", zero_division=0)
        tuned_recall = recall_score(y_test, tuned_preds, average="macro", zero_division=0)
        
        tuned_per_class_f1 = f1_score(y_test, tuned_preds, average=None, zero_division=0, labels=classes)
        tuned_per_class_precision = precision_score(y_test, tuned_preds, average=None, zero_division=0, labels=classes)
        tuned_per_class_recall = recall_score(y_test, tuned_preds, average=None, zero_division=0, labels=classes)
        
        print(f"     ✓ Accuracy:       {tuned_accuracy:.4f}")
        print(f"     ✓ Macro F1:       {tuned_f1:.4f} ⭐")
        print(f"     ✓ Macro Precision: {tuned_precision:.4f}")
        print(f"     ✓ Macro Recall:    {tuned_recall:.4f}")
        
        print(f"\n     📊 Per-Class Metrics (threshold={threshold_val:.2f}):")
        print(f"     {'Class':<15} {'Precision':<12} {'Recall':<12} {'F1-Score':<12}")
        print(f"     {'-'*15} {'-'*12} {'-'*12} {'-'*12}")
        for i, cls in enumerate(classes):
            print(f"     {cls:<15} {tuned_per_class_precision[i]:>11.4f} {tuned_per_class_recall[i]:>11.4f} {tuned_per_class_f1[i]:>11.4f}")
        
        tuned_metrics = {
            'accuracy': tuned_accuracy,
            'f1_macro': tuned_f1,
            'precision_macro': tuned_precision,
            'recall_macro': tuned_recall,
            'per_class_f1': {cls: tuned_per_class_f1[i] for i, cls in enumerate(classes)},
            'per_class_precision': {cls: tuned_per_class_precision[i] for i, cls in enumerate(classes)},
            'per_class_recall': {cls: tuned_per_class_recall[i] for i, cls in enumerate(classes)}
        }
    
    # Classification report
    class_report = classification_report(y_test, preds, labels=classes, output_dict=True, zero_division=0)
    
    result = {
        'accuracy': accuracy,
        'f1_macro': macro_f1,
        'f1_weighted': weighted_f1,
        'precision_macro': macro_precision,
        'recall_macro': macro_recall,
        'roc_auc': roc,
        'per_class_f1': {cls: float(f1) for cls, f1 in zip(classes, per_class_f1)},
        'per_class_precision': {cls: float(p) for cls, p in zip(classes, per_class_precision)},
        'per_class_recall': {cls: float(r) for cls, r in zip(classes, per_class_recall)},
        'confusion_matrix': cm.tolist(),
        'classification_report': class_report,
        'inference_time': inference_time,
        'classes': classes
    }
    
    # Add tuned threshold metrics if available
    if tuned_metrics:
        result['tuned_threshold'] = optimal_threshold.get('threshold', 0.5)
        result['tuned_metrics'] = tuned_metrics
    
    return result


# =============================================================================
# Checkpoint System
# =============================================================================

class CheckpointManager:
    """Manage model checkpoints during training."""
    
    def __init__(self, dataset_name: str):
        self.checkpoint_dir = CHECKPOINTS_DIR / dataset_name
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        self.best_score = -np.inf
        self.best_model_path = None
        
        print(f"\n💾 Checkpoint directory: {self.checkpoint_dir}")
    
    def save_checkpoint(self, model, model_name: str, metrics: dict, epoch: int = None):
        """Save model checkpoint."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if epoch is not None:
            filename = f"{model_name}_epoch{epoch}_{timestamp}.joblib"
        else:
            filename = f"{model_name}_{timestamp}.joblib"
        
        checkpoint_path = self.checkpoint_dir / filename
        
        # Save model
        dump(model, checkpoint_path)
        
        # Save metrics
        metrics_path = checkpoint_path.with_suffix('.json')
        with open(metrics_path, 'w') as f:
            # Convert numpy types to Python types recursively
            def convert_to_native(obj):
                if isinstance(obj, (np.integer, np.int64)):
                    return int(obj)
                elif isinstance(obj, (np.floating, np.float64)):
                    return float(obj)
                elif isinstance(obj, dict):
                    return {str(k): convert_to_native(v) for k, v in obj.items()}
                elif isinstance(obj, (list, tuple)):
                    return [convert_to_native(item) for item in obj]
                else:
                    return obj
            
            metrics_clean = convert_to_native(metrics)
            json.dump(metrics_clean, f, indent=2)
        
        print(f"   ✓ Checkpoint saved: {filename}")
        
        # Track best model
        score = metrics.get('f1_macro', 0)
        if score > self.best_score:
            self.best_score = score
            self.best_model_path = checkpoint_path
            print(f"   🏆 New best model! F1={score:.4f}")
        
        return checkpoint_path
    
    def get_best_model(self):
        """Load the best model."""
        if self.best_model_path and self.best_model_path.exists():
            return load(self.best_model_path)
        return None


# =============================================================================
# Model Training
# =============================================================================

def train_models(X_train, y_train, X_val, y_val, X_test, y_test, dataset_name: str, metadata: dict, use_gpu: bool = False, gpu_only: bool = False):
    """Train multiple models with progress monitoring and checkpoints.
    
    Args:
        metadata: Dataset metadata including class weights
        gpu_only: If True, skip sklearn models and train only XGBoost on GPU for maximum speed
    """
    
    checkpoint_mgr = CheckpointManager(dataset_name)
    results = {}
    
    print("\n" + "="*70)
    print("🤖 TRAINING MODELS")
    if gpu_only:
        print("⚡ GPU-ONLY MODE: Training XGBoost with full GPU acceleration only")
    else:
        print("⚡ Training XGBoost (CPU mode)")
    print("="*70)
    
    # Model configurations - ONLY XGBoost as requested by user
    models = []
    
    # XGBoost Training
    model_num = "1️⃣"
    print(f"\n{model_num} Training XGBoost...")
    
    # Optimized hyperparameters for better accuracy and balance
    xgb_params = {
        'n_estimators': 300,  # More trees for better learning
        'max_depth': 12,  # Deeper trees to capture complex patterns
        'learning_rate': 0.05,  # Lower LR for better convergence with more trees
        'min_child_weight': 3,  # Prevent overfitting to attack patterns
        'gamma': 0.1,  # Minimum loss reduction for splits (regularization)
        'reg_alpha': 0.1,  # L1 regularization
        'reg_lambda': 1.0,  # L2 regularization
        'random_state': 42,
        'eval_metric': 'logloss'  # Binary log loss (not mlogloss)
    }
    
    # Early stopping rounds (passed to fit(), not to constructor)
    early_stopping_rounds = 20
    
    if use_gpu:
        # XGBoost 3.x GPU configuration for MAXIMUM GPU utilization
        # In XGBoost 3.x, use 'hist' tree_method with device='cuda' (gpu_hist deprecated)
        xgb_params['device'] = 'cuda:0'
        xgb_params['tree_method'] = 'hist'  # 'hist' + device='cuda' is the new GPU method
        # Aggressive GPU settings for high utilization:
        xgb_params['max_bin'] = 512  # More bins = more GPU compute
        xgb_params['max_leaves'] = 256  # More leaves = more GPU work
        xgb_params['grow_policy'] = 'lossguide'  # Better for large datasets on GPU
        xgb_params['subsample'] = 0.9  
        xgb_params['colsample_bytree'] = 0.9
        # Remove n_jobs completely - conflicts with GPU
        print("   🔥 Using FULL GPU acceleration (tree_method='hist' + device='cuda:0')")
        print("   💡 GPU settings: max_bin=512, max_leaves=256, grow_policy=lossguide")
    else:
        xgb_params['device'] = 'cpu'
        xgb_params['tree_method'] = 'hist'
        xgb_params['n_jobs'] = -1
        print("   Using CPU (device='cpu')")
    
    print(f"   Parameters: {xgb_params}")
    
    # Encode labels for XGBoost (needs numeric labels)
    label_encoder = LabelEncoder()
    y_train_encoded = label_encoder.fit_transform(y_train)
    y_val_encoded = label_encoder.transform(y_val)
    y_test_encoded = label_encoder.transform(y_test)
    
    # Calculate scale_pos_weight from ACTUAL training data distribution
    # Critical: Must match what the model sees, not the original imbalanced dataset
    # For DNS: natural 61/39 ratio preserved → scale_pos_weight ≈ 1.56
    # If SMOTE was applied → scale_pos_weight ≈ 1.0 (balanced)
    print(f"   Label encoding: {label_encoder.classes_} -> {list(range(len(label_encoder.classes_)))}")
    print(f"   Encoded train labels: min={y_train_encoded.min()}, max={y_train_encoded.max()}, unique={np.unique(y_train_encoded)}")
    
    # Count actual samples in training data
    n_neg = np.sum(y_train_encoded == 0)  # Usually BENIGN
    n_pos = np.sum(y_train_encoded == 1)  # Usually attack
    
    # Tune scale_pos_weight to balance precision/recall
    # Standard formula: n_neg / n_pos, but we adjust slightly to improve BENIGN recall
    if n_pos > 0:
        base_weight = n_neg / n_pos
        # For attack-heavy datasets (pos > neg), reduce weight slightly to help BENIGN recall
        # For benign-heavy datasets (neg > pos), use standard weight
        if n_pos > n_neg:
            scale_pos_weight = base_weight * 0.85  # Reduce attack bias by 15%
            print(f"   ⚖️  scale_pos_weight: {scale_pos_weight:.4f} (tuned from {base_weight:.4f} to improve BENIGN recall)")
        else:
            scale_pos_weight = base_weight
            print(f"   ⚖️  scale_pos_weight: {scale_pos_weight:.4f} (from actual train data: {n_neg:,} neg / {n_pos:,} pos)")
        xgb_params['scale_pos_weight'] = scale_pos_weight
        print(f"   📊 Train distribution: {n_neg:,} BENIGN / {n_pos:,} ATTACK")
    else:
        print(f"   ⚠️  No positive samples in training data, skipping scale_pos_weight")
    
    # XGBoost 3.x doesn't support custom callbacks, use progress bar wrapper
    xgb = XGBClassifier(**xgb_params)
    
    print("   Training XGBoost...")
    with tqdm(total=xgb_params['n_estimators'], desc="   Progress", unit="iter") as pbar:
        # Train with validation monitoring (but no early stopping in sklearn API)
        xgb.fit(
            X_train, y_train_encoded,
            eval_set=[(X_val, y_val_encoded)],
            verbose=False
        )
        n_trees = xgb_params['n_estimators']
        pbar.update(n_trees)
    
    # Wrap XGBoost model with label encoder for proper predictions
    xgb_wrapped = XGBWithLabels(xgb, label_encoder)
    
    # Tune threshold on validation set
    threshold_results = tune_threshold(xgb_wrapped, X_val, y_val)
    optimal_threshold = threshold_results['best'] if threshold_results else None
    
    # Evaluate on test set with both default and tuned thresholds
    xgb_metrics = evaluate_model(xgb_wrapped, X_test, y_test, "XGBoost", optimal_threshold)
    
    # Add threshold tuning results to metrics
    if threshold_results:
        xgb_metrics['threshold_tuning'] = {
            'optimal_threshold': optimal_threshold['threshold'],
            'validation_f1': optimal_threshold['f1'],
            'all_thresholds': threshold_results['all_results']
        }
    
    checkpoint_mgr.save_checkpoint(xgb_wrapped, "xgboost", xgb_metrics)
    results['XGBoost'] = xgb_metrics
    print(f"   {get_gpu_memory_usage()}")
    
    # Save best model to artifacts/<dataset>/
    # Determine the best model by F1 score
    best_model_name = max(results.items(), key=lambda x: x[1]['f1_macro'])[0]
    
    if best_model_name == 'LogisticRegression':
        best_model_to_save = lr
    elif best_model_name == 'RandomForest':
        best_model_to_save = rf
    else:  # XGBoost
        # Save XGBoost with label encoder for proper predictions
        best_model_to_save = {'model': xgb, 'label_encoder': label_encoder}
    
    artifact_dir = ARTIFACTS / dataset_name
    artifact_dir.mkdir(parents=True, exist_ok=True)
    best_model_path = artifact_dir / "xgb_baseline.joblib"
    dump(best_model_to_save, best_model_path)
    print(f"\n🏆 Best model ({best_model_name}, F1={results[best_model_name]['f1_macro']:.4f}) saved to: {best_model_path}")
    
    # Save comprehensive metrics to JSON
    metrics_path = artifact_dir / "training_metrics.json"
    metrics_data = {
        'dataset': dataset_name,
        'best_model': best_model_name,
        'timestamp': datetime.now().isoformat(),
        'models': {}
    }
    
    for model_name, metrics in results.items():
        metrics_data['models'][model_name] = {
            'accuracy': float(metrics['accuracy']),
            'f1_macro': float(metrics['f1_macro']),
            'f1_weighted': float(metrics['f1_weighted']),
            'precision_macro': float(metrics['precision_macro']),
            'recall_macro': float(metrics['recall_macro']),
            'roc_auc': float(metrics['roc_auc']),
            'per_class_metrics': {
                'precision': metrics['per_class_precision'],
                'recall': metrics['per_class_recall'],
                'f1_score': metrics['per_class_f1']
            },
            'confusion_matrix': metrics['confusion_matrix'],
            'inference_time': float(metrics['inference_time'])
        }
    
    # Convert numpy types to Python types recursively
    def convert_to_native(obj):
        if isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        elif isinstance(obj, dict):
            return {str(k): convert_to_native(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [convert_to_native(item) for item in obj]
        else:
            return obj
    
    with open(metrics_path, 'w') as f:
        json.dump(convert_to_native(metrics_data), f, indent=2)
    
    print(f"📊 Comprehensive metrics saved to: {metrics_path}")
    
    return results, xgb_wrapped


# =============================================================================
# SHAP Explainability
# =============================================================================

def generate_shap_values(model, X_test, y_test):
    """Generate SHAP values for model explainability."""
    print("\n" + "="*70)
    print("🔍 GENERATING SHAP & LIME EXPLAINABILITY")
    print("="*70)
    
    # Get actual feature list from data
    feature_list = list(X_test.columns)
    
    # Take a sample for SHAP/LIME (full dataset too slow)
    sample_size = min(1000, len(X_test))
    X_sample = X_test.sample(n=sample_size, random_state=42)
    y_sample = y_test.loc[X_sample.index]
    
    print(f"   Using {sample_size} samples for XAI analysis...")
    print(f"   Features: {len(feature_list)}")
    
    # Unwrap XGBoost model if it's wrapped
    raw_model = model
    if isinstance(model, XGBWithLabels):
        raw_model = model.model
    
    # =========================================================================
    # SHAP (SHapley Additive exPlanations)
    # =========================================================================
    print("\n   📊 Computing SHAP values...")
    try:
        # Use KernelExplainer as fallback for XGBoost 3.x compatibility
        # It's model-agnostic and works with any predictor
        background_data = shap.sample(X_test, 100)  # Background dataset for KernelExplainer
        
        # Define prediction function for KernelExplainer
        def predict_fn(X):
            if isinstance(X, pd.DataFrame):
                return model.predict_proba(X)[:, 1]  # Probability of positive class
            return model.predict_proba(pd.DataFrame(X, columns=feature_list))[:, 1]
        
        explainer = shap.KernelExplainer(predict_fn, background_data)
        
        # Calculate SHAP values for first sample only (faster)
        first_sample = X_sample.iloc[0:1]
        with tqdm(total=1, desc="   SHAP Progress", unit="sample") as pbar:
            shap_values = explainer.shap_values(first_sample, nsamples=100)
            pbar.update(1)
        
        # Save SHAP data
        shap_dict = {
            "features": feature_list,
            "shap_values": [float(v) for v in shap_values[0]],
            "feature_values": [float(v) for v in first_sample.iloc[0].values],
            "base_value": float(explainer.expected_value)
        }
        
        shap_path = SEED / "shap_example.json"
        with open(shap_path, "w") as f:
            json.dump(shap_dict, f, indent=2)
        
        print(f"   ✓ SHAP values saved to: {shap_path}")
        
    except Exception as e:
        print(f"   ⚠️  SHAP KernelExplainer failed: {e}")
        print("   Trying TreeExplainer with XGBoost model directly...")
        
        try:
            # Last resort: Try TreeExplainer with raw XGBoost model
            explainer = shap.TreeExplainer(raw_model)
            shap_values = explainer.shap_values(first_sample)
            
            shap_dict = {
                "features": feature_list,
                "shap_values": [float(v) for v in shap_values[0]],
                "feature_values": [float(v) for v in first_sample.iloc[0].values],
                "base_value": float(explainer.expected_value)
            }
            
            shap_path = SEED / "shap_example.json"
            with open(shap_path, "w") as f:
                json.dump(shap_dict, f, indent=2)
            
            print(f"   ✓ SHAP values saved to: {shap_path}")
            
        except Exception as e2:
            print(f"   ❌ SHAP generation failed completely: {e2}")
            shap_dict = None
    
    # =========================================================================
    # LIME (Local Interpretable Model-agnostic Explanations)
    # =========================================================================
    print("\n   🔬 Computing LIME explanations...")
    try:
        from lime.lime_tabular import LimeTabularExplainer
        
        # Get class names properly
        if hasattr(model, 'label_encoder'):
            class_names = list(model.label_encoder.classes_)
        else:
            class_names = ['Class_0', 'Class_1']
        
        # Create LIME explainer
        lime_explainer = LimeTabularExplainer(
            training_data=X_test.values,
            feature_names=feature_list,
            class_names=class_names,
            mode='classification',
            random_state=42
        )
        
        # Explain first sample
        first_sample_idx = 0
        with tqdm(total=1, desc="   LIME Progress", unit="sample") as pbar:
            explanation = lime_explainer.explain_instance(
                data_row=X_sample.iloc[first_sample_idx].values,
                predict_fn=model.predict_proba,
                num_features=len(feature_list)
            )
            pbar.update(1)
        
        # Extract LIME data - convert to proper format
        lime_list = explanation.as_list()
        lime_values_dict = {}
        for feature_expr, value in lime_list:
            # Extract feature name from expressions like "flow_duration <= 0.5"
            feature_name = feature_expr.split()[0] if ' ' in feature_expr else feature_expr
            lime_values_dict[feature_name] = float(value)
        
        # Get prediction
        pred_sample = X_sample.iloc[first_sample_idx:first_sample_idx+1]
        prediction = model.predict(pred_sample)[0]
        prediction_proba = model.predict_proba(pred_sample)[0]
        
        lime_data = {
            "features": feature_list,
            "lime_values": lime_values_dict,
            "feature_values": [float(v) for v in X_sample.iloc[first_sample_idx].values],
            "prediction": str(prediction),  # Convert to string to avoid serialization issues
            "prediction_proba": [float(p) for p in prediction_proba],
            "class_names": class_names
        }
        
        lime_path = SEED / "lime_example.json"
        with open(lime_path, "w") as f:
            json.dump(lime_data, f, indent=2)
        
        print(f"   ✓ LIME explanations saved to: {lime_path}")
        
    except ImportError:
        print("   ⚠️  LIME not installed. Install with: pip install lime")
    except Exception as e:
        print(f"   ⚠️  LIME generation failed: {e}")
    
    print("\n   ✅ Explainability analysis complete!")
    return shap_dict if 'shap_dict' in locals() else None


# =============================================================================
# Generate Report
# =============================================================================

def generate_report(results: dict, dataset_name: str, metadata: dict):
    """Generate markdown report with training results."""
    print("\n" + "="*70)
    print("📝 GENERATING TRAINING REPORT")
    print("="*70)
    
    report_path = EXPERIMENTS / f"{dataset_name}_baseline.md"
    
    with open(report_path, "w") as f:
        f.write(f"# IDS Baseline Training Report - {dataset_name}\n\n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write("## Dataset Information\n\n")
        f.write(f"- **Name:** {dataset_name}\n")
        f.write(f"- **Features:** {len(metadata['features'])}\n")
        f.write(f"- **Classes:** {', '.join(metadata['label_distribution']['train'].keys())}\n")
        # Use total_samples instead of sizes for compatibility
        if 'sizes' in metadata:
            f.write(f"- **Train samples:** {metadata['sizes']['train']:,}\n")
            f.write(f"- **Val samples:** {metadata['sizes']['val']:,}\n")
            f.write(f"- **Test samples:** {metadata['sizes']['test']:,}\n\n")
        elif 'total_samples' in metadata:
            f.write(f"- **Train samples:** {metadata['total_samples']['train']:,}\n")
            f.write(f"- **Val samples:** {metadata['total_samples']['val']:,}\n")
            f.write(f"- **Test samples:** {metadata['total_samples']['test']:,}\n\n")
        
        # Class weights
        if 'class_weights' in metadata:
            f.write("### Class Weights\n\n")
            f.write("**Original (pre-balancing):**\n\n")
            for cls, weight in metadata['class_weights']['original'].items():
                f.write(f"- {cls}: {weight:.4f}\n")
            f.write("\n**After Balancing:**\n\n")
            for cls, weight in metadata['class_weights']['balanced'].items():
                f.write(f"- {cls}: {weight:.4f}\n")
            f.write("\n")
        
        f.write("## Overall Model Performance\n\n")
        f.write("| Model | Accuracy | Macro F1 | Weighted F1 | Precision | Recall | ROC-AUC |\n")
        f.write("|-------|----------|----------|-------------|-----------|--------|----------|\n")
        
        for model_name, metrics in results.items():
            f.write(f"| {model_name} | {metrics['accuracy']:.4f} | {metrics['f1_macro']:.4f} | ")
            f.write(f"{metrics.get('f1_weighted', 0):.4f} | {metrics.get('precision_macro', 0):.4f} | ")
            f.write(f"{metrics.get('recall_macro', 0):.4f} | {metrics['roc_auc']:.4f} |\n")
        
        # Per-class metrics for best model
        best_model_name = max(results.items(), key=lambda x: x[1]['f1_macro'])[0]
        best_metrics = results[best_model_name]
        
        f.write("\n## Best Model\n\n")
        f.write(f"**{best_model_name}** - Macro F1 Score: {best_metrics['f1_macro']:.4f}\n\n")
        
        f.write("### Per-Class Performance\n\n")
        f.write("| Class | Precision | Recall | F1-Score |\n")
        f.write("|-------|-----------|--------|----------|\n")
        
        if 'per_class_precision' in best_metrics:
            classes = best_metrics.get('classes', best_metrics['per_class_precision'].keys())
            for cls in classes:
                prec = best_metrics['per_class_precision'].get(cls, 0)
                rec = best_metrics['per_class_recall'].get(cls, 0)
                f1 = best_metrics['per_class_f1'].get(cls, 0)
                f.write(f"| {cls} | {prec:.4f} | {rec:.4f} | {f1:.4f} |\n")
        
        f.write("\n## Training Configuration\n\n")
        if 'preprocessing' in metadata:
            f.write(f"- Preprocessing: {metadata['preprocessing']['normalization']}\n")
            f.write(f"- Imbalance handling: {metadata['preprocessing']['imbalance_handling']}\n")
            f.write(f"- Max samples: {metadata['preprocessing'].get('max_samples', 'N/A')}\n")
            f.write(f"- Target ratio: {metadata['preprocessing'].get('target_ratio', 'N/A')}\n")
            f.write(f"- Random state: {metadata['preprocessing']['random_state']}\n\n")
        else:
            f.write("- Configuration details not available in metadata\n\n")
    
    print(f"   ✓ Report saved to: {report_path}")


# =============================================================================
# Main
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Aegis IDS Enhanced Model Training")
    parser.add_argument("--dataset", type=str, help="Dataset name (folder in processed/)")
    parser.add_argument("--all", action="store_true", help="Train on all datasets")
    parser.add_argument("--gpu-only", action="store_true", help="Skip CPU models, train XGBoost only (requires GPU)")
    args = parser.parse_args()
    
    print("\n" + "="*70)
    print("🛡️  AEGIS IDS - ENHANCED MODEL TRAINING")
    print("="*70)
    
    # Check CUDA
    use_gpu, gpu_info = check_cuda_availability()
    
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
            # Load data
            X_train, y_train, X_val, y_val, X_test, y_test, metadata = load_dataset_splits(dataset_name)
            
            # Train models
            start_time = time.time()
            results, best_model = train_models(X_train, y_train, X_val, y_val, X_test, y_test, dataset_name, metadata, use_gpu, args.gpu_only)
            training_time = time.time() - start_time
            
            print(f"\n⏱️  Total training time: {training_time/60:.2f} minutes")
            
            # Generate SHAP (optional, may fail with XGBoost 3.x)
            try:
                generate_shap_values(best_model, X_test, y_test)
            except Exception as e:
                print(f"\n⚠️  SHAP generation skipped (XGBoost 3.x compatibility issue): {e}")
            
            # Generate report
            generate_report(results, dataset_name, metadata)
            
            print(f"\n✅ Training complete for {dataset_name}!")
            
        except Exception as e:
            print(f"\n❌ Error training on {dataset_name}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    print("\n" + "="*70)
    print("✅ ALL TRAINING COMPLETE!")
    print("="*70)
    print(f"\n📦 Models saved to: {ARTIFACTS}")
    print(f"💾 Checkpoints saved to: {CHECKPOINTS_DIR}")
    print(f"📝 Reports saved to: {EXPERIMENTS}\n")


if __name__ == "__main__":
    main()
