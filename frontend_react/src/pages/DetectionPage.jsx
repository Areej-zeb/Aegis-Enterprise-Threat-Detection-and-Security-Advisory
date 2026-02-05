import React, { useState } from "react";
import "../index.css";
import { Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { runDetection } from "../api/aegisClient.ts";

function DetectionPage() {
  const [packetData, setPacketData] = useState("");
  const [metadata, setMetadata] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    let parsedMetadata = undefined;
    if (metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch {
        setError("Metadata must be valid JSON.");
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await runDetection({
        packet_data: packetData || undefined,
        metadata: parsedMetadata,
      });

      setResult(response);
    } catch (err) {
      console.error("Failed to run detection:", err);
      setError(err.message || "Failed to run detection");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="aegis-page">
      <header className="aegis-dash-header">
        <div>
          <h1 className="aegis-dash-title">Run Detection</h1>
          <p className="aegis-dash-subtitle">
            Submit sample traffic or metadata to the Aegis detection endpoint.
          </p>
        </div>
      </header>

      {error && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "#fee2e2",
            color: "#b91c1c",
            borderRadius: "0.75rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <section className="aegis-dash-main-grid">
        <div className="aegis-dash-left-col">
          <div className="aegis-card">
            <div className="aegis-card-header">
              <h2>Detection Form</h2>
              <span className="aegis-card-subtitle">
                This is a thin wrapper over the Aegis `/detections` API.
              </span>
            </div>
            <form
              onSubmit={handleSubmit}
              style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label
                  htmlFor="packet-data"
                  className="aegis-field-label"
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  Packet Data (optional)
                </label>
                <textarea
                  id="packet-data"
                  value={packetData}
                  onChange={(e) => setPacketData(e.target.value)}
                  rows={6}
                  className="aegis-textarea"
                  placeholder="Paste raw packet or flow text here…"
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              <div>
                <label
                  htmlFor="metadata"
                  className="aegis-field-label"
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  Metadata JSON (optional)
                </label>
                <textarea
                  id="metadata"
                  value={metadata}
                  onChange={(e) => setMetadata(e.target.value)}
                  rows={6}
                  className="aegis-textarea"
                  placeholder='e.g. { "src_ip": "10.0.0.5", "dest_ip": "203.0.113.10" }'
                  style={{ width: "100%", resize: "vertical", fontFamily: "monospace" }}
                />
              </div>

              <button
                type="submit"
                className="ids-pentest-btn cursor-hotspot-action"
                disabled={loading}
              >
                <Play size={16} />
                {loading ? "Running…" : "Run Detection"}
              </button>
            </form>
          </div>
        </div>

        <div className="aegis-dash-right-col">
          <div className="aegis-card">
            <div className="aegis-card-header">
              <h2>Detection Result</h2>
              <span className="aegis-card-subtitle">
                Shows the raw response from the Aegis API.
              </span>
            </div>
            <div style={{ padding: "1rem" }}>
              {!loading && !result && !error && (
                <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                  Submit the form to see a detection result.
                </p>
              )}

              {loading && <p>Waiting for detection result…</p>}

              {result && (
                <div
                  style={{
                    marginBottom: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: result.is_attack ? "#dc2626" : "#16a34a",
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>
                    {result.is_attack
                      ? `Attack detected: ${result.attack_type || "Unknown"}`
                      : "No attack detected"}
                    {" · "}
                    Confidence {result.confidence.toFixed(2)}
                  </span>
                </div>
              )}

              {result && (
                <pre
                  style={{
                    fontSize: "0.8rem",
                    background: "#040816",
                    color: "#e5e7eb",
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    overflowX: "auto",
                  }}
                >
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DetectionPage;


