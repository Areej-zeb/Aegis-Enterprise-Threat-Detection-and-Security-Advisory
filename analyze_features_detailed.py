import pandas as pd
import numpy as np

# Load training data
train = pd.read_parquet('datasets/processed/dns_stateless/train.parquet')

print('='*80)
print('DNS STATELESS FEATURE ANALYSIS')
print('='*80)

benign = train[train['label'] == 'BENIGN']
attack = train[train['label'] == 'DNS_EXFILTRATION']

print(f'\nSample sizes:')
print(f'  BENIGN: {len(benign):,}')
print(f'  DNS_EXFILTRATION: {len(attack):,}')

features = [col for col in train.columns if col != 'label']

print(f'\nFeature Statistics (mean ± std):')
print(f'{"Feature":<20} {"BENIGN":<25} {"DNS_EXFILTRATION":<25} {"Separability"}')
print('-'*90)

for feat in features:
    b_mean, b_std = benign[feat].mean(), benign[feat].std()
    a_mean, a_std = attack[feat].mean(), attack[feat].std()
    
    # Effect size (Cohen's d)
    pooled_std = np.sqrt((b_std**2 + a_std**2) / 2)
    if pooled_std > 0:
        effect_size = abs(b_mean - a_mean) / pooled_std
    else:
        effect_size = 0
    
    # Determine separability
    if effect_size > 1.5:
        sep = "✅ EXCELLENT"
    elif effect_size > 0.8:
        sep = "✓ GOOD"
    elif effect_size > 0.5:
        sep = "~ MODERATE"
    elif effect_size > 0.2:
        sep = "⚠️ WEAK"
    else:
        sep = "❌ TERRIBLE"
    
    print(f'{feat:<20} {b_mean:8.3f} ± {b_std:6.3f}   {a_mean:8.3f} ± {a_std:6.3f}   {effect_size:.3f} {sep}')

print('\n')
print('Effect Size Guide:')
print('  > 1.5: Excellent separation (classes well separated)')
print('  > 0.8: Good separation (classes distinguishable)')
print('  > 0.5: Moderate separation (some overlap)')
print('  > 0.2: Weak separation (heavy overlap)')
print('  < 0.2: Terrible separation (nearly identical distributions)')
print('='*80)

# Check for feature correlation
print('\nFeature Correlation Matrix:')
print(train[features].corr().round(2))
