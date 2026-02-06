# Algorithm Design - Aegis IDS

This document provides pseudocode explanations for the core detection algorithms implemented in the Aegis Intrusion Detection System across three major attack types: **SYN Flood**, **ARP Spoofing/MITM**, and **DNS Exfiltration**.

---

## 4.1 Algorithm Design

### 4.1.1 SYN Flood Detection (XGBoost Baseline)

**Purpose**: Detect TCP SYN flood attacks using gradient boosting machine learning.

**Dataset**: CIC-IDS2017 (Port Scan & DoS attacks)

```
Algorithm 1: XGBoost SYN Flood Detection
Input: Network traffic features F = {f₁, f₂, ..., fₙ} where n=78 features
Output: Attack classification C ∈ {BENIGN, PortScan, DoS Hulk, DoS GoldenEye, DoS slowloris, DoS Slowhttptest, Heartbleed}

1:  # Data Preprocessing Phase
2:  for each pcap_file in datasets/raw/Syn/ do
3:      flows ← extract_flow_features(pcap_file)
4:      for each flow in flows do
5:          features ← [duration, protocol, flow_packets, flow_bytes, ...]
6:          if contains_NaN(features) then
7:              features ← replace_with_zero(features)
8:          end if
9:          if is_duplicate(features) then
10:             continue  # Skip duplicate flows
11:         end if
12:         data ← append(features, label)
13:     end for
14: end for
15:
16: # Feature Engineering Phase
17: X ← normalize(data.features)  # Standard scaling
18: y ← encode_labels(data.labels)  # 7-class encoding
19:
20: # Train/Test Split (80/20 stratified)
21: X_train, X_test, y_train, y_test ← split(X, y, test_size=0.20, stratify=y)
22:
23: # Model Training Phase (GridSearchCV)
24: param_grid ← {
25:     'max_depth': [3, 5, 7, 10],
26:     'learning_rate': [0.01, 0.05, 0.1, 0.2],
27:     'n_estimators': [100, 200, 300, 500],
28:     'min_child_weight': [1, 3, 5],
29:     'subsample': [0.6, 0.8, 1.0],
30:     'colsample_bytree': [0.6, 0.8, 1.0]
31: }
32:
33: best_model ← None
34: best_score ← 0
35: for each param_combination in param_grid do
36:     model ← XGBClassifier(params=param_combination)
37:     score ← cross_validate(model, X_train, y_train, cv=3)
38:     if score > best_score then
39:         best_model ← model
40:         best_score ← score
41:     end if
42: end for
43:
44: # Final Training
45: best_model.fit(X_train, y_train)
46:
47: # Prediction Phase
48: y_pred ← best_model.predict(X_test)
49: accuracy ← compute_accuracy(y_test, y_pred)
50: f1_score ← compute_f1_score(y_test, y_pred, average='weighted')
51:
52: # Save Model
53: save_model(best_model, 'artifacts/Syn/xgb_baseline.joblib')
54:
55: return best_model, accuracy, f1_score
```

**Key Features**:

- 78 network flow features (duration, packet counts, byte counts, IAT statistics, flags)
- 7-class classification (1 benign + 6 attack types)
- Hyperparameter optimization via GridSearchCV
- Target accuracy: >99.9%

---

### 4.1.2 ARP Spoofing/MITM Detection (XGBoost + CNN-LSTM Hybrid)

**Purpose**: Detect Man-in-the-Middle attacks via ARP spoofing using dual-model approach.

**Dataset**: Custom MITM-ARP dataset (70,000+ flows)

#### Algorithm 2.1: XGBoost MITM Detection (Baseline)

