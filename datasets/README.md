# 📊 Aegis IDS - Datasets Directory

This directory contains raw and processed datasets for training the Aegis IDS models.

---

## 📁 Directory Structure

```
datasets/
  ├── raw/              # Raw, unprocessed datasets (you provide these)
  ├── processed/        # Preprocessed, ready-for-training data (auto-generated)
  └── index.yaml        # Dataset catalog
```

---

## 🔽 Step 1: Place Raw Datasets

Place your intrusion detection datasets in `datasets/raw/`:

### **Supported Formats:**

- CSV (`.csv`, `.csv.gz`)
- Parquet (`.parquet`)

### **Example Structure:**

```
datasets/raw/
  ├── cicids2017.csv
  ├── cic-ddos2019.csv
  ├── nsl-kdd.parquet
  └── custom_dataset/
      └── data.csv
```

---

## ⚙️ Step 2: Run Preprocessing

The preprocessing pipeline will:

1. Load raw data from `datasets/raw/`
2. Engineer features
3. Map labels
4. Clean data
5. Split into train/val/test
6. Normalize features
7. Apply SMOTE (optional)
8. Save to `datasets/processed/`

### **Run Preprocessing:**

```bash
# Method 1: Using script
./scripts/preprocess.sh

# Method 2: Direct command
python -m backend.ids.data_pipeline.pipeline --dataset cicids2017

# Method 3: Without SMOTE
python -m backend.ids.data_pipeline.pipeline --dataset cicids2017 --no-smote
```

---

## 📤 Step 3: Processed Output

After preprocessing, you'll find:

```
datasets/processed/
  ├── train.parquet      # 70% of data, normalized, balanced
  ├── val.parquet        # 15% of data, normalized
  ├── test.parquet       # 15% of data, normalized
  └── metadata.json      # Statistics and configuration
```

### **Metadata Contents:**

```json
{
  "dataset_name": "cicids2017",
  "features": [...list of 16 features...],
  "labels": ["BENIGN", "DDoS_SYN", "DDoS_UDP", "BRUTE_FTP", "SCAN_PORT", "MITM_ARP"],
  "label_distribution": {
    "train": {"BENIGN": 50000, "DDoS_SYN": 15000, ...},
    "val": {...},
    "test": {...}
  },
  "sizes": {
    "train": 150000,
    "val": 30000,
    "test": 30000,
    "total": 210000
  },
  "preprocessing": {
    "normalization": "StandardScaler",
    "imbalance_handling": "SMOTE",
    "random_state": 42
  }
}
```

---

## 🎯 Required Features

Your dataset must contain (or be engineered to produce) these 16 features:

1. `flow_duration` - Total connection duration (seconds)
2. `pkt_rate` - Packets per second
3. `syn_ratio` - Ratio of SYN packets to total packets
4. `byte_rate` - Bytes per second
5. `avg_pkt_size` - Average packet size
6. `fwd_pkt_count` - Forward packets count
7. `bwd_pkt_count` - Backward packets count
8. `fwd_byte_rate` - Forward bytes per second
9. `bwd_byte_rate` - Backward bytes per second
10. `tcp_flags_ratio` - TCP flags ratio
11. `unique_dst_ports` - Number of unique destination ports
12. `unique_dst_ips` - Number of unique destination IPs
13. `tcp_window_avg` - Average TCP window size
14. `ttl_avg` - Average time-to-live
15. `iat_mean` - Mean inter-arrival time
16. `pkt_size_std` - Standard deviation of packet sizes

**Defined in:** `backend/ids/schemas.py`

---

## 🏷️ Required Labels

Your dataset labels must map to one of these canonical labels:

- `BENIGN` - Normal traffic
- `DDoS_SYN` - SYN flood attacks
- `DDoS_UDP` - UDP flood attacks
- `BRUTE_FTP` - Brute force attacks (FTP/SSH/authentication)
- `SCAN_PORT` - Port scanning / reconnaissance
- `MITM_ARP` - Man-in-the-middle / ARP spoofing

