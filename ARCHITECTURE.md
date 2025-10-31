# Aegis IDS — System Architecture

## 🏗️ Overview

Aegis is designed as a microservices-based architecture, optimized for scalability and modularity. This document provides a technical deep-dive into the system design.

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
│  ┌──────────────────┐        ┌─────────────────────┐        │
│  │   Streamlit      │        │   React Frontend    │        │
│  │   Dashboard      │        │   (Future)          │        │
│  └────────┬─────────┘        └──────────┬──────────┘        │
└───────────┼────────────────────────────┼────────────────────┘
            │                            │
            │ HTTP/WebSocket             │ HTTP/REST
            ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            FastAPI Application                        │   │
│  │  • CORS Middleware                                   │   │
│  │  • WebSocket Manager                                 │   │
│  │  • Request Validation (Pydantic)                     │   │
│  └────────────────────┬─────────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  IDS Engine  │  │  ML Models   │  │  Alert Mgr   │      │
│  │  • Flow      │  │  • XGBoost   │  │  • Queue     │      │
│  │    Analysis  │  │  • CNN-LSTM  │  │  • Broadcast │      │
│  │  • Feature   │  │  • Ensemble  │  │  • Filtering │      │
│  │    Extract   │  │              │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Artifacts   │  │  Datasets    │  │  Cache/      │      │
│  │  • Models    │  │  • Raw       │  │  Queue       │      │
│  │  • Configs   │  │  • Processed │  │  • Redis     │      │
│  │  • Schemas   │  │  • Seeds     │  │  (Future)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Component Details

### 1. Frontend Layer

#### Streamlit Dashboard
**Location**: `frontend_streamlit/app.py`

**Responsibilities**:
- Real-time alert visualization
- WebSocket client for live updates
- Interactive analytics and charts
- SHAP explainability visualization

**Tech Stack**:
- Streamlit 1.30+
- Plotly for charts
- Pandas for data manipulation
- WebSocket client

**Key Features**:
```python
# Real-time data flow
WebSocket → Alert Stream → DataFrame → Plotly Chart → UI Update
```

#### React Frontend (Planned)
**Status**: Future iteration

**Purpose**: Production-grade SPA for enterprise deployment

---

### 2. API Layer

#### FastAPI Application
**Location**: `backend/ids/serve/app.py`

**Endpoints**:

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/` | GET | Service info | JSON metadata |
| `/api/health` | GET | Health check | Service status |
| `/api/alerts` | GET | Get alerts | Alert list |
| `/api/alerts/{id}` | GET | Get alert by ID | Single alert |
| `/ws/alerts` | WebSocket | Live stream | Alert stream |

**Middleware Stack**:
```python
Request
  ↓
CORS Middleware (allow origins)
  ↓
Request Validation (Pydantic)
  ↓
Route Handler
  ↓
Response Serialization
  ↓
Client
```

**Configuration**:
- CORS: Configurable allowed origins
- WebSocket: Async support for real-time streaming
- Pydantic: Type validation and serialization

---

### 3. IDS Engine

#### Flow Simulation
**Location**: `backend/ids/simulate_flows.py`

**Purpose**: Generate realistic network traffic alerts for demo mode

**Alert Generation**:
```python
Flow Features:
  - Source/Destination IP
  - Protocol (TCP/UDP/ICMP)
  - Packet/Byte rates
  - Attack classification
  - Confidence score
  - Severity level
```

**Supported Attack Types**:
1. **DDoS_SYN**: SYN flood attacks
2. **DDoS_UDP**: UDP flood attacks
3. **BRUTE_FTP**: Brute force login attempts
4. **SCAN_PORT**: Port scanning activity
5. **MITM_ARP**: ARP spoofing/MITM
6. **BENIGN**: Normal traffic

#### Data Pipeline (Future)
**Location**: `backend/ids/data_pipeline/`

**Planned Features**:
- Real packet capture integration
- Feature extraction from raw traffic
- Real-time preprocessing
- SMOTE oversampling for imbalanced classes

---

### 4. ML Models

#### Current: XGBoost Baseline
**Location**: `backend/ids/models/xgb_baseline.py`

**Model Specs**:
- Algorithm: Gradient Boosted Trees
- Input: 78 network flow features (CICIDS2017 schema)
- Output: Multi-class classification (6 attack types + benign)
- Performance: ~95% accuracy on test set

**Feature Importance (Top 5)**:
1. `pkt_rate` (packet rate)
2. `syn_ratio` (SYN packet ratio)
3. `byte_rate` (bytes per second)
4. `flow_duration` (connection duration)
5. `avg_pkt_size` (average packet size)

#### Planned: Hybrid CNN-LSTM
**Status**: Iteration 2

**Architecture**:
```
Input Layer (78 features)
    ↓
CNN Block (1D convolution)
    ↓
LSTM Block (temporal patterns)
    ↓
Dense Layers (classification)
    ↓