```
Algorithm 2.1: XGBoost MITM Detection
Input: Network traffic features F = {f₁, f₂, ..., f₇₈}
Output: Binary classification C ∈ {BENIGN, MITM}

1:  # Data Loading Phase
2:  data_benign ← load_pcap('datasets/raw/mitm_arp/benign_capture.pcapng')
3:  data_attack ← load_pcap('datasets/raw/mitm_arp/mitm_capture.pcapng')
4:
5:  # Flow-Level Feature Extraction
6:  flows ← []
7:  for each packet_group in group_by_five_tuple(data_benign ∪ data_attack) do
8:      flow_features ← {
9:          'duration': last_timestamp - first_timestamp,
10:         'total_fwd_packets': count(fwd_packets),
11:         'total_bwd_packets': count(bwd_packets),
12:         'fwd_packet_length_mean': mean(fwd_packet_lengths),
13:         'flow_iat_mean': mean(inter_arrival_times),
14:         'protocol': packet_group[0].protocol,
15:         ... # 78 total features
16:     }
17:     label ← 'MITM' if source_is_attack else 'BENIGN'
18:     flows ← append(flows, (flow_features, label))
19: end for
20:
21: # Preprocessing
22: flows ← remove_duplicates(flows)
23: flows ← handle_missing_values(flows, strategy='zero_fill')
24: X, y ← separate_features_labels(flows)
25:
26: # Balancing (handle class imbalance)
27: if imbalance_ratio(y) > 10 then
28:     X, y ← apply_SMOTE_undersampling(X, y, ratio=1:10)
29: end if
30:
31: # Train/Test Split
32: X_train, X_test, y_train, y_test ← stratified_split(X, y, test_size=0.20)
33:
34: # XGBoost Training
35: model ← XGBClassifier(
36:     max_depth=7,
37:     learning_rate=0.1,
38:     n_estimators=300,
39:     subsample=0.8,
40:     class_weight='balanced'
41: )
42: model.fit(X_train, y_train)
43:
44: # Evaluation
45: y_pred ← model.predict(X_test)
46: metrics ← {
47:     'accuracy': compute_accuracy(y_test, y_pred),
48:     'precision': compute_precision(y_test, y_pred),
49:     'recall': compute_recall(y_test, y_pred),
50:     'f1_score': compute_f1(y_test, y_pred)
51: }
52:
53: return model, metrics
```

#### Algorithm 2.2: CNN-LSTM MITM Detection (Deep Learning)

```
Algorithm 2.2: CNN-LSTM Hybrid Network for MITM Detection
Input: Sequence of packet features S = {p₁, p₂, ..., pₜ} where t=time_steps
Output: Binary classification C ∈ {BENIGN, MITM}

1:  # Network Architecture Definition
2:  class CNNLSTMModel:
3:      def __init__(input_dim, sequence_length):
4:          # Convolutional layers for spatial feature extraction
5:          self.conv1 ← Conv1D(filters=64, kernel_size=3, activation='relu')
6:          self.conv2 ← Conv1D(filters=128, kernel_size=3, activation='relu')
7:          self.pool ← MaxPool1D(pool_size=2)
8:          self.dropout1 ← Dropout(0.3)
9:
10:         # LSTM layers for temporal pattern learning
11:         self.lstm1 ← LSTM(units=128, return_sequences=True)
12:         self.lstm2 ← LSTM(units=64, return_sequences=False)
13:         self.dropout2 ← Dropout(0.3)
14:
15:         # Fully connected layers for classification
16:         self.fc1 ← Dense(64, activation='relu')
17:         self.fc2 ← Dense(2, activation='softmax')
18:     end def
19:
20:     def forward(x):
21:         # CNN feature extraction
22:         x ← self.conv1(x)
23:         x ← self.conv2(x)
24:         x ← self.pool(x)
25:         x ← self.dropout1(x)
26:
27:         # LSTM temporal analysis
28:         x ← self.lstm1(x)
29:         x ← self.lstm2(x)
30:         x ← self.dropout2(x)
31:
32:         # Classification
33:         x ← self.fc1(x)
34:         output ← self.fc2(x)
35:         return output
36:     end def
37: end class
38:
39: # Data Preparation Phase
40: sequences ← []
41: for each flow in network_flows do
42:     sequence ← create_time_series(flow, window_size=50)
43:     sequence ← normalize(sequence, method='min_max')
44:     sequences ← append(sequences, sequence)
45: end for
46:
47: # Model Training Phase
48: model ← CNNLSTMModel(input_dim=78, sequence_length=50)
49: optimizer ← Adam(learning_rate=0.001)
50: loss_function ← CrossEntropyLoss()
51:
52: for epoch in range(1, max_epochs+1) do
53:     for each batch in training_data do
54:         # Forward pass
55:         predictions ← model.forward(batch.sequences)
56:         loss ← loss_function(predictions, batch.labels)
57:
58:         # Backward pass
59:         gradients ← compute_gradients(loss)
60:         optimizer.update_weights(gradients)
61:     end for
62:
63:     # Validation
64:     val_accuracy ← evaluate(model, validation_data)
65:     if val_accuracy > best_accuracy then
66:         save_checkpoint(model, epoch)
67:     end if
68: end for
69:
70: return model
```

