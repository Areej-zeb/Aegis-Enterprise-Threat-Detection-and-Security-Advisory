"""
Display comprehensive comparison of STATEFUL vs STATELESS models
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
ARTIFACTS = ROOT / "artifacts"

def load_metrics(feature_type):
    """Load metrics for a feature type"""
    metrics_path = ARTIFACTS / f"baseline_ml_{feature_type}" / "metrics.json"
    if metrics_path.exists():
        return json.load(open(metrics_path))
    return None

def print_model_results(name, data, feature_type):
    """Print detailed results for a model"""
    acc = data['accuracy'] * 100
    f1 = data['f1_macro']
    cm = data['confusion_matrix']
    
    # Calculate metrics
    tn, fp = cm[0][0], cm[0][1]
    fn, tp = cm[1][0], cm[1][1]
    
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    
    print(f"\n{'─' * 80}")
    print(f"📊 {name} ({feature_type.upper()})")
    print(f"{'─' * 80}")
    print(f"  Accuracy:  {acc:6.2f}%  |  F1-Score: {f1:.4f}  |  Time: {data['train_time']:.1f}s")
    print(f"\n  📈 Attack Detection:")
    print(f"     True Positives (TP):  {tp:5d} attacks correctly detected ✅")
    print(f"     False Negatives (FN): {fn:5d} attacks missed ⚠️")
    print(f"     → Recall (Detection): {recall*100:6.2f}% ({tp}/{tp+fn} attacks caught)")
    print(f"\n  📉 False Alarms:")
    print(f"     True Negatives (TN):  {tn:5d} benign correctly classified ✅")
    print(f"     False Positives (FP): {fp:5d} benign wrongly flagged as attack ⚠️")
    print(f"     → Precision:          {precision*100:6.2f}% ({tp}/{tp+fp} correct when flagged)")
    print(f"\n  Confusion Matrix:")
    print(f"                    Predicted")
    print(f"                BENIGN  ATTACK")
    print(f"     Actual BENIGN  {tn:5d}   {fp:5d}")
    print(f"            ATTACK  {fn:5d}   {tp:5d}")

def main():
    print("\n" + "=" * 80)
    print("🎯 COMPREHENSIVE RESULTS - STATEFUL vs STATELESS MODELS")
    print("   Strategy: SMOTE + Undersampling (1:10 ratio)")
    print("   Training: 1,143 attacks + 11,430 benign = 12,573 samples")
    print("=" * 80)
    
    # Load both metrics
    stateful = load_metrics('stateful')
    stateless = load_metrics('stateless')
    
    if not stateful:
        print("\n⚠️  Stateful metrics not found - training may still be in progress")
        return
    if not stateless:
        print("\n⚠️  Stateless metrics not found - training may still be in progress")
        return
    
    # Sort models by F1 score
    stateful_models = sorted(stateful['models'].items(), 
                            key=lambda x: x[1]['f1_macro'], reverse=True)
    stateless_models = sorted(stateless['models'].items(), 
                             key=lambda x: x[1]['f1_macro'], reverse=True)
    
    # Quick comparison table
    print(f"\n{'=' * 80}")
    print(f"📊 QUICK COMPARISON")
    print(f"{'=' * 80}")
    print(f"\n{'Model':<15s} {'Type':<12s} {'Accuracy':>10s} {'F1-Score':>10s} {'Recall':>10s} {'Time':>10s}")
    print("─" * 80)
    
    for name, data in stateful_models:
        acc = data['accuracy'] * 100
        f1 = data['f1_macro']
        cm = data['confusion_matrix']
        recall = cm[1][1] / (cm[1][0] + cm[1][1]) if (cm[1][0] + cm[1][1]) > 0 else 0
        time = data['train_time']
        print(f"{name:<15s} {'STATEFUL':<12s} {acc:>9.2f}% {f1:>10.4f} {recall*100:>9.1f}% {time:>9.1f}s")
    
    print()
    
    for name, data in stateless_models:
        acc = data['accuracy'] * 100
        f1 = data['f1_macro']
        cm = data['confusion_matrix']
        recall = cm[1][1] / (cm[1][0] + cm[1][1]) if (cm[1][0] + cm[1][1]) > 0 else 0
        time = data['train_time']
        print(f"{name:<15s} {'STATELESS':<12s} {acc:>9.2f}% {f1:>10.4f} {recall*100:>9.1f}% {time:>9.1f}s")
    
    # Detailed results for best models
    print(f"\n{'=' * 80}")
    print(f"🏆 DETAILED RESULTS - BEST MODELS")
    print(f"{'=' * 80}")
    
    best_stateful = stateful_models[0]
    best_stateless = stateless_models[0]
    
    print_model_results(best_stateful[0], best_stateful[1], 'stateful')
    print_model_results(best_stateless[0], best_stateless[1], 'stateless')
    
    # Summary
    print(f"\n{'=' * 80}")
    print(f"✅ SUMMARY")
    print(f"{'=' * 80}")
    
    sf_acc = best_stateful[1]['accuracy'] * 100
    sf_f1 = best_stateful[1]['f1_macro']
    sf_cm = best_stateful[1]['confusion_matrix']
    sf_tp = sf_cm[1][1]
    sf_fn = sf_cm[1][0]
    sf_fp = sf_cm[0][1]
    
    sl_acc = best_stateless[1]['accuracy'] * 100
    sl_f1 = best_stateless[1]['f1_macro']
    sl_cm = best_stateless[1]['confusion_matrix']
    sl_tp = sl_cm[1][1]
    sl_fn = sl_cm[1][0]
    sl_fp = sl_cm[0][1]
    
    print(f"\n🥇 BEST STATEFUL:  {best_stateful[0]}")
    print(f"   Accuracy:       {sf_acc:.2f}%")
    print(f"   F1-Score:       {sf_f1:.4f} ⭐")
    print(f"   Attack Recall:  {sf_tp}/{sf_tp+sf_fn} ({sf_tp/(sf_tp+sf_fn)*100:.1f}%)")
    print(f"   False Positives: {sf_fp} (low is better)")
    print(f"   False Negatives: {sf_fn} (low is better)")
    
    print(f"\n🥇 BEST STATELESS: {best_stateless[0]}")
    print(f"   Accuracy:       {sl_acc:.2f}%")
    print(f"   F1-Score:       {sl_f1:.4f} ⭐")
    print(f"   Attack Recall:  {sl_tp}/{sl_tp+sl_fn} ({sl_tp/(sl_tp+sl_fn)*100:.1f}%)")
    print(f"   False Positives: {sl_fp} (low is better)")
    print(f"   False Negatives: {sl_fn} (low is better)")
    
    print(f"\n📈 KEY METRICS ACHIEVED:")
    print(f"   ✅ Balanced Dataset: 1:10 ratio (attack:benign)")
    print(f"   ✅ High Accuracy: {max(sf_acc, sl_acc):.2f}% (best model)")
    print(f"   ✅ Strong F1-Score: {max(sf_f1, sl_f1):.4f} (balanced precision/recall)")
    print(f"   ✅ Attack Detection: {max(sf_tp, sl_tp)} attacks caught")
    print(f"   ✅ Low False Alarms: {min(sf_fp, sl_fp)} false positives (best model)")
    
    print(f"\n📁 Models saved to:")
    print(f"   - artifacts/baseline_ml_stateful/")
    print(f"   - artifacts/baseline_ml_stateless/")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    main()
