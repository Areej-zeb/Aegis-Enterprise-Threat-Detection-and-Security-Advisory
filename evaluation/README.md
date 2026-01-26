# 🔥 AEGIS ITERATION-2 – COMPLETE TESTING PLAN

**Complete offline evaluation pipeline for AEGIS IDS without live network attacks**

This evaluation framework implements a **3-phase testing strategy** to comprehensively validate the AEGIS IDS system, progressing from basic ML metrics to full system integration testing.

---

## 📋 Overview

| Phase                         | What is Tested                 | Flow Structure                                         | Expected Output                                 |
| ----------------------------- | ------------------------------ | ------------------------------------------------------ | ----------------------------------------------- |
| **1. Dataset-Level**          | ML model correctness & metrics | All flows shuffled or split by time                    | Accuracy, recall, precision, F1, ROC-AUC, FPR   |
| **2. Scenario-Based**         | Behavior over time             | Flows arranged in sequences (benign → attack → benign) | Alerts over time, detection delay, false alerts |
| **3. System-Level (Backend)** | End-to-end Aegis pipeline      | Batches of flows sent via API to backend               | Alert generation, stability, inference speed    |

---

## 🔷 PHASE 1 — DATASET-LEVEL TESTING (Classic ML Testing)

### Purpose

Test how good your classifier is using clean train/val/test splits.

### Flow Structure

All flows are in a **single dataset** in random or time-based order. The model sees **individual rows only — no timing, no traffic sequence.**

### What is Computed

| Metric                           | Why it's needed                     |
| -------------------------------- | ----------------------------------- |
| Confusion matrix                 | Raw correctness                     |
| Precision/Recall per class       | Detect attack vs avoid false alerts |
| F1 score                         | Balance between P/R                 |
| ROC-AUC & PR-AUC                 | Threshold analysis                  |
| ⚠️ False Positives per 10k flows | Most important for IDS credibility  |

### Threshold Sweep

Evaluates predictions at thresholds: `0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9`

For each threshold:

- Recall (attack detection rate)
- Precision (accuracy of alerts)
- F1-Score (harmonic mean)
- False Positive Rate

Picks optimal threshold that balances **not missing attacks + low false alerts**.

### Usage

```bash
# Run Phase 1 evaluation
python evaluation/phase1_dataset_evaluation.py \
    --model artifacts/Syn/xgb_baseline.joblib \
    --test-data datasets/processed/Syn/test.parquet \
    --output evaluation/results/phase1
```

### Output Files

- `phase1_results.json` - Complete metrics in JSON format
- `phase1_report.txt` - Human-readable report
- `confusion_matrix.png` - Confusion matrix heatmap
- `roc_pr_curves.png` - ROC and Precision-Recall curves
- `threshold_analysis.png` - Performance vs threshold plots

---

## 🔷 PHASE 2 — SCENARIO-BASED EVALUATION (Realistic Timeline Simulation)

### Purpose

Test model behavior with **realistic traffic sequences** over time, not just random individual flows.

### Flow Structure

Flows are **no longer random** — they're assembled to simulate actual network behavior.

### Scenarios

#### **Scenario 1: All Benign Sequence**

```
[Benign] [Benign] [Benign] [Benign] ...
```

**Expected**: Zero or near-zero alerts  
**Tests**: Stability and noise resistance (False Positive rate)

---

#### **Scenario 2: Pure SYN Flood**

```
[SYN] [SYN] [SYN] [SYN] [SYN] [SYN] ...
```

**Measures**:

- Detection rate: `detected / total_attack_flows`
- Misses (if any)
- Confidence scores

**Tests**: Raw sensitivity to attack traffic

---

#### **Scenario 3: Mixed Timeline (Realistic Environment)**

```
Benign → Benign → Benign → SYN SYN SYN SYN → Benign → Benign
```

Example dataset slice:

| Seq No    | Flow                      | Label  |
| --------- | ------------------------- | ------ |
| 1–3000    | Normal HTTP, DNS, TCP     | benign |
| 3001–3300 | Sudden spike of SYN       | attack |
| 3301–4500 | Stabilized normal traffic | benign |

**What to Measure**:

| Metric                                       | Why it matters              |
| -------------------------------------------- | --------------------------- |
| How long until model alerts once SYN starts? | Detection delay             |
| What % of SYN flows got caught?              | Threat coverage             |
| Did the model misfire before/after burst?    | FP behavior near transition |