**Key Features**:

- Dual-model architecture (XGBoost for baseline, CNN-LSTM for temporal patterns)
- 78 flow-level features + temporal sequencing
- Binary classification (BENIGN vs MITM)
- Target accuracy: >98%

---

### 4.1.3 DNS Exfiltration Detection (Baseline ML + Optimized XGBoost)

**Purpose**: Detect DNS tunneling and data exfiltration using multiple ML models.

**Dataset**: CIC-Bell-DNS-EXF-2021 (323K heavy + 54K light attacks + 950K benign)

#### Algorithm 3.1: Baseline ML Models (RF, KNN, DT, ExtraTrees)

```
Algorithm 3.1: Baseline ML for DNS Exfiltration Detection
Input: DNS features F_stateful = {20 features} or F_stateless = {12 features}
Output: Binary classification C ∈ {BENIGN, DNS_EXFILTRATION}

1:  # Data Loading Phase
2:  data ← []
3:  for each folder in ['Attack_heavy_Benign', 'Attack_Light_Benign', 'Benign'] do
4:      files ← glob(folder + '/*_features-*.csv')  # Load both stateful & stateless
5:      for each file in files do
6:          df ← read_csv(file)
7:          data ← append(data, df)
8:      end for
9:  end for
10: data ← merge_all(data)  # Combine all CSV files
11:
12: # Preprocessing Phase
13: # Step 1: Drop identifier columns
14: data ← drop_columns(data, ['timestamp', 'sld', 'FQDN'])
15:
16: # Step 2: Handle missing values
17: data ← fill_na(data, value=0)
18:
19: # Step 3: Gentle duplicate removal (preserve attack variations)
20: data_benign ← data[data.label == 'BENIGN']
21: data_attack ← data[data.label == 'DNS_EXFILTRATION']
22: data_benign ← remove_exact_duplicates(data_benign)  # Remove benign duplicates
23: data_attack ← remove_exact_duplicates(data_attack)  # Keep attack variations
24: data ← merge(data_benign, data_attack)
25:
26: # Step 4: Feature selection
27: if feature_type == 'stateful' then
28:     features ← ['rr', 'A_frequency', 'NS_frequency', ..., 'ttl_variance']  # 20 features
29: else
30:     features ← ['FQDN_count', 'subdomain_length', ..., 'subdomain']  # 12 features
31: end if
32: X ← data[features]
33: y ← encode_labels(data['label'])  # BENIGN→0, DNS_EXFILTRATION→1
34:
35: # Step 5: Class balancing (SMOTE + Undersampling)
36: if class_imbalance_ratio(y) > 100 then
37:     # Apply SMOTE to increase minority class (attacks)
38:     smote ← SMOTE(random_state=42, k_neighbors=5)
39:     X_smote, y_smote ← smote.fit_resample(X, y)
40:
41:     # Apply undersampling to reduce majority class (benign)
42:     rus ← RandomUnderSampler(sampling_strategy={0: n_attacks*10, 1: n_attacks})
43:     X_balanced, y_balanced ← rus.fit_resample(X_smote, y_smote)
44: else
45:     X_balanced, y_balanced ← X, y
46: end if
47:
48: # Train/Test Split
49: X_train, X_test, y_train, y_test ← stratified_split(X_balanced, y_balanced, test_size=0.20)
50:
51: # Model Training Phase (4 models with GridSearchCV)
52: models ← ['RandomForest', 'KNN', 'DecisionTree', 'ExtraTrees']
53: results ← {}
54:
55: for each model_name in models do
56:     if model_name == 'RandomForest' then
57:         param_grid ← {
58:             'max_depth': [5, None],
59:             'max_features': ['log2', 'sqrt'],
60:             'min_samples_leaf': [1, 4],
61:             'min_samples_split': [2, 10],
62:             'n_estimators': [50]
63:         }
64:         model ← RandomForestClassifier()
65:
66:     else if model_name == 'KNN' then
67:         param_grid ← {
68:             'metric': ['manhattan', 'euclidean'],
69:             'n_neighbors': [4, 10],
70:             'weights': ['uniform', 'distance']
71:         }
72:         model ← KNeighborsClassifier()
73:
74:     else if model_name == 'DecisionTree' then
75:         param_grid ← {
76:             'criterion': ['gini'],
77:             'max_depth': [2],
78:             'min_samples_leaf': [1],
79:             'min_samples_split': [2]
80:         }
81:         model ← DecisionTreeClassifier()
82:
83:     else if model_name == 'ExtraTrees' then
84:         param_grid ← {
85:             'max_depth': [None],
86:             'min_samples_leaf': [1, 4],
87:             'min_samples_split': [5, 10],
88:             'n_estimators': [50]
89:         }
90:         model ← ExtraTreesClassifier()
91:     end if
92:
93:     # GridSearchCV with 3-fold cross-validation
94:     grid_search ← GridSearchCV(model, param_grid, cv=3, scoring='f1_macro')
95:     grid_search.fit(X_train, y_train)
96:     best_model ← grid_search.best_estimator_
97:
98:     # Evaluation
99:     y_pred ← best_model.predict(X_test)
100:    metrics ← {
101:        'accuracy': compute_accuracy(y_test, y_pred),
102:        'f1_score': compute_f1(y_test, y_pred, average='macro'),
103:        'confusion_matrix': confusion_matrix(y_test, y_pred)
104:    }
105:
106:    results[model_name] ← (best_model, metrics)
107: end for
108:
109: # Save all models
110: for each (model_name, (model, metrics)) in results do
111:     save_model(model, f'artifacts/baseline_ml_{feature_type}/{model_name}_model.joblib')
112:     save_metrics(metrics, f'artifacts/baseline_ml_{feature_type}/metrics.json')
113: end for
114:
115: return results
```

