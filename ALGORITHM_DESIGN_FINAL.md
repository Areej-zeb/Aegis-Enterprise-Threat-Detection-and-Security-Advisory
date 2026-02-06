## 4.1 Algorithm Design

### 4.1.1 SYN Flood Detection (XGBoost)

```
Algorithm 1: XGBoost SYN Flood Detection
Input: Network traffic features F = {f₁, f₂, ..., f₃₀} where n=30 features
Output: Attack classification C ∈ {BENIGN, PortScan, DoS_Hulk, DoS_GoldenEye,
                                   DoS_Slowloris, DoS_Slowhttptest, Heartbleed}

1:  # Data Preprocessing Phase
2:  for each pcap_file in datasets/raw/Syn/ do
3:      flows ← extract_flow_features(pcap_file)
4:      for each flow in flows do
5:          features ← [
6:              duration, protocol, flow_packets_s, flow_bytes_s,
7:              fwd_packets_s, bwd_packets_s, fwd_bytes, bwd_bytes,
8:              packet_length_mean, packet_length_std, packet_length_var,
9:              packet_length_min, packet_length_max,
10:             iat_mean, iat_std, iat_max, iat_min,
11:             fwd_iat_total, fwd_iat_mean, fwd_iat_std, fwd_iat_max, fwd_iat_min,
12:             bwd_iat_total, bwd_iat_mean, bwd_iat_std, bwd_iat_max, bwd_iat_min,
13:             syn_flag_count, ack_flag_count, fin_flag_count
14:         ]
15:         if contains_NaN(features) then
16:             features ← replace_with_zero(features)
17:         end if
18:         if is_duplicate(features) then
19:             continue
20:         end if
21:         label ← extract_label(flow)
22:         data ← append(features, label)
23:     end for
24: end for
25:
26: # Feature Engineering Phase
27: X ← StandardScaler().fit_transform(data.features)
28: y ← LabelEncoder().fit_transform(data.labels)
29:
30: # Train/Test Split (80/20 stratified)
31: X_train, X_test, y_train, y_test ← train_test_split(
32:     X, y, test_size=0.20, stratify=y, random_state=42
33: )
34:
35: # Handle Class Imbalance
36: class_weights ← compute_class_weight('balanced', classes=unique(y_train), y=y_train)
37: scale_pos_weight ← class_weights[BENIGN] / class_weights[ATTACK]
38:
39: # XGBoost Model Training with GPU Acceleration
40: xgb_params ← {
41:     'max_depth': 7,
42:     'learning_rate': 0.1,
43:     'n_estimators': 200,
44:     'min_child_weight': 3,
45:     'subsample': 0.8,
46:     'colsample_bytree': 0.8,
47:     'scale_pos_weight': scale_pos_weight,
48:     'tree_method': 'gpu_hist',
49:     'objective': 'multi:softprob',
50:     'eval_metric': 'mlogloss'
51: }
52:
53: model ← XGBClassifier(**xgb_params)
54: model.fit(X_train, y_train, eval_set=[(X_val, y_val)], early_stopping_rounds=20)
55:
56: # Prediction & Evaluation
57: y_pred ← model.predict(X_test)
58: accuracy ← accuracy_score(y_test, y_pred)
59: f1_score ← f1_score(y_test, y_pred, average='macro')
60:
61: # Save Model
62: save_model(model, 'artifacts/Syn/xgb_baseline.joblib')
63:
64: return model, accuracy, f1_score
```

---

### 4.1.2 MITM ARP Spoofing Detection (XGBoost)

```
Algorithm 2: XGBoost MITM Detection
Input: Network traffic features F = {f₁, f₂, ..., f₂₅} where n=25 features
Output: Binary classification C ∈ {BENIGN, MITM_ARP + Sniffing}

1:  # Data Loading Phase
2:  data_benign ← load_pcap('datasets/raw/mitm_arp/benign_capture.pcapng')
3:  data_attack ← load_pcap('datasets/raw/mitm_arp/mitm_capture.pcapng')
4:
5:  # Flow-Level Feature Extraction
6:  flows ← []
7:  for each packet_group in group_by_five_tuple(data_benign ∪ data_attack) do
8:      flow_features ← {
9:          'duration', 'protocol', 'flow_packets_s', 'flow_bytes_s',
10:         'fwd_packets_s', 'bwd_packets_s', 'packet_length_mean', 'packet_length_std',
11:         'arp_request_rate', 'arp_reply_rate', 'arp_timing_anomaly',
12:         'mac_address_changes', 'duplicate_arp_replies', 'ip_mac_inconsistency',
13:         'gratuitous_arp_count', ...
14:     }
15:     label ← determine_label(packet_group)
16:     flows.append((flow_features, label))
17: end for
18:
19: # Preprocessing
20: X ← extract_features(flows)
21: y ← extract_labels(flows)
22: X ← fillna(X, value=0)
23: X, y ← drop_duplicates(X, y)
24: X_scaled ← StandardScaler().fit_transform(X)
25:
26: # Train/Test Split (80/20 stratified)
27: X_train, X_test, y_train, y_test ← train_test_split(
28:     X_scaled, y, test_size=0.20, stratify=y, random_state=42
29: )
30:
31: # Class Imbalance Handling
32: class_weights ← compute_class_weight('balanced', classes=[0, 1], y=y_train)
33: scale_pos_weight ← class_weights[0] / class_weights[1]
34:
35: # XGBoost Configuration
36: xgb_params ← {
37:     'max_depth': 5,
38:     'learning_rate': 0.05,
39:     'n_estimators': 300,
40:     'min_child_weight': 1,
41:     'subsample': 0.8,
42:     'colsample_bytree': 0.8,
43:     'scale_pos_weight': scale_pos_weight,
44:     'tree_method': 'gpu_hist',
45:     'objective': 'binary:logistic'
46: }
47:
48: # Model Training
49: model ← XGBClassifier(**xgb_params)
50: model.fit(X_train, y_train, eval_set=[(X_val, y_val)], early_stopping_rounds=20)
51:
52: # Prediction & Evaluation
53: y_pred ← model.predict(X_test)
54: accuracy ← accuracy_score(y_test, y_pred)
55: f1_score ← f1_score(y_test, y_pred, average='macro')
56:
57: # Save Model
58: save_model(model, 'artifacts/mitm_arp/xgb_baseline.joblib')
59:
60: return model, accuracy, f1_score
```

