from __future__ import annotations

from enum import Enum
from typing import List, Any, Dict
from pydantic import BaseModel
import asyncio


class Severity(Enum):
	LOW = "low"
	MEDIUM = "medium"
	HIGH = "high"


class FeatureContribution(BaseModel):
	name: str
	contrib: float


class Explainability(BaseModel):
	shap_values: List[float]
	base_value: float
	shap_sum: float
	top_indices: List[int]


class Alert(BaseModel):
	id: str
	timestamp: Any
	src_ip: str
	dst_ip: str
	src_port: int
	dst_port: int
	protocol: str
	label: str
	score: float
	severity: Severity
	top_features: List[FeatureContribution]
	explainability: Explainability


async def handle_alert(alert_data: Dict[str, Any]) -> Dict[str, Any]:
	"""Validate and format an alert for downstream consumers (chatbot, UI).

	Returns a simple dict with human-friendly fields used by the bridge's
	example callback (e.g. `label_human`, `severity`, `top_features`).
	"""
	# Normalize severity if an enum is passed in
	if isinstance(alert_data.get("severity"), Severity):
		alert_data["severity"] = alert_data["severity"]

	alert = Alert(**alert_data)

	formatted = alert.dict()
	# Human readable label
	formatted["label_human"] = alert.label.replace("_", " ").title()

	# Ensure severity is an uppercase string
	sev = alert.severity
	if isinstance(sev, Severity):
		formatted["severity"] = sev.name
	else:
		formatted["severity"] = str(sev).upper()

	# Convert FeatureContribution models to simple dicts with expected keys
	formatted["top_features"] = [
		{"name": f.name, "contrib": f.contrib} for f in alert.top_features
	]

	return formatted


async def start_alert_stream(callback, mode: str = "demo") -> None:
	"""Simple demo/static stream for testing integrations.

	When `mode` is `demo` or `static` this will emit a few synthetic alerts
	(via `handle_alert`) and call the provided callback. This lets the bridge
	be exercised without a live Aegis websocket.
	"""
	# Emit a small handful of demo alerts
	demo_alerts = [
		{
			"id": "demo-1",
			"timestamp": "2025-01-01T12:00:00+00:00",
			"src_ip": "10.0.0.1",
			"dst_ip": "10.0.0.2",
			"src_port": 12345,
			"dst_port": 80,
			"protocol": "TCP",
			"label": "syn_flood",
			"score": 0.92,
			"severity": Severity.HIGH,
			"top_features": [
				{"name": "SYN Flag Count", "contrib": 0.42},
				{"name": "pkt_rate", "contrib": 0.31},
			],
			"explainability": {
				"shap_values": [0.42, 0.31, 0.1, 0.0, -0.02],
				"base_value": 0.5,
				"shap_sum": 0.81,
				"top_indices": [0, 1]
			}
		},
		{
			"id": "demo-2",
			"timestamp": "2025-01-01T12:00:05+00:00",
			"src_ip": "10.0.0.3",
			"dst_ip": "10.0.0.4",
			"src_port": 54321,
			"dst_port": 53,
			"protocol": "UDP",
			"label": "dns_tunnel",
			"score": 0.78,
			"severity": Severity.MEDIUM,
			"top_features": [
				{"name": "payload_entropy", "contrib": 0.33},
				{"name": "subdomain_length", "contrib": 0.29},
			],
			"explainability": {
				"shap_values": [0.33, 0.29, 0.05, 0.01, 0.0],
				"base_value": 0.5,
				"shap_sum": 0.68,
				"top_indices": [0, 1]
			}
		}
	]

	for a in demo_alerts:
		# Normalize FeatureContribution and Explainability for pydantic
		a["top_features"] = [FeatureContribution(**f) for f in a.get("top_features", [])]
		a["explainability"] = Explainability(**a["explainability"]) if a.get("explainability") else None

		formatted = await handle_alert(a)
		if callback:
			await callback(formatted)
