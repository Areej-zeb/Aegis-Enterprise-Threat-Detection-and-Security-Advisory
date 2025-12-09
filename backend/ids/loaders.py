# backend/ids/loaders.py
"""
Data loading utilities for Aegis IDS.

Functions:
  - load_alert_seed(): Load seed alerts from seed/alerts.json
  - load_dataset(): Load preprocessed train/val/test splits for model training
  - load_raw_dataset(): Load raw CSV/Parquet files for preprocessing
"""

import json
from pathlib import Path
from typing import Tuple, Optional
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

from ids.schemas import FEATURES, LABELS


def load_alert_seed():
    """Load seed alerts from seed/alerts.json for demo/static mode."""
    root = Path(__file__).resolve().parents[2]
    seed_path = root / "seed" / "alerts.json"
    if not seed_path.exists():
        print(f"⚠️ Missing seed alerts file at {seed_path}")
        return []
    try:
        with open(seed_path, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Failed to load alerts: {e}")
        return []


def load_dataset(
    data_dir: Optional[Path] = None,
    test_size: float = 0.2,
    val_size: float = 0.1,
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.Series, pd.DataFrame, pd.Series, pd.DataFrame, pd.Series]:
    """
    Load preprocessed training data for model training.
    
    Returns:
        X_train, y_train, X_val, y_val, X_test, y_test
    
    Expected file structure:
        datasets/processed/
            train.parquet (or train.csv)
            val.parquet (or val.csv)
            test.parquet (or test.csv)
        
        OR
        
        datasets/processed/
            full_data.parquet (will be split automatically)
    
    The data must contain:
        - All columns from FEATURES (defined in schemas.py)
        - A 'label' column with values from LABELS
    
    Args:
        data_dir: Path to processed data directory (default: datasets/processed/)
        test_size: Fraction of data for test set (if splitting full_data)
        val_size: Fraction of remaining data for validation set
        random_state: Random seed for reproducibility
    
    Raises:
        FileNotFoundError: If no processed data files are found
        ValueError: If data doesn't contain required features or labels
    """
    # Determine data directory
    if data_dir is None:
        root = Path(__file__).resolve().parents[2]
        data_dir = root / "datasets" / "processed"
    
    if not data_dir.exists():
        raise FileNotFoundError(
            f"Processed data directory not found: {data_dir}\n"
            f"Please run preprocessing first: python -m backend.ids.data_pipeline.pipeline"
        )
    
    # Try to load pre-split data
    train_file = data_dir / "train.parquet"
    val_file = data_dir / "val.parquet"
    test_file = data_dir / "test.parquet"
    
    # Fallback to CSV if parquet doesn't exist
    if not train_file.exists():
        train_file = data_dir / "train.csv"
    if not val_file.exists():
        val_file = data_dir / "val.csv"
    if not test_file.exists():
        test_file = data_dir / "test.csv"
    
    # Case 1: Pre-split data exists
    if train_file.exists() and val_file.exists() and test_file.exists():
        print(f"✓ Loading pre-split data from {data_dir}")
        
        if train_file.suffix == ".parquet":
            df_train = pd.read_parquet(train_file)
            df_val = pd.read_parquet(val_file)
            df_test = pd.read_parquet(test_file)
        else:
            df_train = pd.read_csv(train_file)
            df_val = pd.read_csv(val_file)
            df_test = pd.read_csv(test_file)
        
        # Separate features and labels
        X_train = df_train[FEATURES]
        y_train = df_train["label"]
        X_val = df_val[FEATURES]
        y_val = df_val["label"]
        X_test = df_test[FEATURES]
        y_test = df_test["label"]
        
        print(f"  Train: {len(X_train)} samples")
        print(f"  Val:   {len(X_val)} samples")
        print(f"  Test:  {len(X_test)} samples")
    
    # Case 2: Full data file exists (need to split)
    else:
        full_file = data_dir / "full_data.parquet"
        if not full_file.exists():
            full_file = data_dir / "full_data.csv"
        
        if not full_file.exists():
            raise FileNotFoundError(
                f"No processed data found in {data_dir}\n"
                f"Expected: train/val/test splits OR full_data file\n"
                f"Please run preprocessing first: python -m backend.ids.data_pipeline.pipeline"
            )
        
        print(f"✓ Loading full dataset from {full_file}")
        
        if full_file.suffix == ".parquet":
            df = pd.read_parquet(full_file)
        else:
            df = pd.read_csv(full_file)
        
        print(f"  Total: {len(df)} samples")
        
        # Split data
        X = df[FEATURES]
        y = df["label"]
        
        # Train + (val+test) split
        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y, test_size=(test_size + val_size), random_state=random_state, stratify=y
        )
        
        # Val + test split
        val_ratio = val_size / (test_size + val_size)
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=(1 - val_ratio), random_state=random_state, stratify=y_temp
        )
        
        print(f"  Train: {len(X_train)} samples ({len(X_train)/len(df)*100:.1f}%)")
        print(f"  Val:   {len(X_val)} samples ({len(X_val)/len(df)*100:.1f}%)")
        print(f"  Test:  {len(X_test)} samples ({len(X_test)/len(df)*100:.1f}%)")
    
    # Validate features
    missing_features = set(FEATURES) - set(X_train.columns)
    if missing_features:
        raise ValueError(
            f"Missing required features: {missing_features}\n"
            f"Expected features from schemas.py: {FEATURES}"
        )
    
    # Validate labels
    unique_labels = set(y_train.unique()) | set(y_val.unique()) | set(y_test.unique())
    invalid_labels = unique_labels - set(LABELS)
    if invalid_labels:
        raise ValueError(
            f"Invalid labels found: {invalid_labels}\n"
            f"Expected labels from schemas.py: {LABELS}"
        )
    
    print(f"✓ Data validation passed")
    print(f"  Features: {len(FEATURES)}")
    print(f"  Labels: {unique_labels}")
    
    return X_train, y_train, X_val, y_val, X_test, y_test


def load_raw_dataset(
    dataset_name: str,
    data_dir: Optional[Path] = None
) -> pd.DataFrame:
    """
    Load raw dataset from datasets/raw/ directory.
    
    This is used by the preprocessing pipeline to load unprocessed data.
    
    Args:
        dataset_name: Name of the dataset (e.g., "cicids2017", "nslkdd")
        data_dir: Path to raw data directory (default: datasets/raw/)
    
    Returns:
        Raw dataframe loaded from CSV/Parquet
    
    Raises:
        FileNotFoundError: If dataset file not found
    
    Example:
        df = load_raw_dataset("cicids2017")
    """
    if data_dir is None:
        root = Path(__file__).resolve().parents[2]
        data_dir = root / "datasets" / "raw"
    
    # Try multiple file formats
    possible_files = [
        data_dir / f"{dataset_name}.parquet",
        data_dir / f"{dataset_name}.csv",
        data_dir / f"{dataset_name}.csv.gz",
        data_dir / dataset_name / "data.parquet",
        data_dir / dataset_name / "data.csv",
    ]
    
    for file_path in possible_files:
        if file_path.exists():
            print(f"✓ Loading raw dataset from {file_path}")
            
            if file_path.suffix == ".parquet":
                return pd.read_parquet(file_path)
            elif file_path.suffix == ".gz":
                return pd.read_csv(file_path, compression="gzip")
            else:
                return pd.read_csv(file_path)
    
    raise FileNotFoundError(
        f"Raw dataset '{dataset_name}' not found in {data_dir}\n"
        f"Tried: {[str(p) for p in possible_files]}\n"
        f"Please place your raw dataset files in datasets/raw/"
    )
