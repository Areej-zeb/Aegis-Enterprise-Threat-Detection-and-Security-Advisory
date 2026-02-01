
import sys
import os
import logging
from datetime import datetime

# Setup path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

# Mock data imports
from backend.pentest import api
from backend.ids.engine.correlation import CorrelationEngine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Verification")

def test_correlation():
    print("--- 🧪 Testing Correlation Engine ---")
    
    # 1. Setup Mock Scan Result (Simulating a DVWA scan)
    mock_ip = "192.168.1.50"
    scan_id = "mock-scan-123"
    
    api.SCAN_RESULTS[scan_id] = {
        "id": scan_id,
        "status": "completed",
        "result": {
            "hosts": [
                {
                    "ip": mock_ip,
                    "ports": [
                        {
                            "port": 80,
                            "service": "http",
                            "vulnerabilities": [
                                {
                                    "id": "CVE-2021-40438",
                                    "severity_level": "CRITICAL",
                                    "description": "Apache SSRF vulnerability",
                                    "known_exploited": True
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    }
    print(f"✅ Mocked Scan Result for {mock_ip} (Port 80 has CVE-2021-40438)")

    # 2. Simulate Attack Alert (Matching IP and Port)
    alert_hit = {
        "id": "alert-1",
        "dst_ip": mock_ip,
        "dst_port": 80,
        "attack_type": "SYN Flood",
        "severity": "medium",
        "score": 0.6
    }
    
    # 3. Run Correlation
    print(f"🚀 Processing Alert: Attack on {alert_hit['dst_ip']}:{alert_hit['dst_port']}")
    enriched_hit = CorrelationEngine.enrich_alert(alert_hit)
    
    # 4. Verify Escalation
    if enriched_hit.get("severity") == "CRITICAL":
        print("✅ SUCCESS: Alert escalated to CRITICAL!")
        print(f"   Context: {enriched_hit.get('correlation_context')['message']}")
    else:
        print(f"❌ FAILED: Alert was not escalated. Severity: {enriched_hit.get('severity')}")
        
    # 5. Simulate Attack Alert (Non-Matching Port)
    alert_miss = {
        "id": "alert-2",
        "dst_ip": mock_ip,
        "dst_port": 22, # SSH (No vulns in mock)
        "attack_type": "SSH Brute Force",
        "severity": "medium"
    }
    
    print(f"\n🚀 Processing Alert: Attack on {alert_miss['dst_ip']}:{alert_miss['dst_port']}")
    enriched_miss = CorrelationEngine.enrich_alert(alert_miss)
    
    if enriched_miss.get("severity") == "medium":
        print("✅ SUCCESS: Alert NOT escalated (Port 22 safe).")
    else:
        print(f"❌ FAILED: Alert escalated incorrectly. Severity: {enriched_miss.get('severity')}")

if __name__ == "__main__":
    test_correlation()
