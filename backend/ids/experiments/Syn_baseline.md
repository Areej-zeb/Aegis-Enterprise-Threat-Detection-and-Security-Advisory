# IDS Baseline Training Report - Syn

**Generated:** 2025-11-23 18:34:59

## Dataset Information

- **Name:** Syn
- **Features:** 30
- **Classes:** BENIGN, DDoS_SYN
- **Train samples:** 1,000,000
- **Val samples:** 538,899
- **Test samples:** 538,899

### Class Weights

**Original (pre-balancing):**

- DDoS_SYN: 0.5044
- BENIGN: 57.8767

**After Balancing:**

- BENIGN: 1.0000
- DDoS_SYN: 1.0000

## Overall Model Performance

| Model | Accuracy | Macro F1 | Weighted F1 | Precision | Recall | ROC-AUC |
|-------|----------|----------|-------------|-----------|--------|----------|
| XGBoost | 0.9999 | 0.9976 | 0.9999 | 0.9956 | 0.9995 | 1.0000 |

## Best Model

**XGBoost** - Macro F1 Score: 0.9976

### Per-Class Performance

| Class | Precision | Recall | F1-Score |
|-------|-----------|--------|----------|
| BENIGN | 0.9913 | 0.9991 | 0.9952 |
| DDoS_SYN | 1.0000 | 0.9999 | 1.0000 |

## Training Configuration

- Preprocessing: StandardScaler
- Imbalance handling: RandomUnderSampler + SMOTE
- Max samples: 500000
- Target ratio: 1.0
- Random state: 42

