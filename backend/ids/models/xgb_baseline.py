"""
xgb_baseline.py
Train quick baselines (LogReg, RF, XGB) on dummy or real data.
Outputs:
  - artifacts/xgb_baseline.joblib
  - seed/shap_example.json
  - backend/ids/experiments/ids_baseline.md
"""

import os, json
from pathlib import Path
import numpy as np
import pandas as pd
from joblib import dump
from sklearn.metrics import f1_score, precision_score, recall_score, roc_auc_score, confusion_matrix
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
import shap

# local imports
from backend.ids.loaders import load_dataset
from backend.ids.schemas import FEATURES, LABELS

# --------------------------
# paths
# --------------------------
ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS = ROOT / "artifacts"
EXPERIMENTS = ROOT / "backend" / "ids" / "experiments"
SEED = ROOT / "seed"
ARTIFACTS.mkdir(exist_ok=True)
EXPERIMENTS.mkdir(parents=True, exist_ok=True)
SEED.mkdir(exist_ok=True)

# --------------------------
# helper: metrics table
# --------------------------
def evaluate(model, X_test, y_test):
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else None
    macro_f1 = f1_score(y_test, preds, average="macro")
    precision = precision_score(y_test, preds, average="macro")
    recall = recall_score(y_test, preds, average="macro")
    roc = roc_auc_score(pd.get_dummies(y_test, columns=LABELS),
                        pd.get_dummies(pd.Series(preds), columns=LABELS),
                        average="macro",
                        multi_class="ovr")
    cm = confusion_matrix(y_test, preds, labels=LABELS)
    return {"f1": macro_f1, "precision": precision, "recall": recall, "roc_auc": roc, "conf_matrix": cm.tolist()}

# --------------------------
# main
# --------------------------
def main():
    print("▶ Loading dataset ...")
    X_train, y_train, X_val, y_val, X_test, y_test = load_dataset()

    results = {}

    # Logistic Regression
    print("▶ Training LogisticRegression ...")
    logreg = LogisticRegression(max_iter=500)
    logreg.fit(X_train, y_train)
    results["logreg"] = evaluate(logreg, X_test, y_test)

    # RandomForest
    print("▶ Training RandomForest ...")
    rf = RandomForestClassifier(n_estimators=100, max_depth=8, n_jobs=-1)
    rf.fit(X_train, y_train)
    results["random_forest"] = evaluate(rf, X_test, y_test)

    # XGBoost
    print("▶ Training XGBoost ...")
    xgb = XGBClassifier(
        objective="multi:softprob",
        eval_metric="mlogloss",
        num_class=len(LABELS),
        max_depth=6,
        learning_rate=0.1,
        n_estimators=150,
        n_jobs=-1,
        subsample=0.8,
        colsample_bytree=0.8,
        verbosity=0
    )
    xgb.fit(X_train, y_train)
    results["xgboost"] = evaluate(xgb, X_test, y_test)

    # pick best by macro-F1
    best_model_name = max(results, key=lambda k: results[k]["f1"])
    best_model = {"logreg": logreg, "random_forest": rf, "xgboost": xgb}[best_model_name]

    # save best model
    model_path = ARTIFACTS / f"{best_model_name}_baseline.joblib"
    dump(best_model, model_path)
    print(f"💾 Saved best model ({best_model_name}) → {model_path}")

    # generate one SHAP example (for UI)
    try:
        print("▶ Generating SHAP example ...")
        sample_X = X_test.head(10)
        explainer = shap.TreeExplainer(xgb)
        shap_values = explainer.shap_values(sample_X)
        top_features = sorted(
            zip(FEATURES, np.abs(shap_values).mean(axis=0)),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        shap_sample = {
            "method": "shap_tree",
            "model": best_model_name,
            "top_features": [{"name": n, "contrib": float(c)} for n, c in top_features]
        }
        with open(SEED / "shap_example.json", "w") as f:
            json.dump(shap_sample, f, indent=2)
        print("💾 Saved SHAP sample → seed/shap_example.json")
    except Exception as e:
        print(f"⚠️ SHAP generation failed: {e}")

    # write report
    report_path = EXPERIMENTS / "ids_baseline.md"
    with open(report_path, "w") as f:
        f.write("# IDS Baseline Results\n\n")
        for name, m in results.items():
            f.write(f"## {name.upper()}\n")
            f.write(f"- Macro F1: {m['f1']:.3f}\n- Precision: {m['precision']:.3f}\n- Recall: {m['recall']:.3f}\n- ROC-AUC: {m['roc_auc']:.3f}\n\n")
        f.write(f"**Best Model → {best_model_name}**\n")
    print(f"🧾 Report saved → {report_path}")

    print("✅ Baseline training complete!")

if __name__ == "__main__":
    main()
