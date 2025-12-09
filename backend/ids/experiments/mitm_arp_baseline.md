# IDS Baseline Training Report - mitm_arp

**Generated:** 2025-11-23 18:37:52

## Dataset Information

- **Name:** mitm_arp
- **Features:** 25
- **Classes:** BENIGN, MITM_ARP
- **Train samples:** 74,672
- **Val samples:** 9,855
- **Test samples:** 9,855

### Class Weights

**Original (pre-balancing):**

- BENIGN: 0.6159
- MITM_ARP: 2.6574

**After Balancing:**

- BENIGN: 1.0000
- MITM_ARP: 1.0000

## Overall Model Performance

| Model | Accuracy | Macro F1 | Weighted F1 | Precision | Recall | ROC-AUC |
|-------|----------|----------|-------------|-----------|--------|----------|
| XGBoost | 0.8547 | 0.8085 | 0.8672 | 0.7787 | 0.8975 | 0.9711 |

## Best Model

**XGBoost** - Macro F1 Score: 0.8085

### Per-Class Performance

| Class | Precision | Recall | F1-Score |
|-------|-----------|--------|----------|
| BENIGN | 0.9906 | 0.8289 | 0.9026 |
| MITM_ARP | 0.5668 | 0.9660 | 0.7144 |

## Training Configuration

- Preprocessing: StandardScaler
- Imbalance handling: RandomUnderSampler + SMOTE
- Max samples: 500000
- Target ratio: 1.0
- Random state: 42

