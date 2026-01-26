#!/usr/bin/env python3
"""
Live network packet capture and real-time threat detection.
Uses trained ML models to detect attacks from live network traffic.
"""

import sys
import os
import time
import json
from datetime import datetime
from collections import defaultdict
import joblib
import pandas as pd
import numpy as np

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

try:
    from scapy.all import sniff, IP, TCP, UDP, ICMP
except ImportError:
    print("❌ Scapy not installed. Install with: pip install scapy")
    sys.exit(1)

# Load trained model and scaler
print("🔄 Loading trained model and scaler...")
model_path = os.path.join(os.path.dirname(__file__), '../../artifacts/Syn/xgb_baseline.joblib')
scaler_path = os.path.join(os.path.dirname(__file__), '../../artifacts/Syn/scaler.joblib')

model_dict = joblib.load(model_path)
scaler = joblib.load(scaler_path)

# Define XGBWithLabels wrapper inline to avoid import issues with sudo
class XGBWithLabels:
    """Wrapper to add label encoding/decoding to XGBoost model."""
    def __init__(self, model, label_encoder):
        self.model = model
        self.label_encoder = label_encoder
    
    def predict(self, X):
        pred_encoded = self.model.predict(X)
        return self.label_encoder.inverse_transform(pred_encoded)
    
    def predict_proba(self, X):
        return self.model.predict_proba(X)

model = XGBWithLabels(model_dict['model'], model_dict['label_encoder'])
print("✅ Model and scaler loaded successfully!\n")

# Flow tracking
flows = defaultdict(lambda: {
    'packets': [],
    'start_time': None,
    'total_fwd_packets': 0,
    'total_bwd_packets': 0,
    'total_fwd_bytes': 0,
    'total_bwd_bytes': 0,
    'syn_count': 0,
    'fin_count': 0,
    'rst_count': 0,
    'ack_count': 0,
})

# Severity mapping
SEVERITY_MAP = {
    'BENIGN': 'low',
    'DDoS_SYN': 'critical',
    'DDoS_UDP': 'critical',
    'DDoS_ICMP': 'high',
    'Port_Scan': 'high',
    'Brute_Force': 'medium',
}


