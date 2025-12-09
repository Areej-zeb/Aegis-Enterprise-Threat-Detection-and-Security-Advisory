import logging
import json
import uuid
from pathlib import Path
from typing import List, Optional, Dict
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta

import pandas as pd
import numpy as np

# -----------------------------------------------------------------------------
# Logging setup
# -----------------------------------------------------------------------------
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    filename=str(LOG_DIR / "mock_stream.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger("aegis.mock_stream")


# -----------------------------------------------------------------------------
# Data models
# -----------------------------------------------------------------------------
@dataclass
class MockAlert:
    id: str
    timestamp: str          # ISO string, easier to JSON-encode
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    attack_type: str
    severity: str
    phase: str
    score: float
    label: str              # "BENIGN" or "ATTACK"


@dataclass
class MockMetrics:
    total_alerts: int
    active_alerts: int
    detection_rate: float
    avg_response_time: float
    severity_distribution: Dict[str, int]
    attack_type_distribution: Dict[str, int]


# -----------------------------------------------------------------------------
# Mock engine
# -----------------------------------------------------------------------------
class ParquetMockEngine:
    def __init__(self) -> None:
        self.df: Optional[pd.DataFrame] = None
        self.column_map: Dict[str, str] = {}
        self.distributions: Dict[str, pd.Series] = {}
        self.benign_ratio: float = 0.5  # default if we can't infer
        logger.info("ParquetMockEngine initialized")

    # ------------------------------------------------------------------ #
    # Loading + analysis                                                 #
    # ------------------------------------------------------------------ #
    def load_and_analyse(self, data_dir: Path) -> None:
        """
        Load ALL parquet files under data_dir (recursively) and build
        empirical distributions for label, attack_type, severity, etc.
        """
        data_dir = Path(data_dir)
        logger.info("Loading Parquet files from %s", data_dir)

        parquet_files = list(data_dir.rglob("*.parquet"))
        if not parquet_files:
            raise ValueError(f"No Parquet files found in {data_dir}")

        dfs = []
        for file in parquet_files:
            logger.info("Reading %s", file)
            df_part = pd.read_parquet(file)
            dfs.append(df_part)
            logger.info("Loaded %d rows from %s", len(df_part), file)

        self.df = pd.concat(dfs, ignore_index=True)
        logger.info("Total rows loaded: %d", len(self.df))

        # Map columns with flexible candidates
        candidates = {
            "label": ["label", "Label", "is_attack", "attack_label"],
            "attack_type": ["attack_type", "Attack_Type", "attack_category"],
            "severity": ["severity", "Severity", "alert_severity"],
            "timestamp": ["timestamp", "Timestamp", "time"],
            "protocol": ["protocol", "Protocol", "proto"],
            "src_ip": ["src_ip", "Src_IP", "source_ip"],
            "dst_ip": ["dst_ip", "Dst_IP", "destination_ip"],
            "src_port": ["src_port", "Src_Port", "source_port"],
            "dst_port": ["dst_port", "Dst_Port", "destination_port"],
        }

        cols_lower = {c.lower(): c for c in self.df.columns}

        for key, cand_list in candidates.items():
            found = None
            for cand in cand_list:
                c_lower = cand.lower()
                if c_lower in cols_lower:
                    found = cols_lower[c_lower]
                    break
            if found:
                self.column_map[key] = found
                logger.info("Mapped %s -> %s", key, found)
            else:
                logger.warning("No column found for %s", key)

        self._build_distributions()
        logger.info("Distributions built")

    def _build_distributions(self) -> None:
        """
        Build simple value-count distributions for all mapped columns.
        Also compute benign/attack ratio from the label column.
        """
        assert self.df is not None, "Dataframe not loaded"
        df = self.df

        # Label distribution + benign ratio
        if "label" in self.column_map:
            label_col = self.column_map["label"]
            labels_norm = (
                df[label_col].astype(str).str.lower().str.strip()
            )  # normalise
            label_counts = labels_norm.value_counts()
            self.distributions["label"] = label_counts / label_counts.sum()

            benign_count = int(label_counts.get("benign", 0))
            total = int(label_counts.sum())
            attack_count = total - benign_count
            if total > 0:
                self.benign_ratio = benign_count / total
            else:
                self.benign_ratio = 0.5

            logger.info(
                "Label distribution: %s", label_counts.to_dict()
            )
            logger.info(
                "Benign count=%d, attack count=%d, benign_ratio=%.3f",
                benign_count,
                attack_count,
                self.benign_ratio,
            )
        else:
            logger.warning(
                "No label column mapped, using default benign_ratio=0.5"
            )
            self.benign_ratio = 0.5

        # Other distributions
        for key in [
            "attack_type",
            "severity",
            "protocol",
            "src_ip",
            "dst_ip",
            "src_port",
            "dst_port",
        ]:
            if key in self.column_map:
                col = self.column_map[key]
                if key in ["src_port", "dst_port"]:
                    # Ensure port columns are numeric to avoid int() conversion errors
                    numeric_col = pd.to_numeric(df[col], errors='coerce').dropna().astype(int)
                    counts = numeric_col.value_counts(normalize=True)
                else:
                    counts = df[col].value_counts(normalize=True)
                self.distributions[key] = counts
                logger.info(
                    "Top values for %s: %s",
                    key,
                    dict(counts.head(5)),
                )

    # ------------------------------------------------------------------ #
    # Generation helpers                                                 #
    # ------------------------------------------------------------------ #
    def _sample_from_dist(self, key: str, default_value):
        """
        Sample a value from a learned distribution if available,
        otherwise return the provided default.
        """
        series = self.distributions.get(key)
        if series is None or series.empty:
            return default_value
        return np.random.choice(series.index, p=series.values)

    # ------------------------------------------------------------------ #
    # Public generation API                                              #
    # ------------------------------------------------------------------ #
    def generate_alerts(
        self,
        n: int,
        phase: str = "dataset",
        benign_override_ratio: Optional[float] = None,
        start_time: Optional[datetime] = None,
        time_step_seconds: int = 5,
    ) -> List[MockAlert]:
        """
        Generate n mock alerts using distributions learnt from parquet.
        """
        if self.df is None:
            raise ValueError("Data not loaded. Call load_and_analyse first.")

        if start_time is None:
            start_time = datetime.utcnow()

        benign_ratio = (
            float(benign_override_ratio)
            if benign_override_ratio is not None
            else float(self.benign_ratio)
        )
        benign_ratio = float(np.clip(benign_ratio, 0.0, 1.0))

        alerts: List[MockAlert] = []

        for i in range(n):
            ts = start_time + timedelta(seconds=i * time_step_seconds)
            ts_str = ts.isoformat() + "Z"

            label = np.random.choice(
                ["BENIGN", "ATTACK"],
                p=[benign_ratio, 1.0 - benign_ratio],
            )

            alert = MockAlert(
                id=str(uuid.uuid4()),
                timestamp=ts_str,
                src_ip=str(self._sample_from_dist("src_ip", "192.168.1.10")),
                dst_ip=str(self._sample_from_dist("dst_ip", "10.0.0.5")),
                src_port=int(self._sample_from_dist("src_port", 443)),
                dst_port=int(self._sample_from_dist("dst_port", 80)),
                protocol=str(self._sample_from_dist("protocol", "TCP")),
                attack_type=str(
                    self._sample_from_dist("attack_type", "NORMAL")
                ),
                severity=str(self._sample_from_dist("severity", "LOW")),
                phase=phase,
                score=float(np.random.uniform(0.5, 0.999)),  # reasonable score
                label=label,
            )
            alerts.append(alert)

        logger.info("Generated %d alerts for phase=%s", n, phase)
        return alerts

    def summarise_metrics(self, alerts: List[MockAlert]) -> MockMetrics:
        """
        Aggregate a batch of alerts into dashboard metrics.
        """
        total_alerts = len(alerts)
        attack_alerts = [a for a in alerts if a.label == "ATTACK"]
        active_alerts = len(attack_alerts)
        detection_rate = (
            active_alerts / total_alerts if total_alerts > 0 else 0.0
        )

        # Just a synthetic but stable-ish value for demo
        avg_response_time = float(
            np.clip(np.random.normal(loc=2.3, scale=0.5), 0.3, 10.0)
        )

        severity_distribution: Dict[str, int] = {}
        for a in alerts:
            severity_distribution[a.severity] = (
                severity_distribution.get(a.severity, 0) + 1
            )

        attack_type_distribution: Dict[str, int] = {}
        for a in attack_alerts:
            attack_type_distribution[a.attack_type] = (
                attack_type_distribution.get(a.attack_type, 0) + 1
            )

        metrics = MockMetrics(
            total_alerts=total_alerts,
            active_alerts=active_alerts,
            detection_rate=round(detection_rate, 3),
            avg_response_time=round(avg_response_time, 2),
            severity_distribution=severity_distribution,
            attack_type_distribution=attack_type_distribution,
        )
        logger.info("Summarised metrics for %d alerts", total_alerts)
        return metrics

    def export_mock_batch(
        self,
        out_path: Path,
        n: int,
        phase: str = "dataset",
        benign_override_ratio: Optional[float] = None,
    ) -> None:
        """
        Convenience: generate a batch + metrics and dump to JSON file.
        """
        alerts = self.generate_alerts(
            n=n,
            phase=phase,
            benign_override_ratio=benign_override_ratio,
        )
        metrics = self.summarise_metrics(alerts)

        payload = {
            "phase": phase,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "alerts": [asdict(a) for a in alerts],
            "metrics": asdict(metrics),
        }

        out_path = Path(out_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        logger.info("Exported mock batch to %s", out_path)


# -----------------------------------------------------------------------------
# CLI usage for quick testing
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate mock alerts from Parquet data"
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path("datasets/processed"),
        help="Directory containing Parquet files (searched recursively)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        required=True,
        help="Output JSON file path",
    )
    parser.add_argument(
        "--n",
        type=int,
        default=100,
        help="Number of alerts to generate",
    )
    parser.add_argument(
        "--phase",
        type=str,
        default="dataset",
        help="Phase for alerts (dataset/scenario/system)",
    )
    parser.add_argument(
        "--benign-ratio",
        type=float,
        help="Override benign ratio (0.0–1.0); if omitted, use dataset ratio",
    )

    args = parser.parse_args()

    engine = ParquetMockEngine()
    engine.load_and_analyse(args.data_dir)
    engine.export_mock_batch(
        out_path=args.out,
        n=args.n,
        phase=args.phase,
        benign_override_ratio=args.benign_ratio,
    )
