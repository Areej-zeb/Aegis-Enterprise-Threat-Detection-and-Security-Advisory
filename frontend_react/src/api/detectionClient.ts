// src/api/detectionClient.ts
// API client for real-time ML detection endpoints

const API_BASE_URL = import.meta.env.VITE_AEGIS_API_BASE_URL || "http://localhost:8000";

export interface Detection {
  id: string;
  timestamp: string;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: string;
  attack_type: string;
  severity: "low" | "medium" | "high" | "critical";
  phase: string;
  score: number;
  label: "BENIGN" | "ATTACK";
  raw_label: string;
  true_label: string;
  model_type: string;
}

export interface DetectionMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  total_predictions: number;
  confusion_matrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
}

export interface LiveDetectionsResponse {
  detections: Detection[];
  count: number;
  metrics: DetectionMetrics;
  timestamp: string;
}

export interface ModelInfo {
  type: string;
  classes: string[];
  num_classes: number;
}

export interface DatasetInfo {
  samples: number;
  features: number;
}

export interface DetectionInfo {
  models_loaded: number;
  models: Record<string, ModelInfo>;
  datasets_loaded: number;
  datasets: Record<string, DatasetInfo>;
}

export interface ModelStatus {
  syn_loaded: boolean;
  mitm_loaded: boolean;
  dns_loaded: boolean;
}

/**
 * Fetch live detections from ML models
 */
export async function fetchLiveDetections(
  count: number = 10,
  attackType?: string
): Promise<LiveDetectionsResponse> {
  const params = new URLSearchParams({
    n: count.toString(),
  });
  
  if (attackType && attackType !== "all") {
    params.append("attack_type", attackType);
  }
  
  const response = await fetch(`${API_BASE_URL}/api/detection/live?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch live detections: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch current detection metrics
 */
export async function fetchDetectionMetrics(): Promise<DetectionMetrics> {
  const response = await fetch(`${API_BASE_URL}/api/detection/metrics`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch metrics: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch detection system info (models and datasets)
 */
export async function fetchDetectionInfo(): Promise<DetectionInfo> {
  const response = await fetch(`${API_BASE_URL}/api/detection/info`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch detection info: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch model loading status
 */
export async function fetchModelStatus(): Promise<ModelStatus> {
  const response = await fetch(`${API_BASE_URL}/api/models/status`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch model status: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Connect to WebSocket for live detection streaming
 */
export function connectLiveDetectionWebSocket(
  onMessage: (detection: Detection) => void,
  onError?: (error: Event) => void,
  onClose?: () => void
): WebSocket {
  const wsUrl = API_BASE_URL.replace("http", "ws");
  const ws = new WebSocket(`${wsUrl}/ws/detection/live`);
  
  ws.onmessage = (event) => {
    try {
      const detection = JSON.parse(event.data) as Detection;
      onMessage(detection);
    } catch (error) {
      console.error("Failed to parse detection message:", error);
    }
  };
  
  if (onError) {
    ws.onerror = onError;
  }
  
  if (onClose) {
    ws.onclose = onClose;
  }
  
  return ws;
}

/**
 * Export detection data as JSON
 */
export function exportDetectionsAsJSON(detections: Detection[]): void {
  const dataStr = JSON.stringify(detections, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `aegis-detections-${new Date().toISOString()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export detection data as CSV
 */
export function exportDetectionsAsCSV(detections: Detection[]): void {
  const headers = [
    "ID",
    "Timestamp",
    "Source IP",
    "Destination IP",
    "Source Port",
    "Destination Port",
    "Protocol",
    "Attack Type",
    "Severity",
    "Score",
    "Label",
    "Model Type"
  ];
  
  const rows = detections.map(d => [
    d.id,
    d.timestamp,
    d.src_ip,
    d.dst_ip,
    d.src_port,
    d.dst_port,
    d.protocol,
    d.attack_type,
    d.severity,
    d.score,
    d.label,
    d.model_type
  ]);
  
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");
  
  const dataBlob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `aegis-detections-${new Date().toISOString()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
