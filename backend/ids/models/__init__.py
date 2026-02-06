"""
AEGIS IDS - Model Registry
Centralized model loading and management
"""

from pathlib import Path
from typing import Optional
import joblib


class ModelRegistry:
    """Singleton registry for loaded ML models"""
    
    def __init__(self):
        self.syn_xgb = None
        self.syn_label_encoder = None
        self.syn_classes = None
        
        self.mitm_xgb = None
        self.mitm_label_encoder = None
        self.mitm_classes = None
        
        self.dns_ensemble = None
        self.dns_classes = ['BENIGN', 'ATTACK']  # Binary classification
    
    def load_models(self):
        """Load all available models"""
        print("[ModelRegistry] Loading models...")
        
        # Load SYN model
        syn_path = Path(__file__).parent.parent.parent.parent / "artifacts" / "Syn" / "xgb_baseline.joblib"
        if syn_path.exists():
            print(f"  Loading SYN model from {syn_path}")
            syn_dict = joblib.load(syn_path)
            self.syn_xgb = syn_dict['model']
            self.syn_label_encoder = syn_dict['label_encoder']
            self.syn_classes = syn_dict['label_encoder'].classes_
            print(f"  [OK] SYN model loaded ({len(self.syn_classes)} classes)")
        else:
            print(f"  [WARN] SYN model not found at {syn_path}")
        
        # Load MITM model
        mitm_path = Path(__file__).parent.parent.parent.parent / "artifacts" / "mitm_arp" / "xgb_baseline.joblib"
        if mitm_path.exists():
            print(f"  Loading MITM model from {mitm_path}")
            mitm_dict = joblib.load(mitm_path)
            self.mitm_xgb = mitm_dict['model']
            self.mitm_label_encoder = mitm_dict['label_encoder']
            self.mitm_classes = mitm_dict['label_encoder'].classes_
            print(f"  [OK] MITM model loaded ({len(self.mitm_classes)} classes)")
        else:
            print(f"  [WARN] MITM model not found at {mitm_path}")
        
        # Load DNS Ensemble model
        dns_path = Path(__file__).parent.parent.parent.parent / "artifacts" / "baseline_ml_stateful" / "ensemble_model.joblib"
        if dns_path.exists():
            print(f"  Loading DNS Ensemble model from {dns_path}")
            self.dns_ensemble = joblib.load(dns_path)
            print(f"  [OK] DNS Ensemble model loaded (binary classification)")
        else:
            print(f"  [WARN] DNS Ensemble model not found at {dns_path}")
        
        print("[ModelRegistry] Model loading complete\n")
    
    def get_model(self, attack_type: str):
        """Get model by attack type"""
        if attack_type == "Syn":
            return self.syn_xgb, self.syn_label_encoder, self.syn_classes
        elif attack_type == "mitm_arp":
            return self.mitm_xgb, self.mitm_label_encoder, self.mitm_classes
        elif attack_type == "dns_exfiltration":
            return self.dns_ensemble, None, self.dns_classes
        return None, None, None


# Singleton instance
models = ModelRegistry()
