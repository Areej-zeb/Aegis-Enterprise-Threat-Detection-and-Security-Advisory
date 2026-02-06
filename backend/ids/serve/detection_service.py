"""
Aegis IDS - Real-time Detection Service
Loads ML models and generates live predictions from test datasets
"""

import numpy as np
import pandas as pd
import joblib
import warnings
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import random
from .logger_config import (
    get_detection_logger,
    get_alert_logger,
    get_system_logger,
    get_performance_logger,
    get_error_logger,
    log_with_extra
)
from backend.ids.engine.correlation import CorrelationEngine

# Suppress sklearn feature name warnings
warnings.filterwarnings('ignore', message='X has feature names')


class DetectionService:
    """Service for loading models and generating real-time detections."""
    
    def __init__(self):
        self.models = {}
        self.datasets = {}
        self.detection_indices = {'Syn': 0, 'mitm_arp': 0, 'dns_exfiltration': 0}
        self.confusion_matrix = {'tp': 0, 'fp': 0, 'tn': 0, 'fn': 0}
        self._prediction_cache = {}  # Pre-generated predictions cache
        self._cache_size = 300  # Keep 300 predictions ready per model (increased from 200)
        self._cache_refill_threshold = 100  # Refill when below 100 (increased from 50)
        
        # Initialize loggers
        self.detection_logger = get_detection_logger()
        self.alert_logger = get_alert_logger()
        self.system_logger = get_system_logger()
        self.performance_logger = get_performance_logger()
        self.error_logger = get_error_logger()
        
        self.system_logger.info("DetectionService initialized")
        
    def load_models(self):
        """Load all ML models (XGBoost for SYN/MITM, Ensemble for DNS)."""
        start_time = time.time()
        base_path = Path(__file__).parent.parent.parent.parent / "artifacts"
        models_loaded = []
        
        try:
            # Load SYN model
            syn_path = base_path / "Syn" / "xgb_baseline.joblib"
            if syn_path.exists():
                syn_dict = joblib.load(syn_path)
                self.models['Syn'] = {
                    'model': syn_dict['model'],
                    'label_encoder': syn_dict['label_encoder'],
                    'classes': syn_dict['label_encoder'].classes_.tolist(),
                    'type': 'xgboost'
                }
                print(f"âœ… Loaded SYN model: {len(self.models['Syn']['classes'])} classes")
                self.system_logger.info(f"Loaded SYN model with {len(self.models['Syn']['classes'])} classes from {syn_path}")
                models_loaded.append('SYN')
            else:
                self.system_logger.warning(f"SYN model not found at {syn_path}")
            
            # Load MITM model
            mitm_path = base_path / "mitm_arp" / "xgb_baseline.joblib"
            if mitm_path.exists():
                mitm_dict = joblib.load(mitm_path)
                self.models['mitm_arp'] = {
                    'model': mitm_dict['model'],
                    'label_encoder': mitm_dict['label_encoder'],
                    'classes': mitm_dict['label_encoder'].classes_.tolist(),
                    'type': 'xgboost'
                }
                print(f"âœ… Loaded MITM model: {len(self.models['mitm_arp']['classes'])} classes")
                self.system_logger.info(f"Loaded MITM model with {len(self.models['mitm_arp']['classes'])} classes from {mitm_path}")
                models_loaded.append('MITM')
            else:
                self.system_logger.warning(f"MITM model not found at {mitm_path}")
            
            # Load DNS Exfiltration model (Ensemble ML)
            dns_path = base_path / "baseline_ml_stateful" / "ensemble_model.joblib"
            if dns_path.exists():
                dns_model = joblib.load(dns_path)
                self.models['dns_exfiltration'] = {
                    'model': dns_model,
                    'label_encoder': None,
                    'classes': ['BENIGN', 'ATTACK'],  # Binary classification
                    'type': 'ensemble'
                }
                print(f"âœ… Loaded DNS model: binary classification")
                self.system_logger.info(f"Loaded DNS model (binary classification) from {dns_path}")
                models_loaded.append('DNS')
            else:
                self.system_logger.warning(f"DNS model not found at {dns_path}")
            
            load_time = time.time() - start_time
            log_with_extra(
                self.performance_logger,
                20,  # INFO
                f"Models loaded in {load_time:.2f}s",
                models_loaded=models_loaded,
                count=len(models_loaded),
                load_time_seconds=load_time
            )
            
            return len(self.models) > 0
            
        except Exception as e:
            self.error_logger.error(f"Error loading models: {str(e)}", exc_info=True)
            raise
    
    def load_datasets(self):
        """Load test datasets for simulation."""
        start_time = time.time()
        base_path = Path(__file__).parent.parent.parent.parent / "datasets" / "processed"
        datasets_loaded = []
        
        try:
            # Load SYN test data
            syn_path = base_path / "Syn" / "test.parquet"
            if syn_path.exists():
                df_syn = pd.read_parquet(syn_path)
                self.datasets['Syn'] = {
                    'X_test': df_syn.drop('label', axis=1),
                    'y_test': df_syn['label']
                }
                print(f"âœ… Loaded SYN dataset: {len(df_syn)} samples")
                self.system_logger.info(f"Loaded SYN dataset: {len(df_syn)} samples")
                datasets_loaded.append(('SYN', len(df_syn)))
            
            # Load MITM test data
            mitm_path = base_path / "mitm_arp" / "test.parquet"
            if mitm_path.exists():
                df_mitm = pd.read_parquet(mitm_path)
                self.datasets['mitm_arp'] = {
                    'X_test': df_mitm.drop('label', axis=1),
                    'y_test': df_mitm['label']
                }
                print(f"âœ… Loaded MITM dataset: {len(df_mitm)} samples")
                self.system_logger.info(f"Loaded MITM dataset: {len(df_mitm)} samples")
                datasets_loaded.append(('MITM', len(df_mitm)))
            
            # Load DNS test data
            dns_path = base_path / "baseline_ml_stateful" / "processed_data.parquet"
            if dns_path.exists():
                df_dns = pd.read_parquet(dns_path)
                print(f"âœ… Loaded DNS dataset: {len(df_dns)} samples")
                # Use last 20% as test data for simulation
                test_size = int(len(df_dns) * 0.2)
                df_dns_test = df_dns.tail(test_size).reset_index(drop=True)
                self.datasets['dns_exfiltration'] = {
                    'X_test': df_dns_test.drop('label', axis=1),
                    'y_test': df_dns_test['label']
                }
                print(f"âœ… Loaded DNS dataset: {len(df_dns_test)} samples")
                self.system_logger.info(f"Loaded DNS dataset: {len(df_dns_test)} samples")
                datasets_loaded.append(('DNS', len(df_dns_test)))
            
            load_time = time.time() - start_time
            log_with_extra(
                self.performance_logger,
                20,  # INFO
                f"Datasets loaded in {load_time:.2f}s",
                datasets=datasets_loaded,
                total_samples=sum(count for _, count in datasets_loaded),
                load_time_seconds=load_time
            )
            
            return len(self.datasets) > 0
            
        except Exception as e:
            self.error_logger.error(f"Error loading datasets: {str(e)}", exc_info=True)
            raise
    
    def predict_single(self, attack_type: str) -> Optional[Dict]:
        """Make a single prediction from the test dataset."""
        if attack_type not in self.models or attack_type not in self.datasets:
            self.error_logger.warning(f"Model or dataset not found for attack type: {attack_type}")
            return None
        
        try:
            # Get model and dataset
            model_dict = self.models[attack_type]
            dataset = self.datasets[attack_type]
        
            # Get next sample
            idx = self.detection_indices[attack_type] % len(dataset['X_test'])
            self.detection_indices[attack_type] += 1
            
            flow = dataset['X_test'].iloc[idx:idx+1]
            true_label = dataset['y_test'].iloc[idx]
            
            # Make prediction
            model = model_dict['model']
            # Convert to numpy array to avoid sklearn feature name warnings
            flow_array = flow.values if hasattr(flow, 'values') else flow
            prediction = model.predict(flow_array)[0]
            probabilities = model.predict_proba(flow_array)[0]
            pred_label = model_dict['classes'][int(prediction)]
            confidence = float(max(probabilities))
            
            # Determine if benign
            is_benign_true = 'benign' in str(true_label).lower()
            is_benign_pred = 'benign' in str(pred_label).lower()
            
            # Update confusion matrix
            if not is_benign_pred and not is_benign_true:
                self.confusion_matrix['tp'] += 1
            elif not is_benign_pred and is_benign_true:
                self.confusion_matrix['fp'] += 1
            elif is_benign_pred and is_benign_true:
                self.confusion_matrix['tn'] += 1
            elif is_benign_pred and not is_benign_true:
                self.confusion_matrix['fn'] += 1
            
            # Determine severity
            if not is_benign_pred:
                if confidence > 0.95:
                    severity = "critical"
                elif confidence > 0.85:
                    severity = "high"
                elif confidence > 0.75:
                    severity = "medium"
                else:
                    severity = "low"
            else:
                severity = "low"
            
            # Generate realistic IP addresses and protocol
            if attack_type == "mitm_arp":
                src_ip = f"192.168.1.{np.random.randint(1, 255)}"
                dst_ip = f"192.168.1.{np.random.randint(1, 255)}"
                proto = "ARP"
                display_label = f"{pred_label} + Sniffing" if not is_benign_pred else pred_label
            elif attack_type == "dns_exfiltration":
                src_ip = f"10.0.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}"
                dst_ip = f"8.8.{np.random.randint(1, 9)}.{np.random.randint(1, 255)}"
                proto = "DNS"
                display_label = "DNS_Exfiltration" if not is_benign_pred else pred_label
            else:  # SYN
                src_ip = f"192.168.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}"
                dst_ip = f"10.0.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}"
                proto = "TCP"
                display_label = pred_label
            
            result = {
                "id": f"{attack_type}_{idx}_{int(datetime.now().timestamp())}",
                "timestamp": datetime.now().isoformat(),
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "src_port": random.randint(1024, 65535),
                "dst_port": random.randint(1, 1024) if attack_type == "Syn" else random.randint(1024, 65535),
                "protocol": proto,
                "attack_type": display_label,
                "severity": severity,
                "phase": "detection",
                "score": confidence,
                "label": "ATTACK" if not is_benign_pred else "BENIGN",
                "raw_label": pred_label,
                "true_label": str(true_label),
                "model_type": attack_type
            }
            
            # --- CORRELATION ENGINE ENRICHMENT ---
            result = CorrelationEngine.enrich_alert(result)
            # -------------------------------------
            
            # Log detection
            log_with_extra(
                self.detection_logger,
                20,  # INFO
                f"Detection: {display_label} ({severity})",
                detection_id=result["id"],
                attack_type=attack_type,
                predicted_label=pred_label,
                true_label=str(true_label),
                confidence=confidence,
                severity=severity,
                is_attack=not is_benign_pred,
                src_ip=src_ip,
                dst_ip=dst_ip,
                protocol=proto,
                is_correct=str(true_label) == pred_label
            )
            
            # Log alert if attack detected with high confidence
            if not is_benign_pred and confidence > 0.8:
                log_with_extra(
                    self.alert_logger,
                    30,  # WARNING
                    f"ALERT: {display_label} detected from {src_ip} to {dst_ip}",
                    alert_id=result["id"],
                    attack_type=display_label,
                    severity=severity,
                    confidence=confidence,
                    src_ip=src_ip,
                    dst_ip=dst_ip,
                    protocol=proto,
                    action_taken="logged"
                )
            
            return result
            
        except Exception as e:
            self.error_logger.error(f"Error in predict_single for {attack_type}: {str(e)}", exc_info=True)
            return None
    
    def _generate_batch_predictions(self, attack_type: str, batch_size: int = 50) -> List[Dict]:
        """Generate a batch of predictions at once for performance."""
        if attack_type not in self.models or attack_type not in self.datasets:
            self.error_logger.warning(f"Model or dataset not found for batch prediction: {attack_type}")
            return []
        
        start_time = time.time()
        try:
            model_dict = self.models[attack_type]
            dataset = self.datasets[attack_type]
            predictions = []
        
            # Get batch of samples
            start_idx = self.detection_indices[attack_type]
            dataset_size = len(dataset['X_test'])
            
            for i in range(batch_size):
                idx = (start_idx + i) % dataset_size
                flow = dataset['X_test'].iloc[idx:idx+1]
                true_label = dataset['y_test'].iloc[idx]
                
                # Make prediction
                model = model_dict['model']
                flow_array = flow.values if hasattr(flow, 'values') else flow
                prediction = model.predict(flow_array)[0]
                probabilities = model.predict_proba(flow_array)[0]
                pred_label = model_dict['classes'][int(prediction)]
                confidence = float(max(probabilities))
                
                # Determine if benign
                is_benign_pred = 'benign' in str(pred_label).lower()
                
                # Determine severity
                if not is_benign_pred:
                    if confidence > 0.95:
                        severity = "critical"
                    elif confidence > 0.85:
                        severity = "high"
                    elif confidence > 0.75:
                        severity = "medium"
                    else:
                        severity = "low"
                else:
                    severity = "low"
                
                # Generate IPs based on attack type
                if attack_type == "mitm_arp":
                    src_ip = f"192.168.1.{np.random.randint(1, 255)}"
                    dst_ip = f"192.168.1.{np.random.randint(1, 255)}"
                    proto = "ARP"
                    display_label = f"{pred_label} + Sniffing" if not is_benign_pred else pred_label
                elif attack_type == "dns_exfiltration":
                    src_ip = f"10.0.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}"
                    dst_ip = f"8.8.{np.random.randint(1, 9)}.{np.random.randint(1, 255)}"
                    proto = "DNS"
                    display_label = "DNS_Exfiltration" if not is_benign_pred else pred_label
                else:  # SYN
                    src_ip = f"192.168.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}"
                    dst_ip = f"10.0.{np.random.randint(1, 255)}.{np.random.randint(1, 255)}"
                    proto = "TCP"
                    display_label = pred_label
                
                predictions.append({
                    "id": f"{attack_type}_{idx}_{int(datetime.now().timestamp())}_{i}",
                    "timestamp": datetime.now().isoformat(),
                    "src_ip": src_ip,
                    "dst_ip": dst_ip,
                    "src_port": random.randint(1024, 65535),
                    "dst_port": random.randint(1, 1024) if attack_type == "Syn" else random.randint(1024, 65535),
                    "protocol": proto,
                    "attack_type": display_label,
                    "severity": severity,
                    "phase": "detection",
                    "score": confidence,
                    "label": "ATTACK" if not is_benign_pred else "BENIGN",
                    "confidence": confidence,
                    "source_ip": src_ip,
                    "destination_ip": dst_ip,
                    "model_type": attack_type
                })
            
            self.detection_indices[attack_type] = (start_idx + batch_size) % dataset_size
            
            # Log batch generation performance
            generation_time = time.time() - start_time
            log_with_extra(
                self.performance_logger,
                20,  # INFO
                f"Batch predictions generated for {attack_type}",
                attack_type=attack_type,
                batch_size=batch_size,
                predictions_count=len(predictions),
                generation_time_seconds=generation_time,
                predictions_per_second=batch_size / generation_time if generation_time > 0 else 0
            )
            
            return predictions
            
        except Exception as e:
            self.error_logger.error(f"Error in batch prediction for {attack_type}: {str(e)}", exc_info=True)
            return []
    
    def _ensure_cache_filled(self):
        """Ensure prediction cache is filled for all models."""
        if not self.models:
            return
        
        for attack_type in self.models.keys():
            if attack_type not in self._prediction_cache:
                self._prediction_cache[attack_type] = []
            
            cache_size = len(self._prediction_cache[attack_type])
            if cache_size < self._cache_refill_threshold:
                # Refill cache
                new_predictions = self._generate_batch_predictions(attack_type, self._cache_size)
                self._prediction_cache[attack_type].extend(new_predictions)
                
                # Log cache refill
                log_with_extra(
                    self.system_logger,
                    20,  # INFO
                    f"Cache refilled for {attack_type}",
                    attack_type=attack_type,
                    new_predictions=len(new_predictions),
                    total_cache_size=len(self._prediction_cache[attack_type]),
                    refill_threshold=self._cache_refill_threshold
                )
                print(f"[Cache] Refilled {attack_type}: {len(new_predictions)} predictions")
    
    def generate_detections(self, num_flows: int = 5, attack_types: Optional[List[str]] = None) -> List[Dict]:
        """Generate multiple detections FAST using pre-generated cache."""
        if attack_types is None:
            attack_types = list(self.models.keys())
        
        # Safety check: return empty if no models loaded
        if not attack_types:
            self.error_logger.warning("No models loaded, cannot generate detections")
            return []
        
        # Ensure cache is filled
        self._ensure_cache_filled()
        
        detections = []
        for _ in range(num_flows):
            attack_type = random.choice(attack_types)
            if attack_type in self._prediction_cache and self._prediction_cache[attack_type]:
                # Pop from cache (FIFO)
                detection = self._prediction_cache[attack_type].pop(0)
                
                # --- CORRELATION ENGINE ENRICHMENT ---
                detection = CorrelationEngine.enrich_alert(detection)
                # -------------------------------------
                
                detections.append(detection)
                
                # Only log attacks with high confidence (reduce logging overhead)
                is_attack = detection.get('label') == 'ATTACK'
                confidence = detection.get('confidence', detection.get('score', 0))
                severity = detection.get('severity', 'low')
                
                # Log only important detections (attacks with confidence > 0.75)
                if is_attack and confidence > 0.75:
                    log_with_extra(
                        self.detection_logger,
                        20,  # INFO
                        f"Detection: {detection.get('attack_type')} ({severity})",
                        detection_id=detection.get('id'),
                        attack_type=detection.get('attack_type'),
                        confidence=confidence,
                        severity=severity,
                        src_ip=detection.get('src_ip'),
                        dst_ip=detection.get('dst_ip'),
                        protocol=detection.get('protocol'),
                        model_type=detection.get('model_type')
                    )
                    
                    # Log alert if attack detected with high confidence
                    if confidence > 0.8:
                        log_with_extra(
                            self.alert_logger,
                            30,  # WARNING
                            f"ALERT: {detection.get('attack_type')} detected from {detection.get('src_ip')} to {detection.get('dst_ip')}",
                            alert_id=detection.get('id'),
                            attack_type=detection.get('attack_type'),
                            severity=severity,
                            confidence=confidence,
                            src_ip=detection.get('src_ip'),
                            dst_ip=detection.get('dst_ip'),
                            protocol=detection.get('protocol'),
                            action_taken="logged"
                        )
        
        # Trigger background refill if needed
        self._ensure_cache_filled()
        
        return detections
    
    def get_metrics(self) -> Dict:
        """Calculate performance metrics from confusion matrix."""
        cm = self.confusion_matrix
        tp, fp, tn, fn = cm['tp'], cm['fp'], cm['tn'], cm['fn']
        
        total = tp + fp + tn + fn
        if total == 0:
            return {
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "total_predictions": 0,
                "confusion_matrix": cm
            }
        
        accuracy = (tp + tn) / total
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        return {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "total_predictions": total,
            "confusion_matrix": cm,
            "true_positives": tp,
            "false_positives": fp,
            "true_negatives": tn,
            "false_negatives": fn
        }
    
    def get_model_info(self) -> Dict:
        """Get information about loaded models."""
        return {
            "models_loaded": len(self.models),
            "models": {
                name: {
                    "type": info["type"],
                    "classes": info["classes"],
                    "num_classes": len(info["classes"])
                }
                for name, info in self.models.items()
            },
            "datasets_loaded": len(self.datasets),
            "datasets": {
                name: {
                    "samples": len(data["X_test"]),
                    "features": data["X_test"].shape[1]
                }
                for name, data in self.datasets.items()
            }
        }


# Global instance
detection_service = DetectionService()

