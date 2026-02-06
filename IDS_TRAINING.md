# 🤖 Aegis IDS - Training Guide (Iteration 2)

Complete guide for training the Aegis IDS machine learning models with GPU acceleration.

---

## 📋 Prerequisites

### Hardware

- **GPU:** NVIDIA RTX 3070 (or any CUDA-compatible GPU)
- **RAM:** 16GB+ recommended
- **Storage:** 10GB+ for datasets

### Software

- **OS:** WSL Ubuntu (Windows Subsystem for Linux)
- **Python:** 3.9+ (3.10 recommended)
- **CUDA:** 11.x or 12.x (for GPU acceleration)
- **Conda or venv:** For environment isolation

---

## 🚀 Quick Start

### One-Command Workflow

```bash
# 1. Activate environment
conda activate aegis  # or: source venv/bin/activate

# 2. Preprocess data
./scripts/preprocess.sh

# 3. Train models (GPU-accelerated)
./scripts/train_ids.sh

# 4. Run backend
./scripts/run_backend.sh

# 5. Run frontend (in new terminal)
./scripts/run_frontend.sh
```

---

## 📊 Step 1: Data Preprocessing

### Input Data Structure

Place your raw datasets in `datasets/raw/`:

```
datasets/raw/
  ├── cicids2017.csv
  ├── cic-ddos2019.csv
  └── custom_data.parquet
```

### Run Preprocessing

```bash
# Method 1: Using script
./scripts/preprocess.sh

# Method 2: Direct Python
python -m backend.ids.data_pipeline.pipeline --dataset cicids2017

# Method 3: Disable SMOTE (if dataset is balanced)
python -m backend.ids.data_pipeline.pipeline --dataset cicids2017 --no-smote
```

### Preprocessing Steps

The pipeline performs:

1. **Data Loading** - Loads raw CSV/Parquet files
2. **Cleaning** - Removes duplicates, handles missing values, removes outliers
3. **Feature Engineering** - Creates features matching `schemas.FEATURES`
4. **Label Mapping** - Maps dataset labels to canonical `schemas.LABELS`
5. **Train/Val/Test Split** - 70%/15%/15% stratified split
6. **Normalization** - StandardScaler (mean=0, std=1)
7. **SMOTE** - Oversamples minority classes (optional)
8. **Save** - Outputs to `datasets/processed/`

### Output Files

```
datasets/processed/
  ├── train.parquet      # Training data (70%)
  ├── val.parquet        # Validation data (15%)
  ├── test.parquet       # Test data (15%)
  └── metadata.json      # Statistics and configuration
```

### Customizing Preprocessing

Edit `backend/ids/data_pipeline/pipeline.py`:

1. **Feature Engineering** - Modify `engineer_features()` function
2. **Label Mapping** - Update `map_labels()` function
3. **Cleaning Rules** - Customize `clean_data()` function

---

## 🧠 Step 2: Model Training

### GPU Setup (WSL + CUDA)

Verify CUDA installation:

```bash
# Check CUDA version
nvcc --version

# Check GPU
nvidia-smi

# Test PyTorch CUDA
python -c "import torch; print('CUDA:', torch.cuda.is_available())"
```

### Train Models

```bash
# Method 1: Using script
./scripts/train_ids.sh

# Method 2: Direct Python
python -m backend.ids.models.xgb_baseline
```

### Training Process

The script trains **3 models**:

1. **Logistic Regression** (Baseline #1)

   - Fast training
   - Linear decision boundaries
   - Good for simple patterns

2. **Random Forest** (Baseline #2)

   - Ensemble of decision trees
   - Captures non-linear patterns
   - Robust to overfitting

3. **XGBoost** (Production Model) ⭐
   - **GPU-Accelerated** (`tree_method='gpu_hist'`)
   - Best performance for IDS tasks
   - SHAP explainability support
   - Early stopping with validation set

### GPU Acceleration

XGBoost automatically uses your RTX 3070 if available:

```python
# Configured in xgb_baseline.py
xgb_params = {
    "tree_method": "gpu_hist",  # GPU acceleration
    "gpu_id": 0,                # First GPU
    "max_depth": 8,
    "learning_rate": 0.1,
    "n_estimators": 200,
    # ... other params
}
```

**Performance Boost:**

- CPU training: ~15-30 minutes
- GPU training: ~2-5 minutes (3-6x faster)

### Training Output

```
artifacts/
  └── xgb_baseline.joblib      # Trained model (best F1-score)

seed/
  └── shap_example.json        # SHAP values for top features

backend/ids/experiments/
  └── ids_baseline.md          # Metrics report
```

### Interpreting Results

Check the generated report:

```bash
cat backend/ids/experiments/ids_baseline.md
```

Key metrics to review:

- **Macro-F1**: Overall performance across all classes
- **Precision**: How many detected threats are real
- **Recall**: How many real threats are detected
- **ROC-AUC**: Model's ability to discriminate classes
- **Confusion Matrix**: Per-class performance

---

## 🔍 Step 3: Model Evaluation

### Per-Class Metrics

The training script outputs detailed per-class metrics:

```
              precision    recall  f1-score   support

      BENIGN       0.95      0.98      0.96     12543
    DDoS_SYN       0.92      0.88      0.90      5621
    DDoS_UDP       0.89      0.91      0.90      4832
   BRUTE_FTP       0.85      0.82      0.83      3214
   SCAN_PORT       0.88      0.90      0.89      4156
    MITM_ARP       0.91      0.89      0.90      2987

    accuracy                           0.91     33353
   macro avg       0.90      0.90      0.90     33353
weighted avg       0.91      0.91      0.91     33353
```

### Feature Importance (SHAP)

View top features influencing predictions:

```bash
cat seed/shap_example.json
```

Expected top features:

1. `pkt_rate` - Packets per second
2. `syn_ratio` - SYN packet ratio
3. `byte_rate` - Bytes per second
4. `flow_duration` - Connection duration
5. `avg_pkt_size` - Average packet size

---

## 🚀 Step 4: Running the System

### Start Backend (with trained model)

```bash
# Terminal 1
./scripts/run_backend.sh

# Access API at http://localhost:8000
# API docs at http://localhost:8000/docs
```

The backend will:

- Load `artifacts/xgb_baseline.joblib` on startup
- Use trained model for real predictions
- Generate alerts with actual ML confidence scores

### Start Frontend

```bash
# Terminal 2
./scripts/run_frontend.sh

# Access dashboard at http://localhost:8501
```

---

## 🔧 Troubleshooting

### Issue: "No processed data found"

**Solution:** Run preprocessing first

```bash
./scripts/preprocess.sh
```

### Issue: "GPU not detected"

**Cause:** CUDA not installed or misconfigured

**Solutions:**

1. Check CUDA: `nvcc --version`
2. Install CUDA Toolkit: https://developer.nvidia.com/cuda-downloads
3. XGBoost will fall back to CPU automatically

### Issue: "Missing features in dataset"

**Cause:** Raw data columns don't match expected features

**Solution:**

1. Edit `pipeline.py` → `engineer_features()` function
2. Map your dataset's columns to `schemas.FEATURES`

Example:

```python
def engineer_features(df):
    # Your dataset has 'Duration' → map to 'flow_duration'
    df['flow_duration'] = df['Duration']

    # Calculate pkt_rate
    df['pkt_rate'] = df['TotalPackets'] / (df['Duration'] + 1e-6)

    # ... map all other features
    return df
```

### Issue: "Invalid labels found"

**Cause:** Dataset labels don't match `schemas.LABELS`

**Solution:**

1. Edit `pipeline.py` → `map_labels()` function
2. Create mapping dictionary

Example:

```python
def map_labels(df):
    label_mapping = {
        "BENIGN": "BENIGN",
        "DoS Hulk": "DDoS_SYN",
        "DDoS": "DDoS_UDP",
        "FTP-Patator": "BRUTE_FTP",
        "PortScan": "SCAN_PORT",
    }

    df["label"] = df["Label"].map(label_mapping)
    df = df.dropna(subset=["label"])  # Remove unmapped labels
    return df
```

### Issue: SMOTE fails with "not enough neighbors"

**Cause:** Very small minority class

**Solutions:**

1. Disable SMOTE: `--no-smote` flag
2. Reduce `k_neighbors` in `pipeline.py`
3. Undersample majority class instead

---

## 📈 Performance Optimization

### GPU Memory Usage

Monitor GPU during training:

```bash
watch -n 1 nvidia-smi
```

If GPU runs out of memory:

1. Reduce batch size in XGBoost
2. Use smaller `n_estimators` (e.g., 100 instead of 200)
3. Reduce `max_depth` (e.g., 6 instead of 8)

### Training Speed Tips

**Faster preprocessing:**

- Use Parquet instead of CSV (5-10x faster)
- Sample large datasets for initial testing
- Disable SMOTE if not needed

**Faster training:**

- Use GPU (`tree_method='gpu_hist'`)
- Enable early stopping
- Reduce `n_estimators` for experimentation

### Memory-Efficient Training

For large datasets (>10GB):

```python
# In xgb_baseline.py, use chunked loading
def load_dataset_chunked(chunk_size=100000):
    chunks = pd.read_csv('large_file.csv', chunksize=chunk_size)
    # Process chunks iteratively
```

---

## 🎯 Expected Performance

### Target Metrics (After Iteration 2)

Based on CICIDS2017 dataset:

| Model               | F1-Score      | Precision     | Recall        | ROC-AUC       | Training Time (GPU) |
| ------------------- | ------------- | ------------- | ------------- | ------------- | ------------------- |
| Logistic Regression | 0.75-0.80     | 0.76-0.81     | 0.74-0.79     | 0.82-0.87     | ~30s                |
| Random Forest       | 0.82-0.87     | 0.83-0.88     | 0.81-0.86     | 0.88-0.93     | ~3 min              |
| **XGBoost**         | **0.88-0.93** | **0.89-0.94** | **0.87-0.92** | **0.92-0.97** | **~2 min**          |

### Per-Attack Performance

Typical F1-scores for each attack type:

- **BENIGN**: 0.95+ (high precision, good recall)
- **DDoS_SYN**: 0.88-0.92 (clear pattern, well-detected)
- **DDoS_UDP**: 0.86-0.90 (similar to SYN flood)
- **BRUTE_FTP**: 0.82-0.87 (slower, harder to detect)
- **SCAN_PORT**: 0.85-0.90 (distinctive pattern)
- **MITM_ARP**: 0.88-0.93 (clear network anomaly)

---

## 📝 Next Steps

After successful training:

1. **Validate Model**

   - Review confusion matrix
   - Check per-class F1-scores
   - Inspect SHAP feature importance

2. **Test Inference**

   - Start backend with trained model
   - Verify alerts use real predictions
   - Check confidence scores are accurate

3. **Deploy to Production**

   - Add authentication
   - Connect to real network sensors
   - Set up database for persistent storage

4. **Monitor & Retrain**
   - Collect production data
   - Detect model drift
   - Retrain periodically with new data

---

## 🔗 References

- **XGBoost GPU Training:** https://xgboost.readthedocs.io/en/latest/gpu/
- **SHAP Documentation:** https://shap.readthedocs.io/
- **CICIDS2017 Dataset:** https://www.unb.ca/cic/datasets/ids-2017.html
- **SMOTE for Imbalanced Data:** https://imbalanced-learn.org/stable/

---

**Last Updated:** November 2025  
**Iteration:** 2 (Real Dataset Training + GPU Acceleration)