def extract_features(flow_data):
    """Extract 30 features from flow data for Syn model."""
    packets = flow_data['packets']
    
    if not packets:
        return None
    
    # Calculate flow duration
    if flow_data['start_time']:
        flow_duration = (time.time() - flow_data['start_time']) * 1000000  # microseconds
    else:
        flow_duration = 0
    
    # Packet lengths
    fwd_lengths = [p['length'] for p in packets if p['direction'] == 'fwd']
    bwd_lengths = [p['length'] for p in packets if p['direction'] == 'bwd']
    
    all_lengths = fwd_lengths + bwd_lengths
    
    # Inter-arrival times
    timestamps = [p['timestamp'] for p in packets]
    iats = [timestamps[i+1] - timestamps[i] for i in range(len(timestamps)-1)] if len(timestamps) > 1 else [0]
    
    fwd_timestamps = [p['timestamp'] for p in packets if p['direction'] == 'fwd']
    fwd_iats = [fwd_timestamps[i+1] - fwd_timestamps[i] for i in range(len(fwd_timestamps)-1)] if len(fwd_timestamps) > 1 else [0]
    
    bwd_timestamps = [p['timestamp'] for p in packets if p['direction'] == 'bwd']
    bwd_iats = [bwd_timestamps[i+1] - bwd_timestamps[i] for i in range(len(bwd_timestamps)-1)] if len(bwd_timestamps) > 1 else [0]
    
    # Calculate features - MUST use spaces in names to match training data!
    features = {
        'Flow Duration': flow_duration,
        'Total Fwd Packets': flow_data['total_fwd_packets'],
        'Total Backward Packets': flow_data['total_bwd_packets'],
        'Total Length of Fwd Packets': sum(fwd_lengths) if fwd_lengths else 0,
        'Total Length of Bwd Packets': sum(bwd_lengths) if bwd_lengths else 0,
        'Fwd Packet Length Mean': np.mean(fwd_lengths) if fwd_lengths else 0,
        'Fwd Packet Length Std': np.std(fwd_lengths) if fwd_lengths else 0,
        'Bwd Packet Length Mean': np.mean(bwd_lengths) if bwd_lengths else 0,
        'Bwd Packet Length Std': np.std(bwd_lengths) if bwd_lengths else 0,
        'Flow Packets/s': (len(packets) / (flow_duration / 1000000)) if flow_duration > 0 else 0,
        'Flow Bytes/s': (sum(all_lengths) / (flow_duration / 1000000)) if flow_duration > 0 else 0,
        'Flow IAT Mean': np.mean(iats) if iats else 0,
        'Flow IAT Std': np.std(iats) if iats else 0,
        'Fwd IAT Mean': np.mean(fwd_iats) if fwd_iats else 0,
        'Fwd IAT Std': np.std(fwd_iats) if fwd_iats else 0,
        'Bwd IAT Mean': np.mean(bwd_iats) if bwd_iats else 0,
        'Bwd IAT Std': np.std(bwd_iats) if bwd_iats else 0,
        'FIN Flag Count': flow_data['fin_count'],
        'SYN Flag Count': flow_data['syn_count'],
        'RST Flag Count': flow_data['rst_count'],
        'PSH Flag Count': 0,  # Not tracked in current implementation
        'ACK Flag Count': flow_data['ack_count'],
        'URG Flag Count': 0,  # Rarely used
        'Fwd Header Length': flow_data['total_fwd_packets'] * 20,  # Estimate: 20 bytes per header
        'Bwd Header Length': flow_data['total_bwd_packets'] * 20,
        'Subflow Fwd Packets': flow_data['total_fwd_packets'],
        'Subflow Bwd Packets': flow_data['total_bwd_packets'],
        'Subflow Fwd Bytes': sum(fwd_lengths) if fwd_lengths else 0,
        'Subflow Bwd Bytes': sum(bwd_lengths) if bwd_lengths else 0,
        'Protocol': packets[0]['protocol'] if packets else 6,  # TCP=6, UDP=17, ICMP=1
    }
    
    return features


def analyze_flow(flow_key, flow_data):
    """Analyze a flow and predict if it's an attack."""
    features = extract_features(flow_data)
    
    if not features:
        return None
    
    # Create DataFrame with raw features
    df = pd.DataFrame([features])
    
    # **STANDARDIZE FEATURES** using the same scaler from training
    df_scaled = pd.DataFrame(
        scaler.transform(df),
        columns=df.columns
    )
    
    # Predict using standardized features
    prediction = model.predict(df_scaled)[0]
    probabilities = model.predict_proba(df_scaled)[0]
    confidence = float(probabilities.max())
    
    # Get source and destination
    src_ip, dst_ip = flow_key.split(':')[:2]
    
    # Create alert
    alert = {
        'id': f'alert-{int(time.time() * 1000)}',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'src_ip': src_ip,
        'dst_ip': dst_ip,
        'proto': 'TCP' if features['Protocol'] == 6 else ('UDP' if features['Protocol'] == 17 else 'ICMP'),
        'label': prediction,
        'confidence': round(confidence, 3),
        'severity': SEVERITY_MAP.get(prediction, 'low'),
        'flow_duration': features['Flow Duration'],
        'packets': flow_data['total_fwd_packets'] + flow_data['total_bwd_packets'],
        'bytes': flow_data['total_fwd_bytes'] + flow_data['total_bwd_bytes'],
    }
    
    return alert


