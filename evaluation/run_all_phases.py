#!/usr/bin/env python3
"""
AEGIS ITERATION-2 - COMPLETE 3-PHASE EVALUATION RUNNER

Runs all three evaluation phases sequentially:
- Phase 1: Dataset-Level Evaluation (ML metrics)
- Phase 2: Scenario-Based Evaluation (Timeline simulation)
- Phase 3: System-Level Evaluation (Backend API testing)

Usage:
    # Run all phases
    python evaluation/run_all_phases.py --model artifacts/Syn/xgb_baseline.joblib --test-data datasets/processed/Syn/test.parquet
    
    # Run specific phase
    python evaluation/run_all_phases.py --model artifacts/Syn/xgb_baseline.joblib --test-data datasets/processed/Syn/test.parquet --phase 1
"""

import argparse
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from evaluation.phase1_dataset_evaluation import Phase1DatasetEvaluator
from evaluation.phase2_scenario_evaluation import Phase2ScenarioEvaluator
from evaluation.phase3_system_evaluation import Phase3SystemEvaluator


def run_phase_1(model_path: str, test_data_path: str, output_dir: str):
    """Run Phase 1: Dataset-Level Evaluation"""
    print("\n" + "="*70)
    print("🔷 STARTING PHASE 1: DATASET-LEVEL EVALUATION")
    print("="*70)
    
    evaluator = Phase1DatasetEvaluator(
        model_path=model_path,
        test_data_path=test_data_path,
        output_dir=output_dir
    )
    
    results = evaluator.evaluate_full_dataset()
    
    print("\n✅ Phase 1 complete!")
    return results


def run_phase_2(model_path: str, test_data_path: str, output_dir: str):
    """Run Phase 2: Scenario-Based Evaluation"""
    print("\n" + "="*70)
    print("🔷 STARTING PHASE 2: SCENARIO-BASED EVALUATION")
    print("="*70)
    
    evaluator = Phase2ScenarioEvaluator(
        model_path=model_path,
        test_data_path=test_data_path,
        output_dir=output_dir
    )
    
    results = evaluator.run_all_scenarios()
    
    print("\n✅ Phase 2 complete!")
    return results


def run_phase_3(test_data_path: str, api_url: str, output_dir: str):
    """Run Phase 3: System-Level Evaluation"""
    print("\n" + "="*70)
    print("🔷 STARTING PHASE 3: SYSTEM-LEVEL EVALUATION")
    print("="*70)
    print("\n⚠️  IMPORTANT: Make sure the backend is running!")
    print("   Start backend with: python -m backend.ids.serve.app\n")
    
    input("Press Enter when backend is ready, or Ctrl+C to skip Phase 3...")
    
    evaluator = Phase3SystemEvaluator(
        test_data_path=test_data_path,
        api_base_url=api_url,
        output_dir=output_dir
    )
    
    results = evaluator.run_all_tests()
    
    print("\n✅ Phase 3 complete!")
    return results


def main():
    parser = argparse.ArgumentParser(
        description="AEGIS Iteration-2: Complete 3-Phase Evaluation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run all phases
  python evaluation/run_all_phases.py --model artifacts/Syn/xgb_baseline.joblib --test-data datasets/processed/Syn/test.parquet
  
  # Run only Phase 1 and 2
  python evaluation/run_all_phases.py --model artifacts/Syn/xgb_baseline.joblib --test-data datasets/processed/Syn/test.parquet --phase 1 --phase 2
  
  # Specify custom API URL for Phase 3
  python evaluation/run_all_phases.py --model artifacts/Syn/xgb_baseline.joblib --test-data datasets/processed/Syn/test.parquet --api-url http://192.168.1.100:8000
        """
    )
    
    parser.add_argument("--model", type=str, required=True, help="Path to trained model (required for Phase 1 & 2)")
    parser.add_argument("--test-data", type=str, required=True, help="Path to test dataset parquet file")
    parser.add_argument("--phase", type=int, action='append', choices=[1, 2, 3], 
                       help="Specific phase(s) to run (default: all). Can specify multiple times.")
    parser.add_argument("--api-url", type=str, default="http://127.0.0.1:8000", 
                       help="Backend API URL (for Phase 3)")
    parser.add_argument("--output-dir", type=str, default="evaluation/results", 
                       help="Base output directory for all results")
    
    args = parser.parse_args()
    
    # Determine which phases to run
    if args.phase:
        phases_to_run = sorted(set(args.phase))
    else:
        phases_to_run = [1, 2, 3]  # Run all by default
    
    print("\n" + "="*70)
    print("🛡️  AEGIS ITERATION-2: COMPLETE EVALUATION PIPELINE")
    print("="*70)
    print(f"\nPhases to run: {phases_to_run}")
    print(f"Model: {args.model}")
    print(f"Test Data: {args.test_data}")
    print(f"Output Dir: {args.output_dir}")
    if 3 in phases_to_run:
        print(f"API URL: {args.api_url}")
    print()
    
    results = {}
    
    try:
        # Phase 1
        if 1 in phases_to_run:
            output_dir_p1 = f"{args.output_dir}/phase1"
            results['phase1'] = run_phase_1(args.model, args.test_data, output_dir_p1)
        
        # Phase 2
        if 2 in phases_to_run:
            output_dir_p2 = f"{args.output_dir}/phase2"
            results['phase2'] = run_phase_2(args.model, args.test_data, output_dir_p2)
        
        # Phase 3
        if 3 in phases_to_run:
            output_dir_p3 = f"{args.output_dir}/phase3"
            results['phase3'] = run_phase_3(args.test_data, args.api_url, output_dir_p3)
        
        # Final summary
        print("\n" + "="*70)
        print("🎉 ALL EVALUATIONS COMPLETE!")
        print("="*70)
        print(f"\n📁 All results saved to: {args.output_dir}/")
        print("\nResults structure:")
        for phase_num in phases_to_run:
            print(f"  - phase{phase_num}/")
            print(f"      ├── phase{phase_num}_results.json")
            print(f"      ├── phase{phase_num}_report.txt")
            print(f"      └── *.png (visualizations)")
        
        print("\n✅ Evaluation pipeline completed successfully!")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Evaluation interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Evaluation failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