**Tests**: Real intrusion event simulation

---

#### **Scenario 4: Stealth Slow SYN**

```
Benign — SYN — Benign — SYN — Benign — SYN  (very spaced out)
```

Attack flows are sparse, e.g., 1 SYN packet every 50–200 flows.

**Measures**: Minimum attack frequency detectable  
**Tests**: Detection of slow, distributed attacks

---

### Usage

```bash
# Run Phase 2 evaluation
python evaluation/phase2_scenario_evaluation.py \
    --model artifacts/Syn/xgb_baseline.joblib \
    --test-data datasets/processed/Syn/test.parquet \
    --output evaluation/results/phase2
```

### Output Files

- `phase2_results.json` - All scenario results
- `phase2_report.txt` - Human-readable report
- `scenario3_timeline.png` - Alert timeline visualization

---

## 🔷 PHASE 3 — SYSTEM-LEVEL EVALUATION (Backend + Prediction Pipeline)

### Purpose

Test **the entire AEGIS platform** end-to-end, not just the ML model.

### Flow Structure

Flows are sent in **batches** as the backend would receive them via REST API.

### Tests

#### **Test 1: Benign Batch Processing**

- Send 1000 benign flows
- **Expected**: No alerts or minimal FP
- **Measures**: False positive rate, system stability

#### **Test 2: Attack Batch Processing**

- Send 500 attack flows
- **Expected**: High alert count
- **Measures**: Detection rate, confidence scores

#### **Test 3: Mixed Batch**

- Send mixed benign + attack (80/20 ratio)
- **Expected**: Alert spike during attack portion only
- **Measures**: Alert accuracy vs ground truth

#### **Test 4: Performance & Scalability**

- Test batches of: 100, 500, 1000, 2000, 5000 flows
- **Measures**:
  - Processing speed per batch
  - Throughput (flows/sec)
  - Response time scaling

#### **Test 5: Alert Generation & Dashboard**

- Verify alert generation logic
- Check dashboard display updates
- **Validates**: Complete pipeline from prediction → alert → UI

### Usage

**Prerequisites**: Start the backend first!

```bash
# Terminal 1: Start backend
python -m backend.ids.serve.app

# Terminal 2: Run Phase 3 evaluation
python evaluation/phase3_system_evaluation.py \
    --test-data datasets/processed/Syn/test.parquet \
    --api-url http://127.0.0.1:8000 \
    --output evaluation/results/phase3
```

### Output Files

- `phase3_results.json` - All test results
- `phase3_report.txt` - Human-readable report
- `performance_analysis.png` - Throughput and response time plots

---

## 🚀 Quick Start — Run All Phases

### Option 1: Run All Phases Sequentially

```bash
# Make sure you're in the project root
cd /path/to/Aegis-Enterprise-Threat-Detection-and-Security-Advisory-main

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# OR
.\venv\Scripts\activate   # Windows

# Run all 3 phases
python evaluation/run_all_phases.py \
    --model artifacts/Syn/xgb_baseline.joblib \
    --test-data datasets/processed/Syn/test.parquet
```

### Option 2: Run Specific Phases

```bash
# Run only Phase 1 and 2 (no backend required)
python evaluation/run_all_phases.py \
    --model artifacts/Syn/xgb_baseline.joblib \
    --test-data datasets/processed/Syn/test.parquet \
    --phase 1 --phase 2
```

### Option 3: Run Individual Phases

```bash
# Phase 1 only
python evaluation/phase1_dataset_evaluation.py \
    --model artifacts/Syn/xgb_baseline.joblib \
    --test-data datasets/processed/Syn/test.parquet

# Phase 2 only
python evaluation/phase2_scenario_evaluation.py \
    --model artifacts/Syn/xgb_baseline.joblib \
    --test-data datasets/processed/Syn/test.parquet

# Phase 3 only (backend must be running!)
python evaluation/phase3_system_evaluation.py \
    --test-data datasets/processed/Syn/test.parquet
```

---

## 📊 Results Structure

After running all phases, your results will be organized as:

```
evaluation/results/
├── phase1/
│   ├── phase1_results.json
│   ├── phase1_report.txt
│   ├── confusion_matrix.png
│   ├── roc_pr_curves.png
│   └── threshold_analysis.png
├── phase2/
│   ├── phase2_results.json
│   ├── phase2_report.txt
│   └── scenario3_timeline.png
└── phase3/
    ├── phase3_results.json
    ├── phase3_report.txt
    └── performance_analysis.png
```