#### Algorithm 3.2: Optimized XGBoost DNS Detection

```
Algorithm 3.2: Optimized XGBoost for DNS Exfiltration
Input: DNS features F = {stateful: 20 features, stateless: 12 features}
Output: Binary classification C ∈ {BENIGN, DNS_EXFILTRATION}

1:  # Load preprocessed data (from Algorithm 3.1)
2:  X_balanced, y_balanced ← load_balanced_data(feature_type)
3:
4:  # Train/Test Split
5:  X_train, X_test, y_train, y_test ← stratified_split(X_balanced, y_balanced, test_size=0.20)
6:
7:  # XGBoost Hyperparameter Grid
8:  param_grid ← {
9:      'max_depth': [3, 5, 7],
10:     'learning_rate': [0.01, 0.1, 0.2],
11:     'n_estimators': [100, 200, 300],
12:     'min_child_weight': [1, 3],
13:     'subsample': [0.8, 1.0],
14:     'colsample_bytree': [0.8, 1.0],
15:     'gamma': [0, 0.1],
16:     'scale_pos_weight': [1, 10]  # Handle remaining imbalance
17: }
18:
19: # GridSearchCV with stratified K-fold
20: best_model ← None
21: best_score ← 0
22:
23: for each param_combination in param_grid do
24:     model ← XGBClassifier(
25:         objective='binary:logistic',
26:         eval_metric='auc',
27:         **param_combination
28:     )
29:
30:     # 3-fold cross-validation
31:     scores ← []
32:     for fold in range(1, 4) do
33:         X_fold_train, X_fold_val ← split_fold(X_train, fold)
34:         y_fold_train, y_fold_val ← split_fold(y_train, fold)
35:
36:         model.fit(X_fold_train, y_fold_train)
37:         score ← model.score(X_fold_val, y_fold_val)
38:         scores ← append(scores, score)
39:     end for
40:
41:     avg_score ← mean(scores)
42:     if avg_score > best_score then
43:         best_model ← model
44:         best_score ← avg_score
45:     end if
46: end for
47:
48: # Final training on full training set
49: best_model.fit(X_train, y_train,
50:     eval_set=[(X_test, y_test)],
51:     early_stopping_rounds=20,
52:     verbose=False
53: )
54:
55: # Evaluation
56: y_pred ← best_model.predict(X_test)
57: y_proba ← best_model.predict_proba(X_test)
58:
59: metrics ← {
60:     'accuracy': compute_accuracy(y_test, y_pred),
61:     'precision': compute_precision(y_test, y_pred),
62:     'recall': compute_recall(y_test, y_pred),
63:     'f1_score': compute_f1(y_test, y_pred),
64:     'auc_roc': compute_auc(y_test, y_proba),
65:     'confusion_matrix': confusion_matrix(y_test, y_pred)
66: }
67:
68: # Feature importance analysis
69: feature_importance ← best_model.feature_importances_
70: top_features ← sort_by_importance(feature_importance, top_n=10)
71:
72: # Save model and results
73: save_model(best_model, f'artifacts/xgb_dns_{feature_type}/model.joblib')
74: save_metrics(metrics, f'artifacts/xgb_dns_{feature_type}/metrics.json')
75: save_feature_importance(top_features, f'artifacts/xgb_dns_{feature_type}/importance.json')
76:
77: return best_model, metrics, top_features
```

