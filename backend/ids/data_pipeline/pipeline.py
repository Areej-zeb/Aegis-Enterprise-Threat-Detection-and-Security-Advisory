import pandas as pd
from pathlib import Path
import random, os

DATASETS = ["CICIDS2017", "CIC-DDoS2019", "MITM_ARP"]
BASE = Path(__file__).resolve().parents[2] / "datasets" / "processed"
BASE.mkdir(parents=True, exist_ok=True)

def preprocess_dataset(name):
    print(f"▶ Processing {name}...")
    df = pd.DataFrame({
        "flow_duration": [random.uniform(10,1000) for _ in range(50)],
        "pkt_rate": [random.uniform(0.1,10) for _ in range(50)],
        "byte_rate": [random.uniform(100,5000) for _ in range(50)],
        "label": [random.choice(["BENIGN","DDoS_SYN","SCAN_PORT"]) for _ in range(50)]
    })
    df.to_parquet(BASE / f"{name}.parquet", index=False)

if __name__ == "__main__":
    for d in DATASETS:
        preprocess_dataset(d)
    print("✅ Dummy processed datasets ready.")
