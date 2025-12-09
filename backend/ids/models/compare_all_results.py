"""
Comprehensive Results Comparison
Compares Baseline ML (stateful/stateless) with CRNN models
"""

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[3]
ARTIFACTS = ROOT / "artifacts"

def load_metrics(model_type):
    """Load metrics JSON file"""
    path = ARTIFACTS / model_type / "metrics.json"
    if not path.exists():
        return None
    return json.load(open(path))

def print_section(title):
    """Print section divider"""
    print(f"\n{'=' * 90}")
    print(f"{title:^90s}")
    print('=' * 90)

def print_model_summary(name, data, model_type=""):
    """Print model metrics in a formatted row"""
    acc = data.get('accuracy', 0) * 100
    
    # Handle different metric structures
    if 'f1_macro' in data:
        f1 = data['f1_macro']
        precision = data.get('precision_macro', 0)
        recall = data.get('recall_macro', 0)
    else:
        f1 = data.get('f1_score', 0)
        precision = data.get('precision', 0)
        recall = data.get('recall', 0)
    
    time = data.get('train_time', 0)
    
    # Calculate FP and FN from confusion matrix
    cm = data.get('confusion_matrix', [[0, 0], [0, 0]])
    
    # Handle different confusion matrix formats (2-class vs 3-class)
    if len(cm) == 2:
        tn, fp = cm[0][0], cm[0][1]
        fn, tp = cm[1][0], cm[1][1]
        total_attacks = tp + fn
        total_benign = tn + fp
    else:  # 3-class CRNN
        # Sum all attack classes
        total_benign = sum(cm[0])
        total_attacks = sum(sum(row) for row in cm[1:])
        fp = cm[0][1] + cm[0][2]  # Benign misclassified as attack
        fn = sum(row[0] for row in cm[1:])  # Attacks misclassified as benign
        tn = cm[0][0]
        tp = total_attacks - fn
    
    type_str = f" ({model_type})" if model_type else ""
    print(f"{name + type_str:<25s} {acc:>7.2f}%  {f1:>7.4f}  {precision:>7.4f}  {recall:>7.4f}  "
          f"{fp:>6d}  {fn:>6d}  {time:>8.1f}s")

def main():
    print_section("🎯 COMPREHENSIVE MODEL COMPARISON - ALL RESULTS")
    
    # Load all metrics
    stateful_ml = load_metrics("baseline_ml_stateful")
    stateless_ml = load_metrics("baseline_ml_stateless")
    crnn_stateful = load_metrics("crnn_stateful")
    crnn_stateless = load_metrics("crnn_stateless")
    
    # Print header
    print(f"\n{'Model':<25s} {'Accuracy':>8s}  {'F1-Score':>8s}  {'Precision':>10s}  "
          f"{'Recall':>8s}  {'FP':>6s}  {'FN':>6s}  {'Time':>9s}")
    print("─" * 90)
    
    # Print stateful models
    if stateful_ml:
        print("\n🔵 STATEFUL FEATURES (Flow-based, temporal patterns)")
        for name, data in sorted(stateful_ml['models'].items(), 
                                key=lambda x: x[1]['f1_macro'], reverse=True):
            print_model_summary(name, data, "ML")
    
    if crnn_stateful:
        print_model_summary("CRNN", crnn_stateful['metrics'], "DL")
    
    # Print stateless models
    if stateless_ml:
        print("\n🟢 STATELESS FEATURES (DNS query structure)")
        for name, data in sorted(stateless_ml['models'].items(), 
                                key=lambda x: x[1]['f1_macro'], reverse=True):
            print_model_summary(name, data, "ML")
    
    if crnn_stateless:
        print_model_summary("CRNN", crnn_stateless['metrics'], "DL")
    
    # Find best models
    print_section("🏆 BEST PERFORMERS BY METRIC")
    
    all_models = []
    
    if stateful_ml:
        for name, data in stateful_ml['models'].items():
            all_models.append(("Stateful " + name, data, "ML"))
    
    if stateless_ml:
        for name, data in stateless_ml['models'].items():
            all_models.append(("Stateless " + name, data, "ML"))
    
    if crnn_stateful:
        all_models.append(("Stateful CRNN", crnn_stateful['metrics'], "DL"))
    
    if crnn_stateless:
        all_models.append(("Stateless CRNN", crnn_stateless['metrics'], "DL"))
    
    # Best by accuracy
    best_acc = max(all_models, key=lambda x: x[1].get('accuracy', 0))
    print(f"\n🥇 Highest Accuracy: {best_acc[0]}")
    print(f"   {best_acc[1].get('accuracy', 0)*100:.2f}%")
    
    # Best by F1-score
    best_f1 = max(all_models, key=lambda x: x[1].get('f1_macro', x[1].get('f1_score', 0)))
    f1_val = best_f1[1].get('f1_macro', best_f1[1].get('f1_score', 0))
    print(f"\n🥇 Highest F1-Score: {best_f1[0]}")
    print(f"   {f1_val:.4f}")
    
    # Lowest FP
    def get_fp(data):
        cm = data.get('confusion_matrix', [[0, 0], [0, 0]])
        if len(cm) == 2:
            return cm[0][1]
        else:
            return cm[0][1] + cm[0][2]
    
    best_fp = min(all_models, key=lambda x: get_fp(x[1]))
    print(f"\n🥇 Lowest False Positives: {best_fp[0]}")
    print(f"   {get_fp(best_fp[1])} benign samples misclassified")
    
    # Lowest FN
    def get_fn(data):
        cm = data.get('confusion_matrix', [[0, 0], [0, 0]])
        if len(cm) == 2:
            return cm[1][0]
        else:
            return sum(row[0] for row in cm[1:])
    
    best_fn = min(all_models, key=lambda x: get_fn(x[1]))
    print(f"\n🥇 Lowest False Negatives: {best_fn[0]}")
    print(f"   {get_fn(best_fn[1])} attacks missed")
    
    # Summary
    print_section("📊 SUMMARY")
    
    if stateful_ml:
        print(f"\n✅ Stateful ML Models: {len(stateful_ml['models'])} trained")
        print(f"   Best: {max(stateful_ml['models'].items(), key=lambda x: x[1]['f1_macro'])[0]}")
    
    if stateless_ml:
        print(f"\n✅ Stateless ML Models: {len(stateless_ml['models'])} trained")
        print(f"   Best: {max(stateless_ml['models'].items(), key=lambda x: x[1]['f1_macro'])[0]}")
    
    if crnn_stateful:
        print(f"\n✅ Stateful CRNN: Trained")
        print(f"   Accuracy: {crnn_stateful['metrics']['accuracy']*100:.2f}%")
    
    if crnn_stateless:
        print(f"\n✅ Stateless CRNN: Trained")
        print(f"   Accuracy: {crnn_stateless['metrics']['accuracy']*100:.2f}%")
    
    print(f"\n📁 All models saved to: {ARTIFACTS}")
    print("\n" + "=" * 90)

if __name__ == "__main__":
    main()
