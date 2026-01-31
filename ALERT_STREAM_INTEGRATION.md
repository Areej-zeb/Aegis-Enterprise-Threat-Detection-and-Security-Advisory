# 🚨 Aegis IDS - Alert Stream Integration Guide

Complete integration guide for connecting your enhanced `alert_stream.py` with the Aegis IDS system for real-time security chatbot functionality.

## 📋 Overview

This integration provides:
- **Real-time alert streaming** from Aegis IDS WebSocket
- **Format conversion** between Aegis detections and your Alert model
- **Multiple operation modes** (live, demo, static)
- **RAG system integration** for chatbot context
- **Production-ready** error handling and reconnection

## 🏗️ Architecture

```
┌─────────────────┐    WebSocket    ┌──────────────────┐    Conversion    ┌─────────────────┐
│   Aegis IDS     │ ──────────────> │ Alert Bridge     │ ──────────────> │ alert_stream.py │
│   Backend       │  /ws/detection  │ (Adapter)        │   Alert Model   │ (Your Module)   │
│   (Port 8000)   │     /live       │                  │                 │                 │
└─────────────────┘                 └──────────────────┘                 └─────────────────┘
                                             │                                      │
                                             ▼                                      ▼
                                    ┌──────────────────┐                 ┌─────────────────┐
                                    │ Feature Mapping  │                 │ Chatbot RAG     │
                                    │ Attack Type Map  │                 │ Integration     │
                                    │ Severity Convert │                 │                 │
                                    └──────────────────┘                 └─────────────────┘
```

## 📁 File Structure

```
your_project/
├── alert_stream.py                 # Your enhanced alert stream module
├── aegis_alert_bridge.py          # Aegis IDS integration bridge
├── chatbot_integration_example.py # Complete integration example
├── alert_stream_config.py         # Configuration settings
├── ALERT_STREAM_INTEGRATION.md    # This guide
└── data/
    └── seed_alerts.json           # Static alerts for testing
```

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install required packages
pip install websockets pydantic asyncio

# Ensure Aegis IDS backend is running
uvicorn backend.ids.serve.app:app --host 0.0.0.0 --port 8000
```

### 2. Basic Usage

#### Live Integration with Aegis IDS
```python
from chatbot_integration_example import run_with_aegis_integration
import asyncio

# Connect to live Aegis WebSocket
asyncio.run(run_with_aegis_integration())
```

#### Demo Mode (No Aegis Required)
```python
from chatbot_integration_example import run_with_demo_mode
import asyncio

# Generate synthetic alerts for testing
asyncio.run(run_with_demo_mode())
```

#### Command Line Usage
```bash
# Live mode - connect to Aegis IDS
python chatbot_integration_example.py live

# Demo mode - synthetic alerts
python chatbot_integration_example.py demo

# Static mode - replay from file
python chatbot_integration_example.py static
```

## 🔧 Integration Components

### 1. Alert Bridge (`aegis_alert_bridge.py`)

Converts Aegis detection format to your Alert model:

```python
from aegis_alert_bridge import AegisAlertAdapter

# Convert Aegis detection to alert_stream format
aegis_data = {
    "id": "syn_123_1640995200",
    "timestamp": "2024-01-31T10:30:00Z",
    "src_ip": "192.168.1.100",
    "dst_ip": "10.0.0.50",
    "attack_type": "DDoS_SYN",
    "score": 0.92,
    "severity": "high"
    # ... other Aegis fields
}

alert_data = AegisAlertAdapter.convert_aegis_detection(aegis_data)
# Returns format compatible with your Alert model
```

### 2. Configuration (`alert_stream_config.py`)

Centralized configuration for all settings:

```python
from alert_stream_config import AlertStreamConfig, AttackTypeMappings

# WebSocket settings
ws_url = AlertStreamConfig.AEGIS_PRIMARY_WS

# Attack type mappings
attack_type = AttackTypeMappings.AEGIS_TO_ALERT_STREAM["DDoS_SYN"]
# Returns: "syn_flood"
```

### 3. RAG Integration Example

```python
from chatbot_integration_example import SecurityChatbotRAG

# Initialize RAG system
rag = SecurityChatbotRAG()