def packet_handler(packet):
    """Process each captured packet."""
    global flows
    
    if not packet.haslayer(IP):
        return
    
    try:
        # Extract basic info
        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        protocol = packet[IP].proto
        length = len(packet)
        timestamp = time.time()
        
        # Create flow key (bidirectional)
        flow_key = f"{src_ip}:{dst_ip}:{protocol}"
        reverse_key = f"{dst_ip}:{src_ip}:{protocol}"
        
        # Determine direction
        if flow_key in flows:
            current_key = flow_key
            direction = 'fwd'
        elif reverse_key in flows:
            current_key = reverse_key
            direction = 'bwd'
        else:
            # New flow
            current_key = flow_key
            direction = 'fwd'
            flows[current_key]['start_time'] = timestamp
        
        # Update flow data
        flows[current_key]['packets'].append({
            'timestamp': timestamp,
            'direction': direction,
            'length': length,
            'protocol': protocol
        })
        
        if direction == 'fwd':
            flows[current_key]['total_fwd_packets'] += 1
            flows[current_key]['total_fwd_bytes'] += length
        else:
            flows[current_key]['total_bwd_packets'] += 1
            flows[current_key]['total_bwd_bytes'] += length
        
        # Track TCP flags
        if packet.haslayer(TCP):
            tcp = packet[TCP]
            if tcp.flags & 0x02:  # SYN
                flows[current_key]['syn_count'] += 1
            if tcp.flags & 0x01:  # FIN
                flows[current_key]['fin_count'] += 1
            if tcp.flags & 0x04:  # RST
                flows[current_key]['rst_count'] += 1
            if tcp.flags & 0x10:  # ACK
                flows[current_key]['ack_count'] += 1
        
        # Analyze flow every 10 packets
        total_packets = flows[current_key]['total_fwd_packets'] + flows[current_key]['total_bwd_packets']
        if total_packets >= 10 and total_packets % 10 == 0:
            alert = analyze_flow(current_key, flows[current_key])
            if alert:
                # Format output nicely
                severity_icon = {
                    'low': '🟢',
                    'medium': '🟡',
                    'high': '🟠',
                    'critical': '🔴'
                }.get(alert['severity'], '⚪')
                
                label_color = f"{severity_icon} [{alert['severity'].upper():8s}]"
                
                # Only print attacks or high-confidence benign
                if alert['label'] != 'BENIGN' or alert['confidence'] > 0.95:
                    print(f"{label_color} {alert['label']:12s} (conf: {alert['confidence']*100:5.1f}%) | "
                          f"{alert['src_ip']:15s} → {alert['dst_ip']:15s} | "
                          f"{alert['packets']:3d} pkts, {alert['bytes']:5d} bytes")
                    
                    # Write to file for backend to pick up
                    with open('live_alerts.json', 'a') as f:
                        f.write(json.dumps(alert) + '\n')
        
        # Clean old flows (older than 60 seconds)
        current_time = time.time()
        old_keys = [k for k, v in flows.items() if v['start_time'] and (current_time - v['start_time']) > 60]
        for k in old_keys:
            del flows[k]
            
    except Exception as e:
        print(f"Error processing packet: {e}")


def main():
    """Start live packet capture."""
    print("=" * 70)
    print("🛡️  AEGIS IDS - LIVE NETWORK CAPTURE")
    print("=" * 70)
    print("\n📡 Starting packet capture...")
    print("🔍 Analyzing packets with trained XGBoost model")
    print("⚠️  Admin/root privileges required for packet capture")
    print("\nPress Ctrl+C to stop\n")
    print("-" * 70)
    
    try:
        # Start sniffing
        # filter="ip" captures only IP packets
        # store=0 doesn't store packets in memory
        sniff(filter="ip", prn=packet_handler, store=0)
    except PermissionError:
        print("\n❌ Permission denied!")
        print("Run with sudo/admin privileges:")
        print("   Linux/WSL: sudo python backend/ids/live_capture.py")
        print("   Windows: Run PowerShell as Administrator")
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping capture...")
        print(f"📊 Total flows captured: {len(flows)}")
        print("✅ Done!")


if __name__ == '__main__':
    main()
