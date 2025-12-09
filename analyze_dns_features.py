"""
Analyze DNS dataset features to identify important ones for attack detection
"""
import pandas as pd
import numpy as np
from pathlib import Path
from glob import glob

# Load samples from both attack and benign
print("="*80)
print("DNS FEATURE ANALYSIS")
print("="*80)

# Stateless features
print("\n📊 STATELESS FEATURES ANALYSIS\n")
attack_files = glob("datasets/raw/CIC-Bell-DNS-EXF-2021/Attack_heavy_Benign/Attacks/stateless*.csv")
benign_files = glob("datasets/raw/CIC-Bell-DNS-EXF-2021/Attack_heavy_Benign/Benign/stateless*.csv")

attack_df = pd.concat([pd.read_csv(f).head(1000) for f in attack_files[:2]])
benign_df = pd.concat([pd.read_csv(f).head(1000) for f in benign_files[:1]])

attack_df = attack_df.drop('timestamp', axis=1, errors='ignore')
benign_df = benign_df.drop('timestamp', axis=1, errors='ignore')

# Remove string columns that can't be used for ML
string_cols = ['longest_word', 'sld', 'subdomain']
for col in string_cols:
    attack_df = attack_df.drop(col, axis=1, errors='ignore')
    benign_df = benign_df.drop(col, axis=1, errors='ignore')

# Convert remaining to numeric
for col in attack_df.columns:
    attack_df[col] = pd.to_numeric(attack_df[col], errors='coerce')
    benign_df[col] = pd.to_numeric(benign_df[col], errors='coerce')

attack_df = attack_df.dropna()
benign_df = benign_df.dropna()

print(f"Attack samples: {len(attack_df)}")
print(f"Benign samples: {len(benign_df)}")

print("\n📈 Feature Statistics (Attack vs Benign Mean):")
print("-" * 80)
for col in attack_df.columns:
    attack_mean = attack_df[col].mean()
    benign_mean = benign_df[col].mean()
    attack_std = attack_df[col].std()
    benign_std = benign_df[col].std()
    
    # Calculate discriminative power (difference / pooled std)
    pooled_std = np.sqrt((attack_std**2 + benign_std**2) / 2)
    if pooled_std > 0:
        discriminative = abs(attack_mean - benign_mean) / pooled_std
    else:
        discriminative = 0
    
    print(f"{col:20s} | Attack: {attack_mean:10.2f} ± {attack_std:8.2f} | Benign: {benign_mean:10.2f} ± {benign_std:8.2f} | Score: {discriminative:6.3f}")

print("\n🎯 TOP DISCRIMINATIVE STATELESS FEATURES:")
discriminative_scores = {}
for col in attack_df.columns:
    attack_mean = attack_df[col].mean()
    benign_mean = benign_df[col].mean()
    attack_std = attack_df[col].std()
    benign_std = benign_df[col].std()
    pooled_std = np.sqrt((attack_std**2 + benign_std**2) / 2)
    if pooled_std > 0:
        discriminative_scores[col] = abs(attack_mean - benign_mean) / pooled_std

top_features = sorted(discriminative_scores.items(), key=lambda x: x[1], reverse=True)
for feat, score in top_features[:10]:
    print(f"  {feat:20s}: {score:.3f}")

# Stateful features
print("\n\n📊 STATEFUL FEATURES ANALYSIS\n")
attack_files = glob("datasets/raw/CIC-Bell-DNS-EXF-2021/Attack_heavy_Benign/Attacks/stateful*.csv")
benign_files = glob("datasets/raw/CIC-Bell-DNS-EXF-2021/Attack_heavy_Benign/Benign/stateful*.csv")

attack_df = pd.concat([pd.read_csv(f).head(1000) for f in attack_files[:2]])
benign_df = pd.concat([pd.read_csv(f).head(1000) for f in benign_files[:1]])

# Remove non-numeric columns
for col in ['rr', 'rr_type', 'timestamp', 'unique_country', 'unique_asn', 'reverse_dns']:
    attack_df = attack_df.drop(col, axis=1, errors='ignore')
    benign_df = benign_df.drop(col, axis=1, errors='ignore')

# Convert remaining to numeric
for col in attack_df.columns:
    attack_df[col] = pd.to_numeric(attack_df[col], errors='coerce')
    benign_df[col] = pd.to_numeric(benign_df[col], errors='coerce')

attack_df = attack_df.dropna()
benign_df = benign_df.dropna()

print(f"Attack samples: {len(attack_df)}")
print(f"Benign samples: {len(benign_df)}")

print("\n📈 Feature Statistics (Attack vs Benign Mean):")
print("-" * 80)
for col in attack_df.columns:
    attack_mean = attack_df[col].mean()
    benign_mean = benign_df[col].mean()
    attack_std = attack_df[col].std()
    benign_std = benign_df[col].std()
    
    pooled_std = np.sqrt((attack_std**2 + benign_std**2) / 2)
    if pooled_std > 0:
        discriminative = abs(attack_mean - benign_mean) / pooled_std
    else:
        discriminative = 0
    
    print(f"{col:20s} | Attack: {attack_mean:10.2f} ± {attack_std:8.2f} | Benign: {benign_mean:10.2f} ± {benign_std:8.2f} | Score: {discriminative:6.3f}")

print("\n🎯 TOP DISCRIMINATIVE STATEFUL FEATURES:")
discriminative_scores = {}
for col in attack_df.columns:
    attack_mean = attack_df[col].mean()
    benign_mean = benign_df[col].mean()
    attack_std = attack_df[col].std()
    benign_std = benign_df[col].std()
    pooled_std = np.sqrt((attack_std**2 + benign_std**2) / 2)
    if pooled_std > 0:
        discriminative_scores[col] = abs(attack_mean - benign_mean) / pooled_std

top_features = sorted(discriminative_scores.items(), key=lambda x: x[1], reverse=True)
for feat, score in top_features[:10]:
    print(f"  {feat:20s}: {score:.3f}")

print("\n" + "="*80)
print("RECOMMENDATION: Keep features with discriminative score > 0.5")
print("="*80)