**Defined in:** `backend/ids/schemas.py`

---

## 🔧 Customization

If your dataset has different columns or labels, edit:

**`backend/ids/data_pipeline/pipeline.py`**

### **1. Feature Engineering** (Line ~95)

```python
def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    # Map your columns to required features
    df['flow_duration'] = df['YourDurationColumn']
    df['pkt_rate'] = df['YourPacketsColumn'] / (df['YourDurationColumn'] + 1e-6)
    # ... map all 16 features
    return df
```

### **2. Label Mapping** (Line ~140)

```python
def map_labels(df: pd.DataFrame, label_column: str = "Label") -> pd.DataFrame:
    label_mapping = {
        "YourBenignLabel": "BENIGN",
        "YourDDoSLabel": "DDoS_SYN",
        "YourPortScanLabel": "SCAN_PORT",
        # ... map all attack types
    }
    df["label"] = df[label_column].map(label_mapping)
    return df
```

---

## 📚 Popular Datasets

### **CICIDS2017**

- **Source:** https://www.unb.ca/cic/datasets/ids-2017.html
- **Size:** 2.8M flows
- **Attacks:** DoS, DDoS, Brute Force, Web Attacks, Infiltration, PortScan, Botnet
- **Format:** CSV

### **CIC-DDoS2019**

- **Source:** https://www.unb.ca/cic/datasets/ddos-2019.html
- **Size:** 13M flows
- **Attacks:** Multiple DDoS attack types
- **Format:** CSV

### **NSL-KDD**

- **Source:** https://www.unb.ca/cic/datasets/nsl.html
- **Size:** 148,000 flows
- **Attacks:** DoS, R2L, U2R, Probe
- **Format:** CSV

---

## ⚠️ Important Notes

1. **Do NOT commit raw datasets to Git** (they're in `.gitignore`)
2. **Processed data is also ignored** (regenerate on each machine)
3. **Keep `metadata.json`** - useful for debugging
4. **Large files** - Use Git LFS or download separately

---

## 🐛 Troubleshooting

### **Error: "No processed data found"**

- Run preprocessing first: `./scripts/preprocess.sh`

### **Error: "Missing features in dataset"**

- Edit `pipeline.py` → `engineer_features()` function
- Map your columns to required features

### **Error: "Invalid labels found"**

- Edit `pipeline.py` → `map_labels()` function
- Map your labels to canonical labels

### **SMOTE fails**

- Disable SMOTE: `--no-smote` flag
- Or reduce minority class threshold in `pipeline.py`

---

## 📊 Example: CICIDS2017

### **1. Download Dataset**

```bash
# Download from official source
wget https://www.unb.ca/cic/datasets/ids-2017.html

# Extract to datasets/raw/
unzip cicids2017.zip -d datasets/raw/
```

### **2. Check Columns**

```python
import pandas as pd
df = pd.read_csv('datasets/raw/cicids2017.csv')
print(df.columns)
# Output: ['Destination Port', 'Flow Duration', 'Total Fwd Packets', 'Label', ...]
```

### **3. Customize Pipeline**

```python
# In pipeline.py
def engineer_features(df):
    df['flow_duration'] = df['Flow Duration'] / 1_000_000  # Convert microseconds to seconds
    df['pkt_rate'] = df['Total Fwd Packets'] / (df['flow_duration'] + 1e-6)
    # ... continue mapping
    return df

def map_labels(df):
    mapping = {
        'BENIGN': 'BENIGN',
        'DoS Hulk': 'DDoS_SYN',
        'PortScan': 'SCAN_PORT',
        # ... continue mapping
    }
    df['label'] = df['Label'].map(mapping)
    return df.dropna(subset=['label'])
```

### **4. Run Preprocessing**

```bash
python -m backend.ids.data_pipeline.pipeline --dataset cicids2017
```

---

**Ready to process your datasets! 🚀**
