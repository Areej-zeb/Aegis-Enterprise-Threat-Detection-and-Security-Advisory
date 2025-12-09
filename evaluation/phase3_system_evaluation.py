#!/usr/bin/env python3
"""
AEGIS ITERATION-2 - PHASE 3: SYSTEM-LEVEL EVALUATION

Tests the entire AEGIS platform end-to-end:
- Backend API inference
- Batch processing
- Alert generation
- Dashboard integration
- System stability & performance

Flow Structure: Batches of flows sent via POST /predict
Expected Output: API response time, alert generation, system stability
"""

import json
import time
import requests
from pathlib import Path
from typing import Dict, List
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime

class Phase3SystemEvaluator:
    """System-level evaluation with backend API"""
    
    def __init__(self, test_data_path: str, api_base_url: str = "http://127.0.0.1:8000", 
                 output_dir: str = "evaluation/results/phase3"):
        """
        Args:
            test_data_path: Path to test dataset
            api_base_url: Backend API URL
            output_dir: Where to save results
        """
        self.test_data_path = Path(test_data_path)
        self.api_base_url = api_base_url.rstrip('/')
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Load test data
        print(f"📊 Loading test dataset from {self.test_data_path}")
        df_test = pd.read_parquet(self.test_data_path)
        self.X_test = df_test.drop('label', axis=1)
        self.y_test = df_test['label']
        
        print(f"✅ Loaded {len(self.X_test):,} test samples\n")
        
        # Check backend health
        self._check_backend_health()
        
        # Results storage
        self.results = {}
    
    def _check_backend_health(self):
        """Verify backend is running"""
        try:
            response = requests.get(f"{self.api_base_url}/api/health", timeout=5)
            if response.status_code == 200:
                health = response.json()
                print(f"✅ Backend is healthy")
                print(f"   Status: {health.get('status')}")
                print(f"   Mode: {health.get('mode')}")
                return True
        except requests.exceptions.RequestException as e:
            print(f"❌ Backend is not responding: {e}")
            print(f"   Please start the backend first: python -m backend.ids.serve.app")
            raise RuntimeError("Backend not available")
    
    def run_all_tests(self) -> Dict:
        """Run all system-level tests"""
        print("="*70)
        print("PHASE 3: SYSTEM-LEVEL EVALUATION")
        print("="*70)
        
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "api_base_url": self.api_base_url,
            "test_dataset": str(self.test_data_path),
            "tests": {}
        }
        
        # Test 1: Benign batch processing
        print("\n" + "─"*70)
        print("TEST 1: BENIGN BATCH PROCESSING")
        print("─"*70)
        test1_results = self.test_benign_batch()
        self.results["tests"]["test_1_benign_batch"] = test1_results
        
        # Test 2: Attack batch processing
        print("\n" + "─"*70)
        print("TEST 2: ATTACK BATCH PROCESSING")
        print("─"*70)
        test2_results = self.test_attack_batch()
        self.results["tests"]["test_2_attack_batch"] = test2_results
        
        # Test 3: Mixed batch processing
        print("\n" + "─"*70)
        print("TEST 3: MIXED BATCH PROCESSING")
        print("─"*70)
        test3_results = self.test_mixed_batch()
        self.results["tests"]["test_3_mixed_batch"] = test3_results
        
        # Test 4: Performance & scalability
        print("\n" + "─"*70)
        print("TEST 4: PERFORMANCE & SCALABILITY")
        print("─"*70)
        test4_results = self.test_performance()
        self.results["tests"]["test_4_performance"] = test4_results
        
        # Test 5: Alert generation
        print("\n" + "─"*70)
        print("TEST 5: ALERT GENERATION & DASHBOARD")
        print("─"*70)
        test5_results = self.test_alert_generation()
        self.results["tests"]["test_5_alert_generation"] = test5_results
        
        # Save results
        self._save_results()
        
        print("\n" + "="*70)
        print("✅ PHASE 3 EVALUATION COMPLETE")
        print("="*70)
        print(f"\n📁 Results saved to: {self.output_dir}")
        
        return self.results
    
    def test_benign_batch(self, batch_size: int = 1000) -> Dict:
        """Test 1: Process batch of benign traffic"""
        print(f"\n📋 Processing benign-only batch ({batch_size} flows)...")
        
        # Select benign flows
        benign_mask = self.y_test == 'BENIGN'
        benign_batch = self.X_test[benign_mask].head(batch_size)
        
        # Prepare batch for API
        batch_data = benign_batch.to_dict('records')
        
        # Send to API
        print("\n🌐 Sending POST request to /api/predict...")
        try:
            start_time = time.time()
            response = requests.post(
                f"{self.api_base_url}/api/predict",
                json={"flows": batch_data},
                timeout=30
            )
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                predictions = result.get('predictions', [])
                
                # Count alerts
                attack_count = sum([1 for p in predictions if p.get('label') != 'BENIGN'])
                
                print(f"\n📊 Results:")
                print(f"   Batch Size: {batch_size}")
                print(f"   Response Time: {elapsed:.3f}s")
                print(f"   Throughput: {batch_size/elapsed:.0f} flows/sec")
                print(f"   Predictions Received: {len(predictions)}")
                print(f"   Alerts Generated: {attack_count}")
                print(f"   False Positive Rate: {(attack_count/batch_size)*100:.4f}%")
                
                # Verdict
                fp_rate = (attack_count / batch_size) * 100
                if fp_rate < 0.1:
                    verdict = "✅ EXCELLENT - Minimal false alarms"
                elif fp_rate < 1.0:
                    verdict = "✅ GOOD - Acceptable FP rate"
                else:
                    verdict = "⚠️ HIGH FALSE POSITIVE RATE"
                
                print(f"\n🎯 Verdict: {verdict}")
                
                return {
                    "description": "Benign batch processing",
                    "batch_size": batch_size,
                    "response_time_sec": elapsed,
                    "throughput_flows_per_sec": batch_size/elapsed,
                    "alerts_generated": attack_count,
                    "false_positive_rate_percent": float(fp_rate),
                    "verdict": verdict,
                    "status": "success"
                }
            else:
                print(f"❌ API Error: {response.status_code}")
                return {"status": "error", "error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return {"status": "error", "error": str(e)}
    
    def test_attack_batch(self, batch_size: int = 500) -> Dict:
        """Test 2: Process batch of attack traffic"""
        print(f"\n📋 Processing attack-only batch ({batch_size} flows)...")
        
        # Select attack flows
        attack_mask = self.y_test != 'BENIGN'
        attack_batch = self.X_test[attack_mask].head(batch_size)
        
        # Prepare batch for API
        batch_data = attack_batch.to_dict('records')
        
        # Send to API
        print("\n🌐 Sending POST request to /api/predict...")
        try:
            start_time = time.time()
            response = requests.post(
                f"{self.api_base_url}/api/predict",
                json={"flows": batch_data},
                timeout=30
            )
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                predictions = result.get('predictions', [])
                
                # Count detections
                detected = sum([1 for p in predictions if p.get('label') != 'BENIGN'])
                detection_rate = (detected / batch_size) * 100
                
                print(f"\n📊 Results:")
                print(f"   Batch Size: {batch_size}")
                print(f"   Response Time: {elapsed:.3f}s")
                print(f"   Throughput: {batch_size/elapsed:.0f} flows/sec")
                print(f"   Predictions Received: {len(predictions)}")
                print(f"   Attacks Detected: {detected}")
                print(f"   Detection Rate: {detection_rate:.2f}%")
                
                # Verdict
                if detection_rate >= 95:
                    verdict = "✅ EXCELLENT - High detection rate"
                elif detection_rate >= 90:
                    verdict = "✅ GOOD - Acceptable detection"
                else:
                    verdict = "⚠️ LOW DETECTION RATE"
                
                print(f"\n🎯 Verdict: {verdict}")
                
                return {
                    "description": "Attack batch processing",
                    "batch_size": batch_size,
                    "response_time_sec": elapsed,
                    "throughput_flows_per_sec": batch_size/elapsed,
                    "attacks_detected": detected,
                    "detection_rate_percent": float(detection_rate),
                    "verdict": verdict,
                    "status": "success"
                }
            else:
                print(f"❌ API Error: {response.status_code}")
                return {"status": "error", "error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return {"status": "error", "error": str(e)}
    
    def test_mixed_batch(self, batch_size: int = 1000, attack_ratio: float = 0.2) -> Dict:
        """Test 3: Process mixed batch (benign + attack)"""
        attack_count = int(batch_size * attack_ratio)
        benign_count = batch_size - attack_count
        
        print(f"\n📋 Processing mixed batch:")
        print(f"   Total: {batch_size} flows")
        print(f"   Benign: {benign_count} ({(1-attack_ratio)*100:.0f}%)")
        print(f"   Attack: {attack_count} ({attack_ratio*100:.0f}%)")
        
        # Select flows
        benign_mask = self.y_test == 'BENIGN'
        attack_mask = self.y_test != 'BENIGN'
        
        benign_batch = self.X_test[benign_mask].head(benign_count)
        attack_batch = self.X_test[attack_mask].head(attack_count)
        
        # Combine and shuffle
        mixed_batch = pd.concat([benign_batch, attack_batch], ignore_index=True)
        mixed_batch = mixed_batch.sample(frac=1, random_state=42).reset_index(drop=True)
        
        # Prepare batch for API
        batch_data = mixed_batch.to_dict('records')
        
        # Send to API
        print("\n🌐 Sending POST request to /api/predict...")
        try:
            start_time = time.time()
            response = requests.post(
                f"{self.api_base_url}/api/predict",
                json={"flows": batch_data},
                timeout=30
            )
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                predictions = result.get('predictions', [])
                
                # Count alerts
                alerts = sum([1 for p in predictions if p.get('label') != 'BENIGN'])
                
                print(f"\n📊 Results:")
                print(f"   Batch Size: {batch_size}")
                print(f"   Response Time: {elapsed:.3f}s")
                print(f"   Throughput: {batch_size/elapsed:.0f} flows/sec")
                print(f"   Predictions Received: {len(predictions)}")
                print(f"   Alerts Generated: {alerts}")
                print(f"   Expected Alerts: ~{attack_count} (attack ratio)")
                
                alert_accuracy = (alerts / attack_count) * 100 if attack_count > 0 else 0
                print(f"   Alert Accuracy: {alert_accuracy:.2f}%")
                
                # Verdict
                if 90 <= alert_accuracy <= 110:
                    verdict = "✅ EXCELLENT - Accurate alert generation"
                elif 80 <= alert_accuracy <= 120:
                    verdict = "✅ GOOD - Reasonable accuracy"
                else:
                    verdict = "⚠️ ALERT ACCURACY ISSUE"
                
                print(f"\n🎯 Verdict: {verdict}")
                
                return {
                    "description": "Mixed batch processing",
                    "batch_size": batch_size,
                    "benign_count": benign_count,
                    "attack_count": attack_count,
                    "response_time_sec": elapsed,
                    "throughput_flows_per_sec": batch_size/elapsed,
                    "alerts_generated": alerts,
                    "alert_accuracy_percent": float(alert_accuracy),
                    "verdict": verdict,
                    "status": "success"
                }
            else:
                print(f"❌ API Error: {response.status_code}")
                return {"status": "error", "error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return {"status": "error", "error": str(e)}
    
    def test_performance(self) -> Dict:
        """Test 4: Performance & scalability across different batch sizes"""
        print(f"\n📋 Testing performance across batch sizes...")
        
        batch_sizes = [100, 500, 1000, 2000, 5000]
        results = []
        
        for batch_size in batch_sizes:
            print(f"\n   Testing batch size: {batch_size}")
            
            # Select random flows
            sample_batch = self.X_test.sample(n=min(batch_size, len(self.X_test)), random_state=42)
            batch_data = sample_batch.to_dict('records')
            
            try:
                start_time = time.time()
                response = requests.post(
                    f"{self.api_base_url}/api/predict",
                    json={"flows": batch_data},
                    timeout=60
                )
                elapsed = time.time() - start_time
                
                if response.status_code == 200:
                    throughput = batch_size / elapsed
                    avg_time_per_flow = (elapsed / batch_size) * 1000  # ms
                    
                    print(f"      ✓ Response time: {elapsed:.3f}s")
                    print(f"      ✓ Throughput: {throughput:.0f} flows/sec")
                    print(f"      ✓ Avg per flow: {avg_time_per_flow:.2f}ms")
                    
                    results.append({
                        "batch_size": batch_size,
                        "response_time_sec": elapsed,
                        "throughput_flows_per_sec": throughput,
                        "avg_time_per_flow_ms": avg_time_per_flow
                    })
                else:
                    print(f"      ❌ Failed: HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"      ❌ Error: {e}")
        
        # Plot performance
        if results:
            self._plot_performance(results)
            
            # Calculate averages
            avg_throughput = np.mean([r['throughput_flows_per_sec'] for r in results])
            
            print(f"\n📊 Performance Summary:")
            print(f"   Average Throughput: {avg_throughput:.0f} flows/sec")
            print(f"   Tested Batch Sizes: {batch_sizes}")
            
            # Verdict
            if avg_throughput >= 1000:
                verdict = "✅ EXCELLENT - High throughput"
            elif avg_throughput >= 500:
                verdict = "✅ GOOD - Acceptable performance"
            else:
                verdict = "⚠️ PERFORMANCE ISSUE"
            
            print(f"\n🎯 Verdict: {verdict}")
            
            return {
                "description": "Performance & scalability test",
                "batch_sizes_tested": batch_sizes,
                "results": results,
                "avg_throughput_flows_per_sec": float(avg_throughput),
                "verdict": verdict
            }
        else:
            return {"status": "error", "error": "No successful tests"}
    
    def test_alert_generation(self) -> Dict:
        """Test 5: Verify alert generation and dashboard integration"""
        print(f"\n📋 Testing alert generation system...")
        
        # Send attack flows to trigger alerts
        attack_mask = self.y_test != 'BENIGN'
        attack_batch = self.X_test[attack_mask].head(50)
        batch_data = attack_batch.to_dict('records')
        
        try:
            # Send prediction request
            print("\n   1. Sending attack batch to trigger alerts...")
            response = requests.post(
                f"{self.api_base_url}/api/predict",
                json={"flows": batch_data},
                timeout=30
            )
            
            if response.status_code != 200:
                return {"status": "error", "error": f"Prediction failed: HTTP {response.status_code}"}
            
            # Wait a moment for alerts to be generated
            time.sleep(1)
            
            # Fetch alerts
            print("   2. Fetching generated alerts...")
            alerts_response = requests.get(f"{self.api_base_url}/api/alerts", timeout=5)
            
            if alerts_response.status_code == 200:
                alerts = alerts_response.json()
                alert_count = len(alerts) if isinstance(alerts, list) else 0
                
                print(f"\n📊 Results:")
                print(f"   Attack Flows Sent: 50")
                print(f"   Alerts Generated: {alert_count}")
                print(f"   Alert System: {'✅ Working' if alert_count > 0 else '⚠️ No alerts'}")
                
                # Check alert structure
                if alert_count > 0 and isinstance(alerts, list):
                    sample_alert = alerts[0]
                    required_fields = ['timestamp', 'label', 'score', 'severity']
                    has_required = all(field in sample_alert for field in required_fields)
                    
                    print(f"   Alert Structure: {'✅ Valid' if has_required else '⚠️ Missing fields'}")
                    
                    if has_required:
                        verdict = "✅ EXCELLENT - Alert generation working"
                    else:
                        verdict = "⚠️ ALERT STRUCTURE INCOMPLETE"
                else:
                    verdict = "⚠️ NO ALERTS GENERATED"
                
                print(f"\n🎯 Verdict: {verdict}")
                
                return {
                    "description": "Alert generation & dashboard integration",
                    "attack_flows_sent": 50,
                    "alerts_generated": alert_count,
                    "alert_system_working": alert_count > 0,
                    "verdict": verdict,
                    "status": "success"
                }
            else:
                return {"status": "error", "error": f"Failed to fetch alerts: HTTP {alerts_response.status_code}"}
                
        except Exception as e:
            print(f"❌ Test failed: {e}")
            return {"status": "error", "error": str(e)}
    
    def _plot_performance(self, results: List[Dict]):
        """Plot performance metrics"""
        batch_sizes = [r['batch_size'] for r in results]
        throughputs = [r['throughput_flows_per_sec'] for r in results]
        response_times = [r['response_time_sec'] for r in results]
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
        
        # Throughput vs batch size
        ax1.plot(batch_sizes, throughputs, 'bo-', linewidth=2, markersize=8)
        ax1.set_xlabel('Batch Size (flows)')
        ax1.set_ylabel('Throughput (flows/sec)')
        ax1.set_title('System Throughput vs Batch Size')
        ax1.grid(alpha=0.3)
        
        # Response time vs batch size
        ax2.plot(batch_sizes, response_times, 'ro-', linewidth=2, markersize=8)
        ax2.set_xlabel('Batch Size (flows)')
        ax2.set_ylabel('Response Time (seconds)')
        ax2.set_title('API Response Time vs Batch Size')
        ax2.grid(alpha=0.3)
        
        plt.tight_layout()
        perf_path = self.output_dir / "performance_analysis.png"
        plt.savefig(perf_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"\n   ✓ Performance plots saved to {perf_path}")
    
    def _save_results(self):
        """Save results to JSON and text report"""
        # Save JSON
        results_path = self.output_dir / "phase3_results.json"
        with open(results_path, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        # Save text report
        report_path = self.output_dir / "phase3_report.txt"
        with open(report_path, 'w') as f:
            f.write("="*70 + "\n")
            f.write("AEGIS ITERATION-2 - PHASE 3: SYSTEM-LEVEL EVALUATION REPORT\n")
            f.write("="*70 + "\n\n")
            f.write(f"Timestamp: {self.results['timestamp']}\n")
            f.write(f"API Base URL: {self.results['api_base_url']}\n")
            f.write(f"Test Dataset: {self.results['test_dataset']}\n\n")
            
            for test_name, test_data in self.results["tests"].items():
                f.write("-"*70 + "\n")
                f.write(f"{test_name.upper().replace('_', ' ')}\n")
                f.write("-"*70 + "\n")
                if 'description' in test_data:
                    f.write(f"Description: {test_data['description']}\n")
                for key, value in test_data.items():
                    if key not in ['description', 'results']:
                        f.write(f"{key}: {value}\n")
                f.write("\n")
        
        print(f"\n   ✓ Results saved to {results_path}")
        print(f"   ✓ Report saved to {report_path}")


def main():
    """Run Phase 3 evaluation"""
    import argparse
    
    parser = argparse.ArgumentParser(description="AEGIS Phase 3: System-Level Evaluation")
    parser.add_argument("--test-data", type=str, required=True, help="Path to test dataset")
    parser.add_argument("--api-url", type=str, default="http://127.0.0.1:8000", help="Backend API URL")
    parser.add_argument("--output", type=str, default="evaluation/results/phase3", help="Output directory")
    
    args = parser.parse_args()
    
    evaluator = Phase3SystemEvaluator(
        test_data_path=args.test_data,
        api_base_url=args.api_url,
        output_dir=args.output
    )
    
    results = evaluator.run_all_tests()
    
    print("\n✅ Phase 3 evaluation complete!")
    print(f"📊 Results saved to: {args.output}")


if __name__ == "__main__":
    main()