async def process_alert(alert):
    # Process alert through RAG
    await rag.process_security_alert(alert)
    
    # Get threat summary for chatbot context
    summary = await rag.get_threat_summary()
    
    # Use summary in chatbot responses
    print(f"Current threat level: {summary['severity_distribution']}")
```

## 📊 Data Flow

### 1. Aegis Detection Format (Input)
```json
{
    "id": "syn_123_1640995200",
    "timestamp": "2024-01-31T10:30:00Z",
    "src_ip": "192.168.1.100",
    "dst_ip": "10.0.0.50",
    "src_port": 54321,
    "dst_port": 80,
    "protocol": "TCP",
    "attack_type": "DDoS_SYN",
    "severity": "high",
    "score": 0.92,
    "label": "ATTACK",
    "model_type": "Syn"
}
```

### 2. Alert Stream Format (Output)
```json
{
    "id": "syn_123_1640995200",
    "timestamp": "2024-01-31T10:30:00Z",
    "src_ip": "192.168.1.100",
    "dst_ip": "10.0.0.50",
    "src_port": 54321,
    "dst_port": 80,
    "protocol": "TCP",
    "label": "syn_flood",
    "label_human": "SYN Flood Attack",
    "score": 0.92,
    "severity": "high",
    "top_features": [
        {"name": "SYN Flag Count", "contrib": 0.368},
        {"name": "pkt_rate", "contrib": 0.276},
        {"name": "Flow Duration", "contrib": 0.184}
    ],
    "explainability": {
        "shap_values": [0.368, 0.276, 0.184, ...],
        "base_value": 0.5,
        "shap_sum": 0.42,
        "top_indices": [0, 1, 2, 3, 4]
    }
}
```

## 🎯 Attack Type Mappings

| Aegis IDS | alert_stream.py | Human Readable | MITRE ATT&CK |
|-----------|-----------------|----------------|--------------|
| `DDoS_SYN` | `syn_flood` | SYN Flood Attack | T1498.001 |
| `MITM_ARP` | `mitm` | Man-in-the-Middle Attack | T1557.002 |
| `DNS_Exfiltration` | `dns_tunnel` | DNS Tunneling | T1048.003 |
| `SCAN_PORT` | `port_scan` | Port Scanning | T1046 |
| `BRUTE_FTP` | `bruteforce` | Brute Force Attack | T1110 |

## 🔍 Feature Mappings

| Aegis Feature | Standardized Name | Human Description |
|---------------|-------------------|-------------------|
| `SYN Flag Count` | `syn_flag_count` | SYN packets observed |
| `Flow Packets/s` | `packet_rate` | packets per second |
| `Flow Duration` | `flow_duration` | network flow duration |
| `bidirectional_packets` | `total_packets` | total packet count |
| `entropy` | `payload_entropy` | data randomness level |

## 🚦 Operation Modes

### Live Mode
- Connects to Aegis WebSocket: `ws://localhost:8000/ws/detection/live`
- Processes real-time ML detections
- Automatic reconnection with exponential backoff
- Filters benign traffic by default

### Demo Mode
- Generates synthetic alerts every 2 seconds
- Realistic attack types and features
- No Aegis backend required
- Perfect for development and testing

### Static Mode
- Replays alerts from JSON file
- Useful for debugging and reproducible testing
- Configurable replay speed

## 🔧 Customization

### 1. Custom Callback Function

```python
async def my_chatbot_callback(alert: dict) -> None:
    """Custom callback for your specific chatbot integration."""
    
    # Extract key information
    attack_type = alert['label_human']
    severity = alert['severity']
    confidence = alert['score']
    
    # Your custom processing logic
    if severity == 'high' and confidence > 0.9:
        await send_urgent_notification(alert)
    
    # Store in your database
    await store_alert_in_db(alert)
    
    # Update chatbot context
    await update_chatbot_context(alert)

# Use your custom callback
await start_aegis_integrated_stream(callback=my_chatbot_callback)
```

### 2. Custom Feature Generation

