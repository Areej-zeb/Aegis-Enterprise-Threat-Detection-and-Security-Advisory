"""Debug exactly where we're losing data in preprocessing"""
import pandas as pd
import numpy as np
from glob import glob

print("="*80)
print("DETAILED DATA LOSS ANALYSIS")
print("="*80)

# Load ALL stateless files
attack_files = glob("datasets/raw/CIC-Bell-DNS-EXF-2021/Attack_heavy_Benign/Attacks/stateless*.csv")
benign_files = glob("datasets/raw/CIC-Bell-DNS-EXF-2021/Attack_heavy_Benign/Benign/stateless*.csv")
attack_files += glob("datasets/raw/CIC-Bell-DNS-EXF-2021/Attack_Light_Benign/Attacks/stateless*.csv")
benign_files += glob("datasets/raw/CIC-Bell-DNS-EXF-2021/Attack_Light_Benign/Benign/stateless*.csv")
benign_files += glob("datasets/raw/CIC-Bell-DNS-EXF-2021/Benign/stateless*.csv")

print(f"\nFound {len(attack_files)} attack files")
print(f"Found {len(benign_files)} benign files")

# Load all
all_dfs = []
for f in attack_files:
    df = pd.read_csv(f)
    df['label'] = 'DNS_EXFILTRATION'
    all_dfs.append(df)
    print(f"Attack: {f.split('/')[-1]}: {len(df)} rows")

for f in benign_files:
    df = pd.read_csv(f)
    df['label'] = 'BENIGN'
    all_dfs.append(df)
    print(f"Benign: {f.split('/')[-1]}: {len(df)} rows")

df = pd.concat(all_dfs, ignore_index=True)
print(f"\n1. Initial load: {len(df):,} rows")

# Drop timestamp
if 'timestamp' in df.columns:
    df = df.drop('timestamp', axis=1)
print(f"2. After drop timestamp: {len(df):,} rows")

# Select 7 features
keep_cols = ["numeric", "special", "labels", "subdomain_length", "FQDN_count", "lower", "entropy", "label"]
df = df[keep_cols]
print(f"3. After selecting 7 features + label: {len(df):,} rows")

# Convert to numeric (this is where pipeline does it)
feature_cols = [c for c in keep_cols if c != 'label']
for col in feature_cols:
    if df[col].dtype == 'object':
        print(f"   Converting {col} from object to numeric...")
        df[col] = pd.to_numeric(df[col], errors='coerce')

print(f"4. After numeric conversion: {len(df):,} rows")

# Check NaN
nan_count = df[feature_cols].isnull().sum().sum()
rows_with_nan = df[feature_cols].isnull().any(axis=1).sum()
print(f"5. NaN values: {nan_count:,} total")
print(f"   Rows with NaN: {rows_with_nan:,} ({100*rows_with_nan/len(df):.1f}%)")

df_no_nan = df.dropna()
print(f"6. After dropna: {len(df_no_nan):,} rows")

# Check inf
numeric_cols = df_no_nan[feature_cols].select_dtypes(include=[np.number]).columns
df_no_nan[numeric_cols] = df_no_nan[numeric_cols].replace([np.inf, -np.inf], np.nan)
rows_with_inf = df_no_nan.isnull().any(axis=1).sum()
print(f"7. Rows with inf: {rows_with_inf:,}")

df_no_inf = df_no_nan.dropna()
print(f"8. After removing inf: {len(df_no_inf):,} rows")

# Check duplicates
dups = df_no_inf.duplicated().sum()
print(f"9. Duplicate rows: {dups:,} ({100*dups/len(df_no_inf):.1f}%)")

df_final = df_no_inf.drop_duplicates()
print(f"10. After drop_duplicates: {len(df_final):,} rows")

print(f"\n{'='*80}")
print(f"SUMMARY:")
print(f"  Started with:  {len(df):,}")
print(f"  Final:         {len(df_final):,}")
print(f"  Loss:          {len(df) - len(df_final):,} ({100*(len(df)-len(df_final))/len(df):.1f}%)")
print(f"{'='*80}")

# Show label distribution
print(f"\nFinal label distribution:")
print(df_final['label'].value_counts())
