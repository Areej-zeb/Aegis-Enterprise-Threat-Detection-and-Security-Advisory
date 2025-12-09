#!/usr/bin/env python3
"""
AEGIS ITERATION-2 - PHASE 1: DATASET-LEVEL EVALUATION

Tests ML model correctness using classic metrics:
- Confusion Matrix
- Precision, Recall, F1-Score (per class)
- ROC-AUC, PR-AUC
- False Positive Rate per 10k flows
- Threshold sweep analysis

Flow Structure: All flows shuffled/random from test.parquet
Expected Output: Comprehensive metrics report
"""

import json
import time
from pathlib import Path
from typing import Dict, Tuple
import numpy as np
import pandas as pd
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    confusion_matrix, classification_report, roc_auc_score,
    precision_recall_curve, roc_curve, auc, average_precision_score
)
from datetime import datetime

class Phase1DatasetEvaluator:
    """Classic ML evaluation on test dataset"""
    
    def __init__(self, model_path: str, test_data_path: str, output_dir: str = "evaluation/results/phase1"):
        """
        Args:
            model_path: Path to trained model (artifacts/Syn/xgb_baseline.joblib)
            test_data_path: Path to test dataset (datasets/processed/Syn/test.parquet)
            output_dir: Where to save evaluation results
        """
        self.model_path = Path(model_path)
        self.test_data_path = Path(test_data_path)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Load model
        print(f"📦 Loading model from {self.model_path}")
        model_dict = joblib.load(self.model_path)
        self.model = model_dict['model']
        self.label_encoder = model_dict['label_encoder']
        self.classes = self.label_encoder.classes_
        
        # Load test data
        print(f"📊 Loading test dataset from {self.test_data_path}")
        df_test = pd.read_parquet(self.test_data_path)
        self.X_test = df_test.drop('label', axis=1)
        self.y_test = df_test['label']
        
        print(f"✅ Loaded {len(self.X_test):,} test samples")
        print(f"   Classes: {list(self.classes)}")
        print(f"   Distribution: {dict(self.y_test.value_counts())}\n")
        
        # Results storage
        self.results = {}
    
    def evaluate_full_dataset(self) -> Dict:
        """Run complete evaluation on entire test set"""
        print("="*70)
        print("PHASE 1: DATASET-LEVEL EVALUATION")
        print("="*70)
        
        start_time = time.time()
        
        # Make predictions
        print("\n1️⃣ Making predictions on test set...")
        y_pred = self.model.predict(self.X_test)
        y_pred_proba = self.model.predict_proba(self.X_test)
        
        # Convert predictions to labels
        y_pred_labels = [self.classes[int(p)] for p in y_pred]
        
        elapsed = time.time() - start_time
        throughput = len(self.X_test) / elapsed
        
        print(f"   ✓ Predictions complete in {elapsed:.2f}s ({throughput:.0f} flows/sec)")
        
        # 1. Confusion Matrix
        print("\n2️⃣ Computing confusion matrix...")
        cm = confusion_matrix(self.y_test, y_pred_labels, labels=self.classes)
        self._plot_confusion_matrix(cm)
        
        # 2. Classification Report
        print("\n3️⃣ Computing classification metrics...")
        report = classification_report(
            self.y_test, y_pred_labels,
            target_names=self.classes,
            output_dict=True
        )
        self._print_classification_report(report)
        
        # 3. False Positive Analysis
        print("\n4️⃣ Computing False Positive Rate...")
        fp_rate = self._compute_fp_rate(cm)
        
        # 4. ROC-AUC Analysis (binary classification)
        print("\n5️⃣ Computing ROC-AUC...")
        roc_metrics = self._compute_roc_auc(y_pred_proba)
        
        # 5. Threshold Sweep
        print("\n6️⃣ Running threshold sweep analysis...")
        threshold_results = self._threshold_sweep(y_pred_proba)
        
        # Store results
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "model_path": str(self.model_path),
            "test_dataset": str(self.test_data_path),
            "test_size": len(self.X_test),
            "evaluation_time_sec": elapsed,
            "throughput_flows_per_sec": throughput,
            "confusion_matrix": cm.tolist(),
            "classification_report": report,
            "false_positive_rate_per_10k": fp_rate,
            "roc_auc": roc_metrics,
            "threshold_sweep": threshold_results
        }
        
        # Save results
        self._save_results()
        
        print("\n" + "="*70)
        print("✅ PHASE 1 EVALUATION COMPLETE")
        print("="*70)
        print(f"\n📁 Results saved to: {self.output_dir}")
        
        return self.results
    
    def _plot_confusion_matrix(self, cm: np.ndarray):
        """Plot and save confusion matrix"""
        plt.figure(figsize=(10, 8))
        sns.heatmap(
            cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=self.classes,
            yticklabels=self.classes
        )
        plt.xlabel('Predicted Label')
        plt.ylabel('True Label')
        plt.title('Confusion Matrix - Phase 1 Dataset Evaluation')
        plt.tight_layout()
        
        cm_path = self.output_dir / "confusion_matrix.png"
        plt.savefig(cm_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"   ✓ Confusion matrix saved to {cm_path}")
        
        # Print confusion matrix details
        print("\n   Confusion Matrix Breakdown:")
        if len(self.classes) == 2:
            tn, fp, fn, tp = cm.ravel()
            print(f"      True Positives (TP):  {tp:,}")
            print(f"      False Positives (FP): {fp:,}")
            print(f"      True Negatives (TN):  {tn:,}")
            print(f"      False Negatives (FN): {fn:,}")
    
    def _print_classification_report(self, report: Dict):
        """Print formatted classification report"""
        print("\n   Classification Report:")
        print("   " + "-"*60)
        print(f"   {'Class':<15} {'Precision':<12} {'Recall':<12} {'F1-Score':<12} {'Support'}")
        print("   " + "-"*60)
        
        for class_name in self.classes:
            if class_name in report:
                metrics = report[class_name]
                print(f"   {class_name:<15} "
                      f"{metrics['precision']:<12.4f} "
                      f"{metrics['recall']:<12.4f} "
                      f"{metrics['f1-score']:<12.4f} "
                      f"{int(metrics['support']):,}")
        
        print("   " + "-"*60)
        print(f"   {'Accuracy':<15} {'':<12} {'':<12} {report['accuracy']:<12.4f} {int(report['macro avg']['support']):,}")
        print(f"   {'Macro Avg':<15} "
              f"{report['macro avg']['precision']:<12.4f} "
              f"{report['macro avg']['recall']:<12.4f} "
              f"{report['macro avg']['f1-score']:<12.4f}")
        print(f"   {'Weighted Avg':<15} "
              f"{report['weighted avg']['precision']:<12.4f} "
              f"{report['weighted avg']['recall']:<12.4f} "
              f"{report['weighted avg']['f1-score']:<12.4f}")
        print("   " + "-"*60)
    
    def _compute_fp_rate(self, cm: np.ndarray) -> float:
        """Compute False Positive rate per 10,000 flows"""
        if len(self.classes) == 2:
            tn, fp, fn, tp = cm.ravel()
            total_flows = len(self.X_test)
            fp_per_10k = (fp / total_flows) * 10000
            
            print(f"\n   False Positive Analysis:")
            print(f"      Total False Positives: {fp:,}")
            print(f"      Total Flows: {total_flows:,}")
            print(f"      FP Rate per 10,000 flows: {fp_per_10k:.2f}")
            print(f"      FP Percentage: {(fp/total_flows)*100:.4f}%")
            
            return fp_per_10k
        else:
            # Multi-class: compute FP for attack class
            attack_idx = list(self.classes).index('DDoS_SYN') if 'DDoS_SYN' in self.classes else 0
            fp = cm[:, attack_idx].sum() - cm[attack_idx, attack_idx]
            fp_per_10k = (fp / len(self.X_test)) * 10000
            print(f"   FP Rate per 10k flows: {fp_per_10k:.2f}")
            return fp_per_10k
    
    def _compute_roc_auc(self, y_pred_proba: np.ndarray) -> Dict:
        """Compute ROC-AUC and PR-AUC for binary classification"""
        if len(self.classes) != 2:
            print("   ⚠️  ROC-AUC only computed for binary classification")
            return {}
        
        # Get probabilities for positive class (attack)
        attack_idx = list(self.classes).index('DDoS_SYN') if 'DDoS_SYN' in self.classes else 1
        y_scores = y_pred_proba[:, attack_idx]
        
        # Convert labels to binary
        y_true_binary = (self.y_test == self.classes[attack_idx]).astype(int)
        
        # ROC-AUC
        fpr, tpr, _ = roc_curve(y_true_binary, y_scores)
        roc_auc = auc(fpr, tpr)
        
        # PR-AUC
        precision, recall, _ = precision_recall_curve(y_true_binary, y_scores)
        pr_auc = average_precision_score(y_true_binary, y_scores)
        
        print(f"   ROC-AUC Score: {roc_auc:.4f}")
        print(f"   PR-AUC Score:  {pr_auc:.4f}")
        
        # Plot ROC curve
        plt.figure(figsize=(10, 5))
        
        plt.subplot(1, 2, 1)
        plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (AUC = {roc_auc:.4f})')
        plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--', label='Random Classifier')
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title('Receiver Operating Characteristic (ROC)')
        plt.legend(loc="lower right")
        plt.grid(alpha=0.3)
        
        plt.subplot(1, 2, 2)
        plt.plot(recall, precision, color='darkorange', lw=2, label=f'PR curve (AUC = {pr_auc:.4f})')
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.title('Precision-Recall Curve')
        plt.legend(loc="lower left")
        plt.grid(alpha=0.3)
        
        plt.tight_layout()
        roc_path = self.output_dir / "roc_pr_curves.png"
        plt.savefig(roc_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"   ✓ ROC/PR curves saved to {roc_path}")
        
        return {
            "roc_auc": float(roc_auc),
            "pr_auc": float(pr_auc)
        }
    
    def _threshold_sweep(self, y_pred_proba: np.ndarray) -> Dict:
        """Evaluate model performance across different thresholds"""
        if len(self.classes) != 2:
            print("   ⚠️  Threshold sweep only for binary classification")
            return {}
        
        attack_idx = list(self.classes).index('DDoS_SYN') if 'DDoS_SYN' in self.classes else 1
        y_scores = y_pred_proba[:, attack_idx]
        y_true_binary = (self.y_test == self.classes[attack_idx]).astype(int)
        
        thresholds = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
        results = []
        
        print("\n   Threshold Sweep Results:")
        print("   " + "-"*70)
        print(f"   {'Threshold':<12} {'Recall':<12} {'Precision':<12} {'F1-Score':<12} {'FP Rate'}")
        print("   " + "-"*70)
        
        for threshold in thresholds:
            y_pred_thresh = (y_scores >= threshold).astype(int)
            
            # Compute metrics
            tn = ((y_true_binary == 0) & (y_pred_thresh == 0)).sum()
            fp = ((y_true_binary == 0) & (y_pred_thresh == 1)).sum()
            fn = ((y_true_binary == 1) & (y_pred_thresh == 0)).sum()
            tp = ((y_true_binary == 1) & (y_pred_thresh == 1)).sum()
            
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0
            precision = tp / (tp + fp) if (tp + fp) > 0 else 0
            f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
            fp_rate = fp / (fp + tn) if (fp + tn) > 0 else 0
            
            results.append({
                "threshold": threshold,
                "recall": float(recall),
                "precision": float(precision),
                "f1_score": float(f1),
                "fp_rate": float(fp_rate),
                "tp": int(tp),
                "fp": int(fp),
                "tn": int(tn),
                "fn": int(fn)
            })
            
            print(f"   {threshold:<12.1f} "
                  f"{recall:<12.4f} "
                  f"{precision:<12.4f} "
                  f"{f1:<12.4f} "
                  f"{fp_rate:<12.4f}")
        
        print("   " + "-"*70)
        
        # Find optimal threshold (max F1)
        best_result = max(results, key=lambda x: x['f1_score'])
        print(f"\n   🎯 Optimal Threshold: {best_result['threshold']} (F1={best_result['f1_score']:.4f})")
        
        # Plot threshold analysis
        self._plot_threshold_analysis(results)
        
        return {
            "thresholds": results,
            "optimal_threshold": best_result
        }
    
    def _plot_threshold_analysis(self, results: list):
        """Plot threshold vs metrics"""
        thresholds = [r['threshold'] for r in results]
        recalls = [r['recall'] for r in results]
        precisions = [r['precision'] for r in results]
        f1_scores = [r['f1_score'] for r in results]
        fp_rates = [r['fp_rate'] for r in results]
        
        plt.figure(figsize=(12, 5))
        
        plt.subplot(1, 2, 1)
        plt.plot(thresholds, recalls, 'o-', label='Recall', linewidth=2)
        plt.plot(thresholds, precisions, 's-', label='Precision', linewidth=2)
        plt.plot(thresholds, f1_scores, '^-', label='F1-Score', linewidth=2)
        plt.xlabel('Threshold')
        plt.ylabel('Score')
        plt.title('Performance Metrics vs Threshold')
        plt.legend()
        plt.grid(alpha=0.3)
        
        plt.subplot(1, 2, 2)
        plt.plot(thresholds, fp_rates, 'ro-', linewidth=2)
        plt.xlabel('Threshold')
        plt.ylabel('False Positive Rate')
        plt.title('False Positive Rate vs Threshold')
        plt.grid(alpha=0.3)
        
        plt.tight_layout()
        thresh_path = self.output_dir / "threshold_analysis.png"
        plt.savefig(thresh_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"   ✓ Threshold analysis saved to {thresh_path}")
    
    def _save_results(self):
        """Save evaluation results to JSON"""
        results_path = self.output_dir / "phase1_results.json"
        with open(results_path, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        # Also save human-readable report
        report_path = self.output_dir / "phase1_report.txt"
        with open(report_path, 'w') as f:
            f.write("="*70 + "\n")
            f.write("AEGIS ITERATION-2 - PHASE 1: DATASET-LEVEL EVALUATION REPORT\n")
            f.write("="*70 + "\n\n")
            f.write(f"Timestamp: {self.results['timestamp']}\n")
            f.write(f"Model: {self.results['model_path']}\n")
            f.write(f"Test Dataset: {self.results['test_dataset']}\n")
            f.write(f"Test Size: {self.results['test_size']:,} flows\n")
            f.write(f"Evaluation Time: {self.results['evaluation_time_sec']:.2f} seconds\n")
            f.write(f"Throughput: {self.results['throughput_flows_per_sec']:.0f} flows/sec\n\n")
            
            f.write("-"*70 + "\n")
            f.write("CLASSIFICATION REPORT\n")
            f.write("-"*70 + "\n")
            report = self.results['classification_report']
            for class_name in self.classes:
                if class_name in report:
                    metrics = report[class_name]
                    f.write(f"\n{class_name}:\n")
                    f.write(f"  Precision: {metrics['precision']:.4f}\n")
                    f.write(f"  Recall:    {metrics['recall']:.4f}\n")
                    f.write(f"  F1-Score:  {metrics['f1-score']:.4f}\n")
                    f.write(f"  Support:   {int(metrics['support']):,}\n")
            
            f.write(f"\nOverall Accuracy: {report['accuracy']:.4f}\n")
            f.write(f"\nFalse Positive Rate per 10k flows: {self.results['false_positive_rate_per_10k']:.2f}\n")
            
            if 'roc_auc' in self.results and self.results['roc_auc']:
                f.write(f"\nROC-AUC: {self.results['roc_auc']['roc_auc']:.4f}\n")
                f.write(f"PR-AUC:  {self.results['roc_auc']['pr_auc']:.4f}\n")
            
            if 'threshold_sweep' in self.results and 'optimal_threshold' in self.results['threshold_sweep']:
                opt = self.results['threshold_sweep']['optimal_threshold']
                f.write(f"\nOptimal Threshold: {opt['threshold']} (F1={opt['f1_score']:.4f})\n")
        
        print(f"\n   ✓ Results saved to {results_path}")
        print(f"   ✓ Report saved to {report_path}")


def main():
    """Run Phase 1 evaluation"""
    import argparse
    
    parser = argparse.ArgumentParser(description="AEGIS Phase 1: Dataset-Level Evaluation")
    parser.add_argument("--model", type=str, required=True, help="Path to trained model")
    parser.add_argument("--test-data", type=str, required=True, help="Path to test dataset")
    parser.add_argument("--output", type=str, default="evaluation/results/phase1", help="Output directory")
    
    args = parser.parse_args()
    
    evaluator = Phase1DatasetEvaluator(
        model_path=args.model,
        test_data_path=args.test_data,
        output_dir=args.output
    )
    
    results = evaluator.evaluate_full_dataset()
    
    print("\n✅ Phase 1 evaluation complete!")
    print(f"📊 Results saved to: {args.output}")


if __name__ == "__main__":
    main()
