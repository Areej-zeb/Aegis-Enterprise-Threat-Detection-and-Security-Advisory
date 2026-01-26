# IDS Baseline Training Report - dns_stateless

**Generated:** 2025-12-04 02:34:16

## Dataset Information

- **Name:** dns_stateless
- **Features:** 7
- **Classes:** DNS_EXFILTRATION, BENIGN
- **Train samples:** 375,296
- **Val samples:** 80,421
- **Test samples:** 80,421

### Class Weights

**Original (pre-balancing):**

- DNS_EXFILTRATION: 0.9107
- BENIGN: 1.1087

**After Balancing:**

- DNS_EXFILTRATION: 0.9107
- BENIGN: 1.1087

## Overall Model Performance

| Model | Accuracy | Macro F1 | Weighted F1 | Precision | Recall | ROC-AUC |
|-------|----------|----------|-------------|-----------|--------|----------|
| XGBoost | 0.8191 | 0.8039 | 0.8093 | 0.8757 | 0.7995 | 0.7996 |

## Best Model

**XGBoost** - Macro F1 Score: 0.8039

### Per-Class Performance

| Class | Precision | Recall | F1-Score |
|-------|-----------|--------|----------|
| BENIGN | 0.9990 | 0.5995 | 0.7494 |
| DNS_EXFILTRATION | 0.7524 | 0.9995 | 0.8585 |

## Training Configuration

- Preprocessing: None (raw features)
- Imbalance handling: Natural distribution (no SMOTE for DNS)
- Max samples: 500000
- Target ratio: 1.0
- Random state: 42