Softmax Output (6 classes)
```

**Benefits**:
- Captures spatial patterns (CNN)
- Models temporal dependencies (LSTM)
- Higher accuracy on sequential attacks

---

### 5. Explainability Layer

#### SHAP (SHapley Additive exPlanations)
**Location**: `seed/shap_example.json`

**Purpose**: Explain individual predictions

**Output**:
```json
{
  "method": "shap_tree",
  "model": "xgboost",
  "top_features": [
    {"name": "pkt_rate", "contrib": 0.42},
    {"name": "syn_ratio", "contrib": 0.31},
    ...
  ]
}
```

**Visualization**: Horizontal bar chart in dashboard

#### LIME (Future)
**Purpose**: Local interpretable model-agnostic explanations

---

### 6. Data Storage

#### File-Based Storage (Current)

```
datasets/
├── index.yaml          # Dataset catalog
├── raw/                # Original datasets
└── processed/          # Preprocessed features

seed/
├── alerts.json         # Static alerts for testing
└── shap_example.json   # Example explanations

artifacts/
└── xgb_baseline.joblib # Trained model
```

#### Database Layer (Planned)

**PostgreSQL/TimescaleDB**:
- Time-series alert storage
- Historical analytics
- Long-term trend analysis

**Schema**:
```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    src_ip INET,
    dst_ip INET,
    protocol TEXT,
    label TEXT,
    score FLOAT,
    severity TEXT,
    features JSONB
);
```

---

## 🔄 Data Flow

### Alert Detection Flow (Demo Mode)

```
1. Simulation Engine
   ↓ generates random flow
   
2. Feature Extraction
   ↓ extracts network features
   
3. ML Model Inference
   ↓ predicts attack type
   
4. Alert Generation
   ↓ creates alert object
   
5. WebSocket Broadcast
   ↓ sends to connected clients
   
6. Dashboard Update
   ↓ displays in UI
```

### Alert Detection Flow (Production - Future)

```
1. Network Tap/SPAN Port
   ↓ raw packets
   
2. Packet Capture (tcpdump/libpcap)
   ↓ packet stream
   
3. Flow Aggregation
   ↓ grouped by 5-tuple
   
4. Feature Engineering
   ↓ statistical features
   
5. ML Pipeline
   ↓ preprocessing → prediction
   
6. Alert Management
   ↓ deduplication, prioritization
   
7. Multi-Channel Notification
   ↓ WebSocket, Email, SIEM
```

---

## 🚀 Deployment Architecture

### Development (Current)

```yaml
# docker-compose.dev.yml
services:
  ids:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - MODE=demo
      
  frontend-mock:
    image: nginx:alpine
    ports: ["5173:80"]
```

### Production (Planned)

```
┌─────────────────┐
│  Load Balancer  │
│   (Nginx/HAProxy)│
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ IDS-1  │ │ IDS-2  │  (Horizontal scaling)
└────────┘ └────────┘
    │         │
    └────┬────┘
         ▼
  ┌──────────────┐
  │  PostgreSQL  │
  │  (TimescaleDB)│
  └──────────────┘
```

---

## 🔐 Security Considerations

### Current Measures
1. **CORS**: Restricts allowed origins
2. **Input Validation**: Pydantic schemas
3. **Env Variables**: Secrets via `.env`

### Planned Enhancements
1. **Authentication**: JWT tokens for API access
2. **Rate Limiting**: Prevent abuse
3. **Encryption**: TLS/SSL for production
4. **API Keys**: Service-to-service auth
5. **Audit Logging**: Track all access

---

## 📊 Performance Characteristics

### Current Benchmarks (Iteration 1)

| Metric | Value |
|--------|-------|
| Alert Latency | < 100ms |
| WebSocket Throughput | 100+ alerts/sec |
| Memory Usage | ~200MB (base) |
| CPU Usage | < 10% (idle) |

### Optimization Strategies

1. **Caching**: Redis for frequent queries
2. **Batching**: Group alerts for processing
3. **Async I/O**: Non-blocking WebSocket
4. **Model Optimization**: ONNX runtime for faster inference

---

## 🔮 Future Enhancements

### Iteration 2: ML Pipeline
- [ ] Real data preprocessing
- [ ] Hybrid CNN-LSTM model
- [ ] Real-time SHAP explanations
- [ ] Model versioning (MLflow)

### Iteration 3: Enterprise Features
- [ ] RAG-based chatbot for security advice
- [ ] Lightweight pentesting agent
- [ ] Multi-tenant architecture
- [ ] Advanced SIEM integration

### Iteration 4: Scale & Reliability
- [ ] Kubernetes deployment
- [ ] Auto-scaling
- [ ] Distributed tracing
- [ ] High availability setup

---

## 📚 References

- [CICIDS2017 Dataset](https://www.unb.ca/cic/datasets/ids-2017.html)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SHAP Library](https://github.com/slundberg/shap)
- [XGBoost Documentation](https://xgboost.readthedocs.io/)

---

**Last Updated**: October 31, 2025  
**Version**: 0.2.0 (Iteration 1)
