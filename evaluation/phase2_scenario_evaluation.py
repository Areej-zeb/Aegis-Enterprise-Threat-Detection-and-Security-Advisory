#!/usr/bin/env python3
"""
AEGIS ITERATION-2 - PHASE 2: SCENARIO-BASED EVALUATION

Tests model behavior over time with realistic traffic sequences:
- Scenario 1: All Benign (stability test - should have 0 alerts)
- Scenario 2: Pure Attack (sensitivity test - should detect all)
- Scenario 3: Mixed Timeline (realistic - benign → attack → benign)
- Scenario 4: Stealth Slow Attack (sparse attacks)

Flow Structure: Flows arranged in time-sequences (not random)
Expected Output: Detection delay, alert timeline, FP analysis
"""

import json
import time
from pathlib import Path
from typing import Dict, List, Tuple
import numpy as np
import pandas as pd
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta

class Phase2ScenarioEvaluator:
    """Scenario-based evaluation with time-sequenced flows"""
    
    def __init__(self, model_path: str, test_data_path: str, output_dir: str = "evaluation/results/phase2"):
        """
        Args:
            model_path: Path to trained model
            test_data_path: Path to test dataset
            output_dir: Where to save results
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
        
        print(f"✅ Loaded {len(self.X_test):,} test samples\n")
        
        # Results storage
        self.results = {}
    
    def run_all_scenarios(self) -> Dict:
        """Run all 4 scenarios"""
        print("="*70)
        print("PHASE 2: SCENARIO-BASED EVALUATION")
        print("="*70)
        
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "model_path": str(self.model_path),
            "test_dataset": str(self.test_data_path),
            "scenarios": {}
        }
        
        # Scenario 1: All Benign
        print("\n" + "─"*70)
        print("SCENARIO 1: ALL BENIGN SEQUENCE (Stability Test)")
        print("─"*70)
        scenario1_results = self.scenario_1_all_benign()
        self.results["scenarios"]["scenario_1_all_benign"] = scenario1_results
        
        # Scenario 2: Pure Attack
        print("\n" + "─"*70)
        print("SCENARIO 2: PURE ATTACK SEQUENCE (Sensitivity Test)")
        print("─"*70)
        scenario2_results = self.scenario_2_pure_attack()
        self.results["scenarios"]["scenario_2_pure_attack"] = scenario2_results
        
        # Scenario 3: Mixed Timeline
        print("\n" + "─"*70)
        print("SCENARIO 3: MIXED TIMELINE (Realistic Intrusion)")
        print("─"*70)
        scenario3_results = self.scenario_3_mixed_timeline()
        self.results["scenarios"]["scenario_3_mixed_timeline"] = scenario3_results
        
        # Scenario 4: Stealth Slow Attack
        print("\n" + "─"*70)
        print("SCENARIO 4: STEALTH SLOW ATTACK (Sparse Detection)")
        print("─"*70)
        scenario4_results = self.scenario_4_stealth_slow()
        self.results["scenarios"]["scenario_4_stealth_slow"] = scenario4_results
        
        # Save results
        self._save_results()
        
        print("\n" + "="*70)
        print("✅ PHASE 2 EVALUATION COMPLETE")
        print("="*70)
        print(f"\n📁 Results saved to: {self.output_dir}")
        
        return self.results
    
    def scenario_1_all_benign(self, num_flows: int = 10000) -> Dict:
        """
        Scenario 1: Pure benign traffic
        Expected: Zero or near-zero alerts (tests False Positive rate)
        """
        print(f"\n📋 Creating benign-only sequence ({num_flows} flows)...")
        
        # Select only benign flows
        benign_mask = self.y_test == 'BENIGN'
        benign_X = self.X_test[benign_mask].head(num_flows)
        benign_y = self.y_test[benign_mask].head(num_flows)
        
        actual_flows = len(benign_X)
        print(f"   ✓ Selected {actual_flows:,} benign flows")
        
        # Make predictions
        print("\n🔍 Running predictions...")
        start_time = time.time()
        predictions = self.model.predict(benign_X)
        pred_proba = self.model.predict_proba(benign_X)
        elapsed = time.time() - start_time
        
        pred_labels = [self.classes[int(p)] for p in predictions]
        confidences = [max(probs) for probs in pred_proba]
        
        # Count false positives (benign flows classified as attack)
        false_positives = sum([1 for pred in pred_labels if pred != 'BENIGN'])
        fp_rate = (false_positives / actual_flows) * 100
        fp_per_10k = (false_positives / actual_flows) * 10000
        
        print(f"\n📊 Results:")
        print(f"   Total Flows Tested: {actual_flows:,}")
        print(f"   False Positives: {false_positives:,}")
        print(f"   FP Rate: {fp_rate:.4f}%")
        print(f"   FP per 10,000 flows: {fp_per_10k:.2f}")
        print(f"   Processing Time: {elapsed:.2f}s")
        print(f"   Throughput: {actual_flows/elapsed:.0f} flows/sec")
        
        # Expected: < 0.1% FP rate for stable system
        if fp_rate < 0.1:
            verdict = "✅ EXCELLENT - Very stable, minimal false alarms"
        elif fp_rate < 1.0:
            verdict = "✅ GOOD - Acceptable false positive rate"
        elif fp_rate < 5.0:
            verdict = "⚠️ MODERATE - Some false alarms, may need tuning"
        else:
            verdict = "❌ POOR - Too many false alarms, requires adjustment"
        
        print(f"\n🎯 Verdict: {verdict}")
        
        return {
            "description": "Pure benign traffic - stability test",
            "total_flows": actual_flows,
            "false_positives": false_positives,
            "fp_rate_percent": float(fp_rate),
            "fp_per_10k_flows": float(fp_per_10k),
            "processing_time_sec": elapsed,
            "throughput_flows_per_sec": actual_flows/elapsed,
            "verdict": verdict
        }
    
    def scenario_2_pure_attack(self, num_flows: int = 5000) -> Dict:
        """
        Scenario 2: Pure attack traffic
        Expected: High detection rate (tests sensitivity)
        """
        print(f"\n📋 Creating attack-only sequence ({num_flows} flows)...")
        
        # Select only attack flows
        attack_mask = self.y_test != 'BENIGN'
        attack_X = self.X_test[attack_mask].head(num_flows)
        attack_y = self.y_test[attack_mask].head(num_flows)
        
        actual_flows = len(attack_X)
        print(f"   ✓ Selected {actual_flows:,} attack flows")
        
        # Make predictions
        print("\n🔍 Running predictions...")
        start_time = time.time()
        predictions = self.model.predict(attack_X)
        pred_proba = self.model.predict_proba(attack_X)
        elapsed = time.time() - start_time
        
        pred_labels = [self.classes[int(p)] for p in predictions]
        confidences = [max(probs) for probs in pred_proba]
        
        # Count detections
        detected = sum([1 for pred in pred_labels if pred != 'BENIGN'])
        missed = actual_flows - detected
        detection_rate = (detected / actual_flows) * 100
        
        print(f"\n📊 Results:")
        print(f"   Total Attack Flows: {actual_flows:,}")
        print(f"   Detected: {detected:,}")
        print(f"   Missed (False Negatives): {missed:,}")
        print(f"   Detection Rate: {detection_rate:.2f}%")
        print(f"   Average Confidence: {np.mean(confidences):.4f}")
        print(f"   Processing Time: {elapsed:.2f}s")
        
        # Expected: > 95% detection rate
        if detection_rate >= 99.0:
            verdict = "✅ EXCELLENT - Near-perfect attack detection"
        elif detection_rate >= 95.0:
            verdict = "✅ GOOD - High detection rate"
        elif detection_rate >= 90.0:
            verdict = "⚠️ MODERATE - Some attacks missed"
        else:
            verdict = "❌ POOR - Too many missed attacks"
        
        print(f"\n🎯 Verdict: {verdict}")
        
        return {
            "description": "Pure attack traffic - sensitivity test",
            "total_flows": actual_flows,
            "detected": detected,
            "missed": missed,
            "detection_rate_percent": float(detection_rate),
            "avg_confidence": float(np.mean(confidences)),
            "processing_time_sec": elapsed,
            "verdict": verdict
        }
    
    def scenario_3_mixed_timeline(self, benign_before: int = 3000, attack_burst: int = 300, 
                                    benign_after: int = 1500) -> Dict:
        """
        Scenario 3: Realistic timeline - benign → attack burst → benign
        Expected: Quick detection when attack starts, no FP before/after
        """
        print(f"\n📋 Creating mixed timeline:")
        print(f"   - {benign_before} benign flows (normal baseline)")
        print(f"   - {attack_burst} attack flows (sudden burst)")
        print(f"   - {benign_after} benign flows (post-attack stabilization)")
        
        # Build sequence
        benign_mask = self.y_test == 'BENIGN'
        attack_mask = self.y_test != 'BENIGN'
        
        # Phase 1: Benign baseline
        phase1_X = self.X_test[benign_mask].iloc[:benign_before]
        phase1_y = self.y_test[benign_mask].iloc[:benign_before]
        
        # Phase 2: Attack burst
        phase2_X = self.X_test[attack_mask].iloc[:attack_burst]
        phase2_y = self.y_test[attack_mask].iloc[:attack_burst]
        
        # Phase 3: Post-attack benign
        phase3_X = self.X_test[benign_mask].iloc[benign_before:benign_before+benign_after]
        phase3_y = self.y_test[benign_mask].iloc[benign_before:benign_before+benign_after]
        
        # Combine
        sequence_X = pd.concat([phase1_X, phase2_X, phase3_X], ignore_index=True)
        sequence_y = pd.concat([phase1_y, phase2_y, phase3_y], ignore_index=True)
        
        total_flows = len(sequence_X)
        print(f"   ✓ Created sequence of {total_flows:,} flows")
        
        # Make predictions
        print("\n🔍 Running predictions...")
        start_time = time.time()
        predictions = self.model.predict(sequence_X)
        pred_proba = self.model.predict_proba(sequence_X)
        elapsed = time.time() - start_time
        
        pred_labels = [self.classes[int(p)] for p in predictions]
        
        # Analyze detection timing
        attack_start_idx = benign_before
        attack_end_idx = benign_before + attack_burst
        
        # Find first detection in attack phase
        first_detection_idx = None
        for i in range(attack_start_idx, attack_end_idx):
            if pred_labels[i] != 'BENIGN':
                first_detection_idx = i
                break
        
        detection_delay = (first_detection_idx - attack_start_idx) if first_detection_idx else attack_burst
        
        # Count alerts in each phase
        phase1_alerts = sum([1 for i in range(benign_before) if pred_labels[i] != 'BENIGN'])
        phase2_alerts = sum([1 for i in range(attack_start_idx, attack_end_idx) if pred_labels[i] != 'BENIGN'])
        phase3_alerts = sum([1 for i in range(attack_end_idx, total_flows) if pred_labels[i] != 'BENIGN'])
        
        phase2_detection_rate = (phase2_alerts / attack_burst) * 100
        
        print(f"\n📊 Results:")
        print(f"   Phase 1 (Benign Baseline):")
        print(f"      False Positives: {phase1_alerts}")
        print(f"   Phase 2 (Attack Burst):")
        print(f"      Detection Rate: {phase2_detection_rate:.2f}%")
        print(f"      First Detection at Flow: {first_detection_idx if first_detection_idx else 'N/A'}")
        print(f"      Detection Delay: {detection_delay} flows")
        print(f"   Phase 3 (Post-Attack Benign):")
        print(f"      False Positives: {phase3_alerts}")
        print(f"   Total Processing Time: {elapsed:.2f}s")
        
        # Plot timeline
        self._plot_mixed_timeline(pred_labels, attack_start_idx, attack_end_idx, "scenario3")
        
        # Verdict
        if phase2_detection_rate >= 95 and phase1_alerts < 10 and phase3_alerts < 10:
            verdict = "✅ EXCELLENT - Fast detection, minimal FP"
        elif phase2_detection_rate >= 90 and phase1_alerts < 50:
            verdict = "✅ GOOD - Acceptable performance"
        elif phase2_detection_rate >= 80:
            verdict = "⚠️ MODERATE - Some issues with detection or FP"
        else:
            verdict = "❌ POOR - Significant detection problems"
        
        print(f"\n🎯 Verdict: {verdict}")
        
        return {
            "description": "Mixed timeline - benign → attack → benign",
            "total_flows": total_flows,
            "phase1_benign_flows": benign_before,
            "phase1_false_positives": phase1_alerts,
            "phase2_attack_flows": attack_burst,
            "phase2_detection_rate_percent": float(phase2_detection_rate),
            "phase2_detection_delay_flows": detection_delay,
            "phase3_benign_flows": benign_after,
            "phase3_false_positives": phase3_alerts,
            "processing_time_sec": elapsed,
            "verdict": verdict
        }
    
    def scenario_4_stealth_slow(self, total_flows: int = 5000, attack_spacing: int = 50) -> Dict:
        """
        Scenario 4: Stealth slow attack - sparse attacks mixed with benign
        Pattern: Benign — Attack — Benign — Benign — ... — Attack — ...
        Expected: Tests minimum attack frequency detectable
        """
        print(f"\n📋 Creating stealth slow attack sequence:")
        print(f"   - Total flows: {total_flows}")
        print(f"   - Attack spacing: 1 attack every {attack_spacing} flows")
        
        benign_mask = self.y_test == 'BENIGN'
        attack_mask = self.y_test != 'BENIGN'
        
        benign_pool = self.X_test[benign_mask]
        attack_pool = self.X_test[attack_mask]
        
        # Build sparse sequence
        sequence_X = []
        sequence_y_true = []
        
        benign_idx = 0
        attack_idx = 0
        
        for i in range(total_flows):
            if i % attack_spacing == 0 and attack_idx < len(attack_pool):
                # Insert attack flow
                sequence_X.append(attack_pool.iloc[attack_idx])
                sequence_y_true.append('ATTACK')
                attack_idx += 1
            else:
                # Insert benign flow
                if benign_idx < len(benign_pool):
                    sequence_X.append(benign_pool.iloc[benign_idx])
                    sequence_y_true.append('BENIGN')
                    benign_idx += 1
        
        sequence_X = pd.DataFrame(sequence_X).reset_index(drop=True)
        actual_attack_count = attack_idx
        
        print(f"   ✓ Created sequence with {actual_attack_count} sparse attacks")
        
        # Make predictions
        print("\n🔍 Running predictions...")
        start_time = time.time()
        predictions = self.model.predict(sequence_X)
        elapsed = time.time() - start_time
        
        pred_labels = [self.classes[int(p)] for p in predictions]
        
        # Count detections
        detected_attacks = 0
        for i, true_label in enumerate(sequence_y_true):
            if true_label == 'ATTACK' and pred_labels[i] != 'BENIGN':
                detected_attacks += 1
        
        detection_rate = (detected_attacks / actual_attack_count) * 100 if actual_attack_count > 0 else 0
        
        print(f"\n📊 Results:")
        print(f"   Total Flows: {len(sequence_X):,}")
        print(f"   Sparse Attacks: {actual_attack_count}")
        print(f"   Attack Spacing: 1 per {attack_spacing} flows")
        print(f"   Detected: {detected_attacks}")
        print(f"   Detection Rate: {detection_rate:.2f}%")
        print(f"   Processing Time: {elapsed:.2f}s")
        
        # Verdict - stealth attacks are harder to detect
        if detection_rate >= 80:
            verdict = "✅ EXCELLENT - Can detect sparse attacks"
        elif detection_rate >= 60:
            verdict = "✅ GOOD - Decent detection of slow attacks"
        elif detection_rate >= 40:
            verdict = "⚠️ MODERATE - Struggles with stealth attacks"
        else:
            verdict = "❌ POOR - Cannot detect slow/sparse attacks"
        
        print(f"\n🎯 Verdict: {verdict}")
        
        return {
            "description": "Stealth slow attack - sparse attacks",
            "total_flows": len(sequence_X),
            "attack_count": actual_attack_count,
            "attack_spacing": attack_spacing,
            "detected": detected_attacks,
            "detection_rate_percent": float(detection_rate),
            "processing_time_sec": elapsed,
            "verdict": verdict
        }
    
    def _plot_mixed_timeline(self, predictions: List[str], attack_start: int, attack_end: int, scenario_name: str):
        """Plot timeline showing when alerts occurred"""
        # Create binary alert timeline (0 = benign, 1 = alert)
        alert_timeline = [0 if pred == 'BENIGN' else 1 for pred in predictions]
        
        plt.figure(figsize=(14, 6))
        
        # Plot alert timeline
        plt.subplot(2, 1, 1)
        plt.plot(alert_timeline, 'r-', linewidth=0.5, alpha=0.7)
        plt.axvspan(attack_start, attack_end, color='red', alpha=0.1, label='Actual Attack Period')
        plt.xlabel('Flow Index')
        plt.ylabel('Alert (1) / Benign (0)')
        plt.title('Alert Timeline - Scenario 3: Mixed Timeline')
        plt.legend()
        plt.grid(alpha=0.3)
        
        # Plot cumulative alerts
        plt.subplot(2, 1, 2)
        cumulative_alerts = np.cumsum(alert_timeline)
        plt.plot(cumulative_alerts, 'b-', linewidth=2)
        plt.axvspan(attack_start, attack_end, color='red', alpha=0.1, label='Actual Attack Period')
        plt.xlabel('Flow Index')
        plt.ylabel('Cumulative Alerts')
        plt.title('Cumulative Alert Count')
        plt.legend()
        plt.grid(alpha=0.3)
        
        plt.tight_layout()
        timeline_path = self.output_dir / f"{scenario_name}_timeline.png"
        plt.savefig(timeline_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"   ✓ Timeline plot saved to {timeline_path}")
    
    def _save_results(self):
        """Save results to JSON and text report"""
        # Save JSON
        results_path = self.output_dir / "phase2_results.json"
        with open(results_path, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        # Save text report
        report_path = self.output_dir / "phase2_report.txt"
        with open(report_path, 'w') as f:
            f.write("="*70 + "\n")
            f.write("AEGIS ITERATION-2 - PHASE 2: SCENARIO-BASED EVALUATION REPORT\n")
            f.write("="*70 + "\n\n")
            f.write(f"Timestamp: {self.results['timestamp']}\n")
            f.write(f"Model: {self.results['model_path']}\n")
            f.write(f"Test Dataset: {self.results['test_dataset']}\n\n")
            
            for scenario_name, scenario_data in self.results["scenarios"].items():
                f.write("-"*70 + "\n")
                f.write(f"{scenario_name.upper().replace('_', ' ')}\n")
                f.write("-"*70 + "\n")
                f.write(f"Description: {scenario_data['description']}\n")
                for key, value in scenario_data.items():
                    if key not in ['description']:
                        f.write(f"{key}: {value}\n")
                f.write("\n")
        
        print(f"\n   ✓ Results saved to {results_path}")
        print(f"   ✓ Report saved to {report_path}")


def main():
    """Run Phase 2 evaluation"""
    import argparse
    
    parser = argparse.ArgumentParser(description="AEGIS Phase 2: Scenario-Based Evaluation")
    parser.add_argument("--model", type=str, required=True, help="Path to trained model")
    parser.add_argument("--test-data", type=str, required=True, help="Path to test dataset")
    parser.add_argument("--output", type=str, default="evaluation/results/phase2", help="Output directory")
    
    args = parser.parse_args()
    
    evaluator = Phase2ScenarioEvaluator(
        model_path=args.model,
        test_data_path=args.test_data,
        output_dir=args.output
    )
    
    results = evaluator.run_all_scenarios()
    
    print("\n✅ Phase 2 evaluation complete!")
    print(f"📊 Results saved to: {args.output}")


if __name__ == "__main__":
    main()
