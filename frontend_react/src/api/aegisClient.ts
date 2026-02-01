// src/api/aegisClient.ts

const API_BASE_URL =
  import.meta.env.VITE_AEGIS_API_BASE_URL || "http://localhost:8000";

// ---------- Common envelope & error ----------

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiEnvelope<TData = unknown, TMeta = unknown> {
  data: TData | null;
  meta: TMeta | null;
  error: ApiError | null;
}

// ---------- Core domain types ----------

// /api/v1/health
export interface HealthStatus {
  status: string;
  uptime_seconds: number;
  version: string;
  components: {
    api: string;
    model_engine: string;
    database: string;
    [key: string]: string;
  };
}

// /api/v1/system/status
export interface SystemModelInfo {
  name: string;
  attacks: string[];
  status?: string;
  version?: string;
}

export interface SystemStatus {
  models: SystemModelInfo[];
  supported_attack_types: string[];
  environment: {
    gpu_available: boolean;
    device: string;
    python_version: string;
    [key: string]: any;
  };
}

// Detection input/result as per FastAPI contract
export type DetectionSource =
  | "LIVE_CAPTURE"
  | "PCAP_IMPORT"
  | "LOG_IMPORT"
  | "MANUAL_INPUT";

export interface DetectionContext {
  src_ip?: string;
  dst_ip?: string;
  src_port?: number;
  dst_port?: number;
  protocol?: string;
  transport?: string;
  extra_tags?: string[];
  [key: string]: any;
}

export interface DetectionFeatures {
  [featureName: string]: number;
}

export interface DetectionInput {
  source: DetectionSource;
  context: DetectionContext;
  features: DetectionFeatures;
  model_hint?: string;
  [key: string]: any;
}

export type AttackFamily =
  | "AVAILABILITY"
  | "CONFIDENTIALITY"
  | "INTEGRITY"
  | "C2"
  | "EXFILTRATION"
  | "OTHER"
  | null;

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface DetectionLabels {
  source: string;
  dataset: string;
  [key: string]: any;
}

export interface DetectionResult {
  id: string;
  timestamp: string;
  is_attack: boolean;
  attack_type: string | null;
  attack_family: AttackFamily;
  score: number; // 0–1 confidence
  severity: Severity;
  labels: DetectionLabels;
  explanation_available: boolean;
  [key: string]: any;
}

// Alerts
export type AlertStatus =
  | "NEW"
  | "ACKNOWLEDGED"
  | "SUPPRESSED"
  | "RESOLVED";