---

## 📈 Sample Performance Statement (For Report)

> **Phase 3 Results**: A batch of 1000 flows is processed in ~1.2 seconds, achieving a throughput of 833 flows/second. This enables near-real-time alerting suitable for SME-scale network traffic monitoring. The system maintains 99.5% detection rate with < 0.1% false positive rate across all test scenarios.

---

## 🎯 Evaluation Pipeline Flowchart

```
┌────────────────────────────────────────┐
│ PHASE 1 – DATASET TESTING              │
│ - Full dataset, random/time split      │
│ - Metrics: P/R/F1/ROC/FPR              │
└───────────────▲────────────────────────┘
                │ Model OK?
┌───────────────┴────────────────────────┐
│ PHASE 2 – SCENARIO TESTING             │
│ - Flows arranged in time-sequences     │
│ - benign-only, pure-attack, mixed, slow│
│ - Measures detection delay + FP rate   │
└───────────────▲────────────────────────┘
                │ Behavior OK?
┌───────────────┴────────────────────────┐
│ PHASE 3 – SYSTEM INTEGRATION           │
│ - Backend POST /predict testing        │
│ - Batch inference → alerts → dashboard │
│ - Speed + stability validation         │
└────────────────────────────────────────┘
```

---

## 🔧 Preprocessing - 70/15/15 Split Verification

The current preprocessing pipeline (`backend/ids/data_pipeline/pipeline_v3.py`) already implements:

✅ **70% Training** - Used for model training with SMOTE balancing  
✅ **15% Validation** - Used during training for early stopping  
✅ **15% Testing** - Used for all 3 evaluation phases (never seen during training)

### Verify Split

```bash
# Check metadata for any dataset
cat datasets/processed/Syn/metadata.json

# Output shows:
# "sizes": {
#   "train": 377,429,  (70%)
#   "val": 80,877,     (15%)
#   "test": 80,877     (15%)
# }
```

### Re-run Preprocessing (If Needed)

```bash
# Process all datasets
python -m backend.ids.data_pipeline.pipeline_v3 --all

# Or specific dataset
python -m backend.ids.data_pipeline.pipeline_v3 --dataset Syn
```

---

## 📝 Requirements

- Python 3.8+
- All dependencies from `requirements.txt`
- Trained model artifacts
- Preprocessed test dataset

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## ⚠️ Important Notes

1. **Phase 3 requires backend running** - Start with `python -m backend.ids.serve.app`
2. **Test data must never be used during training** - Ensure proper 70/15/15 split
3. **Results are reproducible** - Fixed random seeds used throughout
4. **All phases are independent** - Can run individually or together
5. **WSL users** - Use `wsl bash -c "cd /path && python evaluation/run_all_phases.py ..."`

---

## 🎓 For Your Report/Presentation

Use these evaluation results to demonstrate:

1. **Technical Rigor** - 3-phase evaluation shows thorough testing methodology
2. **Real-World Applicability** - Scenario testing proves behavior under realistic conditions
3. **Production Readiness** - System-level testing validates end-to-end pipeline
4. **Performance Metrics** - Quantified throughput, latency, and accuracy
5. **Transparency** - All metrics, visualizations, and verdicts clearly documented

---

## 📚 Additional Resources

- **Model Training**: See `IDS_TRAINING.md`
- **Preprocessing Details**: See `PREPROCESSING_V3_SUMMARY.md`
- **Quick Reference**: See `QUICK_REFERENCE.md`
- **Deployment**: See `DEPLOYMENT_CHECKLIST.md`

---

## ✅ Checklist for Complete Evaluation

- [ ] Preprocessing completed with 70/15/15 split
- [ ] Model trained and saved to `artifacts/`
- [ ] Phase 1: Dataset-level metrics computed
- [ ] Phase 2: All 4 scenarios tested
- [ ] Phase 3: Backend API tests passed
- [ ] All visualizations generated
- [ ] Results documented in JSON + text reports
- [ ] Performance statement prepared for report

---

**Ready to evaluate? Run the complete pipeline:**

```bash
python evaluation/run_all_phases.py \
    --model artifacts/Syn/xgb_baseline.joblib \
    --test-data datasets/processed/Syn/test.parquet
```

🛡️ **AEGIS IDS - Comprehensive Threat Detection with Rigorous Testing** 🛡️
