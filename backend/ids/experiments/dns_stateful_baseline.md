# IDS Baseline Training Report - dns_stateful

**Generated:** 2025-12-04 02:35:35

## Dataset Information

- **Name:** dns_stateful
- **Features:** 19
- **Classes:** BENIGN, DNS_EXFILTRATION
- **Train samples:** 122,574
- **Val samples:** 26,266
- **Test samples:** 26,267

### Class Weights

**Original (pre-balancing):**

- DNS_EXFILTRATION: 1.0508
- BENIGN: 0.9539

**After Balancing:**

- DNS_EXFILTRATION: 1.0508
- BENIGN: 0.9539

## Overall Model Performance

| Model | Accuracy | Macro F1 | Weighted F1 | Precision | Recall | ROC-AUC |
|-------|----------|----------|-------------|-----------|--------|----------|
| XGBoost | 0.8443 | 0.8426 | 0.8418 | 0.8751 | 0.8513 | 0.8607 |

## Best Model

**XGBoost** - Macro F1 Score: 0.8426

### Per-Class Performance

| Class | Precision | Recall | F1-Score |
|-------|-----------|--------|----------|
| BENIGN | 0.9953 | 0.7062 | 0.8262 |
| DNS_EXFILTRATION | 0.7548 | 0.9963 | 0.8589 |

## Training Configuration

- Preprocessing: None (raw features)
- Imbalance handling: Natural distribution (no SMOTE for DNS)
- Max samples: 500000
- Target ratio: 1.0
- Random state: 42

