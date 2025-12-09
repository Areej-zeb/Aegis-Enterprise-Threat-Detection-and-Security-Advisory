"""
Train ALL baseline models (stateful + stateless) with one command

This script trains both stateful and stateless baseline ML models
sequentially and provides a comprehensive comparison report.

Usage:
    python -m backend.ids.models.train_all_baselines --balance smote_undersample
    python -m backend.ids.models.train_all_baselines --balance none
"""

import argparse
import subprocess
import sys
from pathlib import Path
import json
from datetime import datetime

def print_header(text, char="="):
    """Print a formatted header"""
    width = 70
    print(f"\n{char * width}")
    print(f"{text.center(width)}")
    print(f"{char * width}\n")

def train_model(feature_type, balance_strategy):
    """Train a single model type"""
    print_header(f"🔨 TRAINING {feature_type.upper()} MODELS", "=")
    
    cmd = [
        sys.executable, "-m", "backend.ids.models.baseline_ml_dns",
        "--type", feature_type,
        "--balance", balance_strategy
    ]
    
    print(f"Command: {' '.join(cmd)}\n")
    
    result = subprocess.run(cmd, capture_output=False, text=True)
    
    if result.returncode != 0:
        print(f"\n❌ Failed to train {feature_type} models!")
        return False
    
    print(f"\n✅ {feature_type.upper()} training complete!")
    return True

def load_metrics(feature_type):
    """Load metrics JSON file"""
    root = Path(__file__).resolve().parents[3]
    metrics_path = root / "artifacts" / f"baseline_ml_{feature_type}" / "metrics.json"
    
    if not metrics_path.exists():
        return None
    
    with open(metrics_path, 'r') as f:
        return json.load(f)

def compare_results():
    """Compare stateful vs stateless results"""
    print_header("📊 FINAL COMPARISON - STATEFUL vs STATELESS", "=")
    
    stateful_metrics = load_metrics('stateful')
    stateless_metrics = load_metrics('stateless')
    
    if not stateful_metrics or not stateless_metrics:
        print("⚠️  Could not load metrics for comparison")
        return
    
    print(f"{'Model':<15s} {'Type':<10s} {'Accuracy':>10s} {'F1-Score':>10s} {'Train Time':>12s}")
    print("─" * 70)
    
    # Stateful results
    for model_name, data in sorted(stateful_metrics['models'].items(), key=lambda x: x[1]['accuracy'], reverse=True):
        print(f"{model_name:<15s} {'STATEFUL':<10s} {data['accuracy']:>9.4f}  {data['f1_score']:>9.4f}  {data['train_time']:>9.2f}s")
    
    print()
    
    # Stateless results
    for model_name, data in sorted(stateless_metrics['models'].items(), key=lambda x: x[1]['accuracy'], reverse=True):
        print(f"{model_name:<15s} {'STATELESS':<10s} {data['accuracy']:>9.4f}  {data['f1_score']:>9.4f}  {data['train_time']:>9.2f}s")
    
    # Best models
    print("\n" + "=" * 70)
    print("🏆 BEST MODELS")
    print("=" * 70)
    
    best_stateful = max(stateful_metrics['models'].items(), key=lambda x: x[1]['f1_score'])
    best_stateless = max(stateless_metrics['models'].items(), key=lambda x: x[1]['f1_score'])
    
    print(f"\n🥇 Stateful:  {best_stateful[0]}")
    print(f"   Accuracy:  {best_stateful[1]['accuracy']*100:.2f}%")
    print(f"   F1-Score:  {best_stateful[1]['f1_score']:.4f}")
    print(f"   Time:      {best_stateful[1]['train_time']:.2f}s")
    
    print(f"\n🥇 Stateless: {best_stateless[0]}")
    print(f"   Accuracy:  {best_stateless[1]['accuracy']*100:.2f}%")
    print(f"   F1-Score:  {best_stateless[1]['f1_score']:.4f}")
    print(f"   Time:      {best_stateless[1]['train_time']:.2f}s")
    
    # Research targets
    print("\n" + "=" * 70)
    print("📈 RESEARCH PAPER TARGETS")
    print("=" * 70)
    print("\nStateful models:  99.7% accuracy")
    print("Stateless models: 93.95% accuracy")
    
    print(f"\n📁 Results saved to:")
    root = Path(__file__).resolve().parents[3]
    print(f"   - {root / 'artifacts' / 'baseline_ml_stateful'}")
    print(f"   - {root / 'artifacts' / 'baseline_ml_stateless'}")

def main():
    parser = argparse.ArgumentParser(description='Train ALL baseline ML models (stateful + stateless)')
    parser.add_argument('--balance', default='smote_undersample',
                       choices=['none', 'smote', 'undersample', 'smote_undersample'],
                       help='Balancing strategy for both models (default: smote_undersample)')
    args = parser.parse_args()
    
    print("\n" + "=" * 70)
    print("🛡️  AEGIS IDS - TRAIN ALL BASELINE MODELS")
    print("=" * 70)
    print(f"\nBalancing Strategy: {args.balance}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\nThis will train:")
    print("  1. Stateful models (Random Forest, KNN, Decision Tree, Extra Trees)")
    print("  2. Stateless models (Random Forest, KNN, Decision Tree, Extra Trees)")
    print("\nTotal: 8 models with GridSearchCV (3-fold CV)")
    
    input("\nPress ENTER to start training...")
    
    start_time = datetime.now()
    
    # Train stateful
    success_stateful = train_model('stateful', args.balance)
    
    # Train stateless
    success_stateless = train_model('stateless', args.balance)
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    # Show comparison
    if success_stateful and success_stateless:
        compare_results()
        
        print("\n" + "=" * 70)
        print("✅ ALL TRAINING COMPLETE!")
        print("=" * 70)
        print(f"\nTotal Time: {duration/60:.1f} minutes ({duration:.0f} seconds)")
        print(f"Finished: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    else:
        print("\n" + "=" * 70)
        print("⚠️  TRAINING INCOMPLETE")
        print("=" * 70)
        if not success_stateful:
            print("❌ Stateful training failed")
        if not success_stateless:
            print("❌ Stateless training failed")

if __name__ == "__main__":
    main()
