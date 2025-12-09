"""
Simulated flow generator for Aegis IDS demo mode.
Produces randomized alerts once every second.
"""

import json
import random
import time
from datetime import datetime

LABELS = ["BENIGN", "DDoS_SYN", "DDoS_UDP", "BRUTE_FTP", "SCAN_PORT", "MITM_ARP"]
SEVERITY_MAP = {
    "BENIGN": "low",
    "DDoS_SYN": "high",
    "DDoS_UDP": "high",
    "BRUTE_FTP": "medium",
    "SCAN_PORT": "medium",
    "MITM_ARP": "high",
}


def random_ip() -> str:
    """Generate a random IPv4 address."""
    return (
        f"{random.randint(10, 255)}."
        f"{random.randint(0, 255)}."
        f"{random.randint(0, 255)}."
        f"{random.randint(1, 254)}"
    )


def random_flow() -> dict:
    """Generate a single randomized network flow alert."""
    label = random.choice(LABELS)
    return {
        "id": f"alert-{random.randint(10000, 99999)}",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "src_ip": random_ip(),
        "dst_ip": random_ip(),
        "proto": random.choice(["TCP", "UDP", "ICMP"]),
        "pkt_rate": round(random.uniform(0.5, 15.0), 2),
        "byte_rate": round(random.uniform(200, 10000), 2),
        "label": label,
        "score": round(random.uniform(0.6, 0.99), 2),
        "severity": SEVERITY_MAP[label],
    }


if __name__ == "__main__":
    print("▶ Starting simulated alert stream...")
    try:
        while True:
            alert = random_flow()
            print(json.dumps(alert))
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nSimulation stopped.")