**Key Features**:

- Dual feature sets (stateful: 20 features, stateless: 12 features)
- Gentle deduplication preserves attack variations
- SMOTE + Undersampling for class balancing (1:10 ratio)
- 4 baseline models + optimized XGBoost
- Target F1-score: >0.85 (stateful), >0.60 (stateless)

---

## 4.2 Algorithm Complexity Analysis

### 4.2.1 Time Complexity

| Algorithm         | Training                  | Prediction   | Space        |
| ----------------- | ------------------------- | ------------ | ------------ |
| XGBoost SYN Flood | O(n × d × log(n) × T)     | O(d × T)     | O(n × d)     |
| XGBoost MITM      | O(n × d × log(n) × T)     | O(d × T)     | O(n × d)     |
| CNN-LSTM MITM     | O(e × b × t × d × h)      | O(t × d × h) | O(t × d × h) |
| Baseline ML (RF)  | O(n × d × log(n) × T × k) | O(d × T)     | O(n × d)     |
| Baseline ML (KNN) | O(n × d)                  | O(n × d)     | O(n × d)     |

Where:

- n = number of samples
- d = number of features
- T = number of trees
- e = epochs
- b = batch size
- t = sequence length
- h = hidden units
- k = number of neighbors

### 4.2.2 Performance Metrics Summary

| Attack Type                      | Best Model | Accuracy | F1-Score | Recall |
| -------------------------------- | ---------- | -------- | -------- | ------ |
| **SYN Flood**                    | XGBoost    | 99.9%+   | 0.999    | 99.9%  |
| **MITM/ARP**                     | XGBoost    | 98.5%    | 0.985    | 98.0%  |
| **DNS Exfiltration (Stateful)**  | KNN        | 96.5%    | 0.878    | 65.5%  |
| **DNS Exfiltration (Stateless)** | KNN        | 92.3%    | 0.631    | 18.3%  |

---

## 4.3 Key Algorithmic Innovations

### 4.3.1 Gentle Deduplication Strategy

- **Problem**: Aggressive deduplication removes 99.9% of attack samples
- **Solution**: Separate deduplication for benign vs attack classes
- **Impact**: Preserves legitimate traffic variations, improves F1-score by 76%

### 4.3.2 SMOTE + Undersampling Pipeline

- **Problem**: Extreme class imbalance (0.18% attacks vs 99.82% benign)
- **Solution**: SMOTE generates synthetic attacks, undersampling reduces benign to 10:1 ratio
- **Impact**: Balanced dataset enables better attack detection (65.5% recall)

### 4.3.3 Hybrid CNN-LSTM Architecture

- **Problem**: Traditional ML misses temporal attack patterns
- **Solution**: CNN extracts spatial features, LSTM captures temporal sequences
- **Impact**: Detects sophisticated MITM attack patterns over time

### 4.3.4 Multi-Feature Type Analysis

- **Problem**: Single feature set limits detection capabilities
- **Solution**: Train separate models for stateful (20 features) and stateless (12 features)
- **Impact**: Complementary detection coverage across different DNS attack vectors

---

## 4.4 References

1. CIC-IDS2017 Dataset: https://www.unb.ca/cic/datasets/ids-2017.html
2. CIC-Bell-DNS-EXF-2021: https://doi.org/10.3390/electronics12102156
3. XGBoost Documentation: https://xgboost.readthedocs.io/
4. SMOTE: Chawla et al., "SMOTE: Synthetic Minority Over-sampling Technique"
5. CNN-LSTM: Research paper on hybrid deep learning for IDS

---

**Document Version**: 1.0  
**Last Updated**: December 5, 2025  
**Authors**: Aegis IDS Development Team