export interface Alert {
  id: string;
  detection_id?: string;
  timestamp: string;
  src_ip?: string;
  dst_ip?: string;
  attack_type: string;
  severity: Severity;
  status: AlertStatus;
  score?: number;
  description?: string;
  tags?: string[];
  meta?: {
    model_name?: string;
    rule_id?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  [key: string]: any;
}

export interface AlertsResponse {
  alerts: Alert[];
  meta: PaginationMeta;
}

// Metrics
export interface TimeRange {
  from: string;
  to: string;
}

export interface MetricsOverview {
  time_range: TimeRange;
  total_flows: number;
  total_alerts: number;
  attack_counts: Record<string, number>;
  severity_counts: Record<string, number>;
  last_updated: string;
  [key: string]: any;
}

// Explainability
export interface TopFeatureImportance {
  name: string;
  importance: number;
  direction: "POSITIVE" | "NEGATIVE" | "NEUTRAL" | string;
}

export interface Explanation {
  detection_id: string;
  model_name: string;
  method: string;
  top_features: TopFeatureImportance[];
  raw_values?: {
    feature_importances?: Record<string, number>;
    [key: string]: any;
  };
  narrative: string;
  [key: string]: any;
}

// ---------- Query param types ----------

export interface AlertsParams {
  page?: number;
  page_size?: number;
  severity?: Severity;
  attack_type?: string;
  status?: AlertStatus;
  from?: string;
  to?: string;
  search?: string;
}

export interface MetricsParams {
  from?: string;
  to?: string;
}

// ---------- Helpers ----------

function buildUrl(path: string, params?: Record<string, any>): string {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !Number.isNaN(value as any)
      ) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

async function apiFetch<TData = unknown, TMeta = unknown>(
  path: string,
  options: RequestInit = {},
  params?: Record<string, any>
): Promise<ApiEnvelope<TData, TMeta>> {
  const url = buildUrl(path, params);

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let envelope: ApiEnvelope<TData, TMeta>;
  try {
    envelope = (await response.json()) as ApiEnvelope<TData, TMeta>;
  } catch (err) {
    throw new Error(
      `Failed to parse response from ${url}: ${response.status} ${response.statusText}`
    );
  }

  if (!response.ok) {
    if (envelope && envelope.error) {
      throw new Error(
        `${envelope.error.code}: ${envelope.error.message}`
      );
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  if (!envelope) {
    throw new Error(`Empty response envelope from ${url}`);
  }

  return envelope;
}

function unwrapEnvelope<TData, TMeta = unknown>(
  envelope: ApiEnvelope<TData, TMeta>
): ApiEnvelope<TData, TMeta> {
  if (envelope.error) {
    throw new Error(`${envelope.error.code}: ${envelope.error.message}`);
  }
  if (envelope.data == null) {
    throw new Error("Response data is null/undefined");
  }
  return envelope;
}

// ---------- Exported API functions ----------

// Health
export async function checkHealth(): Promise<HealthStatus> {
  try {
    // Your backend uses /api/health and returns a different format
    const response = await fetch(buildUrl("/api/health"), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Health Check] HTTP error:', response.status, response.statusText);
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Health Check] Response:', data);

    // Map your backend's format to expected format
    const healthStatus = {
      status: data.status || 'unknown',
      uptime_seconds: 0,
      version: '1.0.0',
      components: {
        api: data.status || 'unknown',
        model_engine: data.service || 'unknown',
        database: data.mode || 'unknown',
      },
      // Store mode for environment detection
      mode: data.mode,
    } as any;

    console.log('[Health Check] Mapped status:', healthStatus);
    return healthStatus;
  } catch (error) {
    console.error('[Health Check] Error:', error);
    throw error;
  }
}

// System status
export async function getSystemStatus(): Promise<SystemStatus> {
  try {
    const response = await fetch(buildUrl("/api/system/status"));

    if (!response.ok) {
      throw new Error(`Failed to fetch system status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[System Status] Received:', data);
    return data;
  } catch (error) {
    console.error('[System Status] Error:', error);
    return {
      models: [],
      supported_attack_types: [],
      environment: {
        gpu_available: false,
        device: 'cpu',
        python_version: '3.10',
      },
    };
  }
}

// Alerts - using real ML detections
export async function fetchAlerts(
  params?: AlertsParams
): Promise<AlertsResponse> {
  // Use live detection endpoint for real ML predictions
  const numFlows = params?.page_size || 20;
  const response = await fetch(buildUrl("/api/detection/live", { n: numFlows }));

  if (!response.ok) {
    throw new Error(`Failed to fetch alerts: ${response.statusText}`);
  }

  const data = await response.json();
  const rawDetections = data.detections || [];

  // Map ML detections to alert format
  const alerts = rawDetections.map((det: any) => ({
    id: det.id,
    detection_id: det.id,
    timestamp: det.timestamp,
    src_ip: det.src_ip || det.source_ip,
    dst_ip: det.dst_ip || det.destination_ip,
    source_ip: det.src_ip || det.source_ip,
    destination_ip: det.dst_ip || det.destination_ip,
    attack_type: det.attack_type || det.label,
    label: det.label,
    severity: (det.severity || 'medium').toLowerCase(),
    status: 'NEW' as AlertStatus,
    score: det.score,
    confidence: det.score,
    description: `${det.model_type} detection: ${det.label}`,
    tags: [det.model_type],
    model_type: det.model_type,
    protocol: det.protocol,
    srcPort: det.src_port,
    destPort: det.dst_port,
    source_port: det.src_port,
    destination_port: det.dst_port,
    sensor: `${det.model_type} Model`,
    meta: {
      protocol: det.protocol,
      src_port: det.src_port,
      dst_port: det.dst_port,
    },
  }));

  return {
    alerts,
    meta: {
      page: params?.page || 1,
      page_size: alerts.length,
      total_items: alerts.length,
      total_pages: 1,
    },
  };
}

// Metrics overview
export async function getMetricsOverview(
  params?: MetricsParams
): Promise<MetricsOverview> {
  try {
    const response = await fetch(buildUrl("/api/metrics/overview"));

    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Metrics] Received:', data);
    return data;
  } catch (error) {
    console.error('[Metrics] Error fetching metrics:', error);
    // Return empty metrics
    return {
      time_range: {
        from: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
      total_flows: 0,
      total_alerts: 0,
      attack_counts: {},
      severity_counts: { low: 0, medium: 0, high: 0, critical: 0 },
      last_updated: new Date().toISOString(),
    };
  }
}

// Run detection
export async function runDetection(
  input: DetectionInput
): Promise<DetectionResult> {
  // Your backend doesn't have this endpoint
  console.warn('[Detection] Endpoint not available');
  throw new Error('Detection endpoint not implemented on backend');
}

// Explain detection
export async function getExplanation(
  detectionId: string
): Promise<Explanation> {
  // URL encode the detection ID to handle special characters
  const encodedId = encodeURIComponent(detectionId);
  const response = await fetch(buildUrl(`/api/explainability/${encodedId}`));

  if (!response.ok) {
    // Try to get more specific error information
    let errorMessage = 'EXPLANATION_NOT_AVAILABLE';
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      // If response is not JSON, use status-based error
      if (response.status === 404) {
        errorMessage = 'DETECTION_NOT_FOUND';
      } else if (response.status === 500) {
        errorMessage = 'EXPLANATION_SERVER_ERROR';
      }
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Example usage (for reference only, do NOT paste into production components):
 *
 * async function demo() {
 *   const health = await checkHealth();
 *   console.log("Health:", health);
 *
 *   const { alerts, meta } = await fetchAlerts({ page: 1, page_size: 20 });
 *   console.log("Alerts:", alerts.length, "meta:", meta);
 *
 *   const detection = await runDetection({
 *     source: "MANUAL_INPUT",
 *     context: {
 *       src_ip: "192.168.0.10",
 *       dst_ip: "10.0.0.5",
 *       src_port: 443,
 *       dst_port: 8080,
 *       protocol: "TCP",
 *       transport: "IPv4",
 *       extra_tags: ["demo"],
 *     },
 *     features: {
 *       flow_duration_ms: 1200,
 *       packet_count: 50,
 *       byte_count: 4096,
 *     },
 *   });
 *
 *   console.log("Detection:", detection.id, detection.is_attack);
 * }
 */

// ---------- 3-Phase Evaluation API ----------

export interface Phase1Results {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix?: number[][];
  roc_auc?: number;
  classification_report?: any;
}

export interface Phase2Results {
  scenario: string;
  description: string;
  total_flows: number;
  detected_attacks: number;
  missed_attacks: number;
  false_positives: number;
  detection_rate: number;
  precision: number;
  f1_score: number;
}

export interface Phase3Results {
  total_processed: number;
  attacks_detected: number;
  benign_classified: number;
  detection_rate: number;
  avg_latency_ms?: number;
  throughput_fps?: number;
}

export interface EvaluationResponse {
  phase: number;
  attack_type: string;
  results: Phase1Results | Phase2Results[] | Phase3Results;
  timestamp: string;
}

/**
 * Run Phase 1 Evaluation: Dataset-level metrics
 */
export async function runPhase1Evaluation(
  attackType: "Syn" | "mitm_arp" | "dns_exfiltration"
): Promise<EvaluationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/evaluation/phase1/${attackType}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `Phase 1 evaluation failed (${response.status})`
    );
  }

  return response.json();
}

/**
 * Run Phase 2 Evaluation: Scenario-based testing
 */
export async function runPhase2Evaluation(
  attackType: "Syn" | "mitm_arp" | "dns_exfiltration",
  scenario?: "all_benign" | "pure_attack" | "mixed_timeline" | "stealth_slow"
): Promise<EvaluationResponse> {
  const url = new URL(`${API_BASE_URL}/api/evaluation/phase2/${attackType}`);
  if (scenario) {
    url.searchParams.set("scenario", scenario);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `Phase 2 evaluation failed (${response.status})`
    );
  }

  return response.json();
}

/**
 * Run Phase 3 Evaluation: System-level batch processing
 */
export async function runPhase3Evaluation(
  attackType: "Syn" | "mitm_arp" | "dns_exfiltration" | "all",
  batchSize: number = 100,
  testType: "benign" | "attack" | "mixed" = "mixed"
): Promise<EvaluationResponse> {
  const url = new URL(`${API_BASE_URL}/api/evaluation/phase3/batch`);
  url.searchParams.set("attack_type", attackType);
  url.searchParams.set("batch_size", batchSize.toString());
  url.searchParams.set("test_type", testType);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `Phase 3 evaluation failed (${response.status})`
    );
  }

  return response.json();
}

/**
 * Get evaluation summary for all phases
 */
export async function getEvaluationSummary(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/evaluation/summary`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `Evaluation summary failed (${response.status})`
    );
  }

  return response.json();
}

// ---------- Live ML Detection API ----------

export interface LiveDetection {
  id: string;
  timestamp: string;
  model_type: string;
  label: string;
  score: number;
  severity: string;
  attack_type: string | null;
  src_ip?: string;
  dst_ip?: string;
  protocol?: string;
  explanation?: any;
}

export interface LiveDetectionResponse {
  detections: LiveDetection[];
  total: number;
}

/**
 * Fetch live detections from trained models
 */
export async function fetchLiveDetections(
  numFlows: number = 10,
  attackTypes?: string[]
): Promise<LiveDetectionResponse> {
  const url = new URL(`${API_BASE_URL}/api/detection/live`);
  url.searchParams.set("n", numFlows.toString());

  if (attackTypes && attackTypes.length > 0) {
    attackTypes.forEach(type => {
      url.searchParams.append("attack_types", type);
    });
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `Failed to fetch detections (${response.status})`
    );
  }

  return response.json();
}

// ---------- Pentesting API ----------

export interface Vulnerability {
  id: string;
  cve_id?: string;
  severity_score: number;
  severity_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  known_exploited: boolean;
  title?: string;
  description: string;
}

export interface Port {
  port: number;
  protocol: string;
  state: string;
  service: string;
  product?: string;
  version?: string;
  vulnerabilities?: Vulnerability[];
  risk_score?: number;
  vuln_count?: number;
}

export interface Host {
  ip: string;
  status: string;
  ports: Port[];
}

export interface PentestResult {
  hosts: Host[];
}

export interface PentestScan {
  id: string;
  target: string;
  type: string;
  status: "pending" | "running" | "completed" | "failed";
  created_at: string;
  completed_at?: string;
  result?: PentestResult;
  error?: string;
}

export interface PentestResponse {
  scan_id: string;
  status: string;
}

/**
 * Trigger a new pentest scan
 */
export async function runPentest(
  target: string,
  scanType: "quick" | "full" | "stealth" = "quick"
): Promise<PentestResponse> {
  const response = await fetch(buildUrl("/api/pentest/scan"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ target, scan_type: scanType }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `Failed to start scan (${response.status})`
    );
  }

  return response.json();
}

/**
 * Get results of a specific scan
 */
export async function getPentestResult(scanId: string): Promise<PentestScan> {
  const response = await fetch(buildUrl(`/api/pentest/results/${scanId}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch scan results (${response.status})`);
  }

  return response.json();
}

/**
 * Get history of all scans
 */
export async function getPentestHistory(): Promise<PentestScan[]> {
  const response = await fetch(buildUrl("/api/pentest/history"), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.error("Failed to fetch pentest history");
    return [];
  }

  return response.json();
}