---

### 4.1.3 DNS Exfiltration Detection (Ensemble ML)

```
Algorithm 3: Ensemble ML for DNS Exfiltration Detection
Input: DNS features F = {f₁, f₂, ..., f₂₀} (stateful features)
Output: Binary classification C ∈ {BENIGN, DNS_EXFILTRATION}

1:  # Data Loading Phase
2:  data ← []
3:  for each csv_file in datasets/raw/CIC-Bell-DNS-EXF-2021/ do
4:      df ← read_csv(csv_file)
5:      data.append(df)
6:  end for
7:  df_merged ← concatenate(data)
8:
9:  # Preprocessing Phase
10: df_clean ← drop_columns(df_merged, ['timestamp', 'flow_id', 'src_ip', 'dst_ip', 'FQDN', 'sld'])
11: df_clean ← fillna(df_clean, value=0)
12:
13: # Deduplication (per class)
14: df_benign ← df_clean[df_clean['label'] == 'BENIGN']
15: df_attack ← df_clean[df_clean['label'] == 'DNS_EXFILTRATION']
16: df_benign_dedup ← drop_duplicates(df_benign, keep='first')
17: df_attack_dedup ← drop_duplicates(df_attack, keep='first')
18: df_clean ← concatenate([df_benign_dedup, df_attack_dedup])
19: df_clean ← shuffle(df_clean, random_state=42)
20:
21: # Feature Selection (20 stateful features)
22: selected_features ← [
23:     'rr', 'A_frequency', 'NS_frequency', 'CNAME_frequency', 'SOA_frequency',
24:     'NULL_frequency', 'PTR_frequency', 'HINFO_frequency', 'MX_frequency',
25:     'TXT_frequency', 'AAAA_frequency', 'SRV_frequency', 'OPT_frequency',
26:     'rr_count', 'rr_name_entropy', 'rr_name_length', 'distinct_ns',
27:     'a_records', 'ttl_mean', 'ttl_variance'
28: ]
29:
30: X ← df_clean[selected_features].values
31: y ← encode_labels(df_clean['label'])
32:
33: # Class Balancing (SMOTE + Undersampling 1:10 ratio)
34: smote ← SMOTE(random_state=42, k_neighbors=5)
35: X_smote, y_smote ← smote.fit_resample(X, y)
36: target_benign ← 1143 * 10
37: target_attack ← 1143
38: rus ← RandomUnderSampler(random_state=42, sampling_strategy={0: target_benign, 1: target_attack})
39: X_balanced, y_balanced ← rus.fit_resample(X_smote, y_smote)
40:
41: # Train/Test Split (80/20 stratified)
42: X_train, X_test, y_train, y_test ← train_test_split(
43:     X_balanced, y_balanced, test_size=0.20, stratify=y_balanced, random_state=42
44: )
45:
46: # Model Training (4 models with GridSearchCV)
47: models ← ['RandomForest', 'KNN', 'DecisionTree', 'ExtraTrees']
48: trained_models ← {}
49:
50: for each model_name in models do
51:     if model_name == 'RandomForest' then
52:         param_grid ← {'max_depth': [5], 'max_features': ['log2'], 'n_estimators': [50], 'class_weight': ['balanced']}
53:         base_model ← RandomForestClassifier()
54:     else if model_name == 'KNN' then
55:         param_grid ← {'metric': ['manhattan'], 'n_neighbors': [4], 'weights': ['uniform']}
56:         base_model ← KNeighborsClassifier()
57:     else if model_name == 'DecisionTree' then
58:         param_grid ← {'criterion': ['gini'], 'max_depth': [2]}
59:         base_model ← DecisionTreeClassifier()
60:     else if model_name == 'ExtraTrees' then
61:         param_grid ← {'max_depth': [None], 'n_estimators': [50], 'class_weight': ['balanced']}
62:         base_model ← ExtraTreesClassifier()
63:     end if
64:
65:     grid_search ← GridSearchCV(base_model, param_grid, cv=3, scoring='f1_macro', n_jobs=-1)
66:     grid_search.fit(X_train, y_train)
67:     trained_models[model_name] ← grid_search.best_estimator_
68: end for
69:
70: # Ensemble: Soft Voting Classifier
71: ensemble ← VotingClassifier(
72:     estimators=[('rf', trained_models['RandomForest']), ('knn', trained_models['KNN']),
73:                 ('dt', trained_models['DecisionTree']), ('et', trained_models['ExtraTrees'])],
74:     voting='soft', n_jobs=-1
75: )
76: ensemble.fit(X_train, y_train)
77:
78: # Evaluation
79: y_pred ← ensemble.predict(X_test)
80: accuracy ← accuracy_score(y_test, y_pred)
81: f1_score ← f1_score(y_test, y_pred, average='macro')
82:
83: # Save Model
84: save_model(ensemble, 'artifacts/baseline_ml_stateful/ensemble_model.joblib')
85:
86: return ensemble, accuracy, f1_score
```