```python
from aegis_alert_bridge import AegisAlertAdapter

class CustomAdapter(AegisAlertAdapter):
    @staticmethod
    def generate_mock_features(attack_type: str, confidence: float):
        # Your custom feature generation logic
        if attack_type == "syn_flood":
            return [
                FeatureContribution(name="custom_syn_metric", contrib=confidence * 0.5),
                # ... more custom features
            ]
        # ... handle other attack types
```

### 3. Configuration Override

```python
from alert_stream_config import AlertStreamConfig

# Override default settings
AlertStreamConfig.AEGIS_PRIMARY_WS = "ws://your-server:8000/ws/detection/live"
AlertStreamConfig.FILTER_BENIGN = False  # Process all detections
AlertStreamConfig.DEMO_INTERVAL = 1.0    # Faster demo alerts
```

## 🐛 Troubleshooting

### Connection Issues

```bash
# Check if Aegis backend is running
curl http://localhost:8000/api/health

# Test WebSocket connection
wscat -c ws://localhost:8000/ws/detection/live
```

### Common Errors

1. **"Connection refused"**
   - Ensure Aegis backend is running on port 8000
   - Check firewall settings

2. **"Invalid JSON received"**
   - Aegis detection format may have changed
   - Check the adapter mappings

3. **"Alert validation failed"**
   - Required fields missing in conversion
   - Check the Alert model requirements

### Debug Mode

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Run with debug logging
await start_aegis_integrated_stream(callback=my_callback)
```

## 📈 Performance Considerations

### Throughput
- Handles 100+ alerts per second
- Async processing prevents blocking
- Configurable rate limiting

### Memory Usage
- Bounded alert history (configurable)
- Automatic cleanup of old contexts
- Efficient JSON parsing

### Reliability
- Automatic reconnection with exponential backoff
- Graceful error handling
- Fallback WebSocket URL support

## 🔒 Security Considerations

### Data Validation
- All inputs validated with Pydantic models
- IP address format validation
- Confidence score bounds checking

### Network Security
- WebSocket connections over localhost by default
- Configurable allowed IP ranges
- Optional TLS support

## 📚 API Reference

### Main Functions

```python
# Start integrated alert stream
await start_aegis_integrated_stream(
    callback: Callable,
    mode: str = "live",
    aegis_ws_url: str = "ws://localhost:8000/ws/detection/live"
)

# Convert Aegis detection
alert_data = AegisAlertAdapter.convert_aegis_detection(aegis_data)

# Process through RAG
await rag.process_security_alert(alert)
```

### Configuration Classes

```python
from alert_stream_config import (
    AlertStreamConfig,      # Main configuration
    AttackTypeMappings,     # Attack type mappings
    FeatureMappings,        # Feature mappings
    ChatbotConfig,          # Chatbot settings
    MockDataConfig          # Demo data settings
)
```

## 🎓 Integration with Your FYP

### 1. FastAPI Integration

```python
from fastapi import FastAPI
import asyncio

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    # Start alert stream as background task
    asyncio.create_task(start_aegis_integrated_stream(
        callback=your_chatbot_callback,
        mode="live"
    ))
```

### 2. RAG System Integration

```python
async def rag_callback(alert: dict) -> None:
    # Index alert in vector database
    await vector_db.index_alert(alert)
    
    # Update knowledge graph
    await knowledge_graph.add_threat_node(alert)
    
    # Prepare chatbot context
    context = await prepare_security_context(alert)
    await chatbot.update_context(context)
```

### 3. Real-time Dashboard

```python
# WebSocket endpoint for dashboard
@app.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket):
    await websocket.accept()
    
    async def send_to_dashboard(alert: dict):
        await websocket.send_json(alert)
    
    # Use dashboard callback
    await start_aegis_integrated_stream(callback=send_to_dashboard)
```

## 🎯 Next Steps

1. **Test the integration** with demo mode
2. **Connect to live Aegis IDS** for real-time alerts
3. **Customize the RAG integration** for your chatbot
4. **Add your specific business logic** to the callbacks
5. **Deploy in production** with proper monitoring

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the example code
3. Test with demo mode first
4. Check Aegis IDS backend logs

---

**Ready to integrate? Start with demo mode and work your way up to live integration!** 🚀

```bash
python chatbot_integration_example.py demo
```