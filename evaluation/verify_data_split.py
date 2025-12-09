#!/usr/bin/env python3
"""
Verify 70/15/15 Data Split Implementation

Checks that the preprocessing pipeline properly implements:
- 70% training data
- 15% validation data  
- 15% test data

Usage:
    python evaluation/verify_data_split.py --dataset Syn
"""

import argparse
import json
from pathlib import Path
import pandas as pd


def verify_split(dataset_name: str):
    """Verify that dataset has proper 70/15/15 split"""
    
    processed_dir = Path(f"datasets/processed/{dataset_name}")
    
    if not processed_dir.exists():
        print(f"❌ Dataset not found: {processed_dir}")
        print(f"   Run preprocessing first: python -m backend.ids.data_pipeline.pipeline_v3 --dataset {dataset_name}")
        return False
    
    print(f"\n{'='*70}")
    print(f"Verifying Data Split for Dataset: {dataset_name}")
    print(f"{'='*70}\n")
    
    # Load metadata
    metadata_path = processed_dir / "metadata.json"
    if metadata_path.exists():
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        print("📋 From metadata.json:")
        sizes = metadata.get('sizes', {})
        train_size = sizes.get('train', 0)
        val_size = sizes.get('val', 0)
        test_size = sizes.get('test', 0)
        total = sizes.get('total', 0)
        
        if total > 0:
            train_pct = (train_size / total) * 100
            val_pct = (val_size / total) * 100
            test_pct = (test_size / total) * 100
            
            print(f"   Training:   {train_size:,} samples ({train_pct:.1f}%)")
            print(f"   Validation: {val_size:,} samples ({val_pct:.1f}%)")
            print(f"   Test:       {test_size:,} samples ({test_pct:.1f}%)")
            print(f"   Total:      {total:,} samples")
    
    # Load actual files
    print("\n📂 Verifying actual parquet files:")
    
    train_path = processed_dir / "train.parquet"
    val_path = processed_dir / "val.parquet"
    test_path = processed_dir / "test.parquet"
    
    if not all([train_path.exists(), val_path.exists(), test_path.exists()]):
        print("❌ Missing parquet files!")
        return False
    
    train_df = pd.read_parquet(train_path)
    val_df = pd.read_parquet(val_path)
    test_df = pd.read_parquet(test_path)
    
    train_count = len(train_df)
    val_count = len(val_df)
    test_count = len(test_df)
    total_count = train_count + val_count + test_count
    
    train_pct = (train_count / total_count) * 100
    val_pct = (val_count / total_count) * 100
    test_pct = (test_count / total_count) * 100
    
    print(f"   Training:   {train_count:,} samples ({train_pct:.2f}%)")
    print(f"   Validation: {val_count:,} samples ({val_pct:.2f}%)")
    print(f"   Test:       {test_count:,} samples ({test_pct:.2f}%)")
    print(f"   Total:      {total_count:,} samples")
    
    # Verify split ratios
    print("\n🔍 Split Verification:")
    
    # Allow small tolerance (±2%) due to stratification and rounding
    train_ok = 68 <= train_pct <= 72
    val_ok = 13 <= val_pct <= 17
    test_ok = 13 <= test_pct <= 17
    
    if train_ok:
        print(f"   ✅ Training split correct: {train_pct:.2f}% (target: 70%)")
    else:
        print(f"   ⚠️  Training split off: {train_pct:.2f}% (target: 70%)")
    
    if val_ok:
        print(f"   ✅ Validation split correct: {val_pct:.2f}% (target: 15%)")
    else:
        print(f"   ⚠️  Validation split off: {val_pct:.2f}% (target: 15%)")
    
    if test_ok:
        print(f"   ✅ Test split correct: {test_pct:.2f}% (target: 15%)")
    else:
        print(f"   ⚠️  Test split off: {test_pct:.2f}% (target: 15%)")
    
    # Check label distribution
    print("\n📊 Label Distribution:")
    
    print("\n   Training set:")
    for label, count in train_df['label'].value_counts().items():
        pct = (count / len(train_df)) * 100
        print(f"      {label}: {count:,} ({pct:.1f}%)")
    
    print("\n   Validation set:")
    for label, count in val_df['label'].value_counts().items():
        pct = (count / len(val_df)) * 100
        print(f"      {label}: {count:,} ({pct:.1f}%)")
    
    print("\n   Test set:")
    for label, count in test_df['label'].value_counts().items():
        pct = (count / len(test_df)) * 100
        print(f"      {label}: {count:,} ({pct:.1f}%)")
    
    # Final verdict
    print("\n" + "="*70)
    if train_ok and val_ok and test_ok:
        print("✅ DATA SPLIT VERIFICATION PASSED")
        print("="*70)
        print("\n✅ Dataset is properly split for evaluation!")
        return True
    else:
        print("⚠️  DATA SPLIT VERIFICATION FAILED")
        print("="*70)
        print("\n⚠️  Re-run preprocessing to fix split:")
        print(f"   python -m backend.ids.data_pipeline.pipeline_v3 --dataset {dataset_name}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Verify 70/15/15 data split")
    parser.add_argument("--dataset", type=str, required=True, help="Dataset name (e.g., Syn, mitm_arp)")
    
    args = parser.parse_args()
    
    verify_split(args.dataset)


if __name__ == "__main__":
    main()
