"""
Loaders for IDS module.

Functions:
- load_config() -> dict
- load_dataset(name) -> (X_train, y_train, X_val, y_val, X_test, y_test)
- load_alert_seed() -> list[dict] or []
"""

import json
from pathlib import Path
from typing import Optional, Tuple

import numpy as np
import pandas as pd
import yaml
from sklearn.model_selection import train_test_split

from .schemas import FEATURES, LABELS

# -------------------------
# Helpers
# -------------------------
ROOT = Path(__file__).resolve().parents[2]  # project root (~/aegis)
CONFIG_PATH = Path(__file__).resolve().parent / "config.yaml"


def load_config():
    """Load YAML config or return defaults."""
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
        return cfg
    # fallback default config
    return {
        "features": FEATURES,
        "labels": LABELS,
        "datasets_root": str(ROOT / "datasets" / "processed"),
        "default_dataset": "cicids2017",
        "seed_alerts": str(ROOT / "seed" / "alerts.json"),
    }


# -------------------------
# load_dataset
# -------------------------
def _make_dummy_dataframe(n_samples: int = 2000):
    """Construct a reproducible dummy DataFrame with FEATURES + 'label'."""
    rng = np.random.default_rng(seed=42)
    X = rng.normal(loc=0.0, scale=1.0, size=(n_samples, len(FEATURES)))
    df = pd.DataFrame(X, columns=FEATURES)
    # make some positive correlations for simulated classes
    labels = rng.integers(0, len(LABELS), size=n_samples)
    df["label"] = [LABELS[int(lbl)] for lbl in labels]
    return df


def load_dataset(
    name: Optional[str] = None,
    test_size: float = 0.10,
    val_size: float = 0.10,
    random_state: int = 42,
) -> Tuple[pd.DataFrame, pd.Series, pd.DataFrame, pd.Series, pd.DataFrame, pd.Series]:
    """
    Load processed dataset if available. If not found, return dummy data.
    Returns: X_train, y_train, X_val, y_val, X_test, y_test
    """
    cfg = load_config()
    if name is None:
        name = cfg.get("default_dataset", "cicids2017")
    datasets_root = Path(cfg.get("datasets_root", str(ROOT / "datasets" / "processed")))

    dataset_path = datasets_root / name
    train_path = dataset_path / "train.parquet"

    if train_path.exists():
        try:
            # load split files if pipeline already produced them
            df_train = pd.read_parquet(train_path)

            df_val = (
                pd.read_parquet(dataset_path / "val.parquet")
                if (dataset_path / "val.parquet").exists()
                else None
            )

            df_test = (
                pd.read_parquet(dataset_path / "test.parquet")
                if (dataset_path / "test.parquet").exists()
                else None
            )

            if df_val is None or df_test is None:
                # If only train exists, perform splits
                df = pd.concat([df_train], ignore_index=True)
                if "label" not in df.columns:
                    raise ValueError("Processed dataset missing 'label' column.")

                X = df[FEATURES]
                y = df["label"]
                X_train, X_temp, y_train, y_temp = train_test_split(
                    X,
                    y,
                    test_size=(test_size + val_size),
                    random_state=random_state,
                    stratify=y if len(y.unique()) > 1 else None,
                )

                relative_val = val_size / (val_size + test_size)
                X_val, X_test, y_val, y_test = train_test_split(
                    X_temp,
                    y_temp,
                    test_size=relative_val,
                    random_state=random_state,
                    stratify=y_temp if len(y_temp.unique()) > 1 else None,
                )
                return X_train, y_train, X_val, y_val, X_test, y_test

            # if val and test files exist, use them
            X_train = df_train[FEATURES]
            y_train = df_train["label"]
            X_val = df_val[FEATURES]
            y_val = df_val["label"]
            X_test = df_test[FEATURES]
            y_test = df_test["label"]

            return X_train, y_train, X_val, y_val, X_test, y_test

        except Exception as e:
            print(
                f"⚠️ Error loading processed dataset from {train_path}: "
                f"{e}. Falling back to dummy data."
            )

    else:
        print(
            f"⚠️ Processed dataset not found at {train_path}. "
            "Using dummy data for development."
        )

    # Dummy fallback
    df = _make_dummy_dataframe(n_samples=2000)
    X = df[FEATURES]
    y = df["label"]

    # First split train vs temp
    X_train, X_temp, y_train, y_temp = train_test_split(
        X,
        y,
        test_size=(test_size + val_size),
        random_state=random_state,
        stratify=y if len(y.unique()) > 1 else None,
    )

    relative_val = val_size / (val_size + test_size)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp,
        y_temp,
        test_size=relative_val,
        random_state=random_state,
        stratify=y_temp if len(y_temp.unique()) > 1 else None,
    )
    return X_train, y_train, X_val, y_val, X_test, y_test


# -------------------------
# load_alert_seed
# -------------------------
def load_alert_seed(seed_path: Optional[str] = None):
    """Load seed alerts from JSON or return empty list."""
    cfg = load_config()
    if seed_path is None:
        seed_path = cfg.get("seed_alerts", str(ROOT / "seed" / "alerts.json"))
    seed_fp = Path(seed_path)

    if seed_fp.exists():
        try:
            with open(seed_fp, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data
        except Exception as e:
            print(f"⚠️ Failed to load seed alerts from {seed_fp}: {e}")
            return []

    print(
        f"⚠️ No seed alerts found at {seed_fp}. "
        f"Provide {seed_fp} for frontend testing."
    )
    return []
