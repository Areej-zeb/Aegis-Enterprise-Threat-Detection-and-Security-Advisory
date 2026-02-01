import json
import logging
import os
from typing import Dict, List
from .models import Vulnerability
from .sources.cisa import CisaKevIngestor
from .sources.nvd import NvdIngestor

logger = logging.getLogger(__name__)

class VulnDataManager:
    """
    Orchestrates data ingestion and persistence.
    Acts as the single source of truth for vulnerability data.
    """
    DB_PATH = os.path.join(os.path.dirname(__file__), "..", "pentest", "data", "cve_db.json")

    def __init__(self):
        self.db: Dict[str, Vulnerability] = {}
        self.ensure_db_dir()

    def ensure_db_dir(self):
        os.makedirs(os.path.dirname(self.DB_PATH), exist_ok=True)

    def load_db(self):
        """Loads existing DB from disk."""
        if os.path.exists(self.DB_PATH):
            try:
                with open(self.DB_PATH, 'r') as f:
                    data = json.load(f)
                    # Deserialize
                    for item in data:
                        try:
                            vuln = Vulnerability(**item)
                            self.db[vuln.id] = vuln
                        except Exception as e:
                            logger.error(f"Failed to load vuln from DB: {e}")
                logger.info(f"Loaded {len(self.db)} vulnerabilities from local DB.")
            except Exception as e:
                logger.error(f"Failed to read DB file: {e}")
        else:
            logger.info("No local DB found. Starting fresh.")

    def save_db(self):
        """Persists DB to disk."""
        try:
            # Serialize
            data = [v.dict(exclude_none=True) for v in self.db.values()]
            # Custom JSON encoder for datetime might be needed, strictly pydantic .dict() handles it usually if using .json() but here we list
            # Pydantic v1 vs v2. .model_dump(mode='json') in v2. using .dict() for compat or v1. 
            # If datetime objects persist, json.dump will fail. Pydantic's .json() is safer but for a list...
            
            # Helper to convert datetimes
            def json_serial(obj):
                if hasattr(obj, 'isoformat'):
                    return obj.isoformat()
                raise TypeError ("Type not serializable")

            with open(self.DB_PATH, 'w') as f:
                json.dump(data, f, default=json_serial, indent=2)
            logger.info(f"Saved {len(self.db)} vulnerabilities to {self.DB_PATH}")
        except Exception as e:
            logger.error(f"Failed to save DB: {e}")

    def merge_vulns(self, new_vulns: List[Vulnerability]):
        """Merges new data into the DB, prioritizing critical signals."""
        for new_v in new_vulns:
            if new_v.id in self.db:
                existing = self.db[new_v.id]
                # Merge Logic:
                # 1. If KEV is true, force it true
                if new_v.known_exploited:
                    existing.known_exploited = True
                    existing.severity_score = max(existing.severity_score, new_v.severity_score)
                    if "KEV" not in existing.tags:
                        existing.tags.append("KEV")
                
                # 2. Update metadata if missing
                if not existing.description and new_v.description:
                    existing.description = new_v.description
                
                # 3. Append CPEs (deduplicate)
                existing.affected_cpes = list(set(existing.affected_cpes + new_v.affected_cpes))
                
                # 4. Update severity if new source has higher confidence? 
                # NVD usually has the canonical CVSS. CISA has the "Real" severity.
                if new_v.cvss_v3_score and not existing.cvss_v3_score:
                    existing.cvss_v3_score = new_v.cvss_v3_score
                    existing.cvss_v3_vector = new_v.cvss_v3_vector
            else:
                self.db[new_v.id] = new_v

    def sync_all(self):
        """Runs all ingestors and updates DB."""
        self.load_db()
        
        # 1. CISA KEV (High Priority, Fast)
        cisa = CisaKevIngestor()
        cisa_vulns = cisa.run()
        self.merge_vulns(cisa_vulns)
        
        # 2. NVD (Volume, Slow)
        nvd = NvdIngestor()
        nvd_vulns = nvd.run()
        self.merge_vulns(nvd_vulns)
        
        self.save_db()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    manager = VulnDataManager()
    manager.sync_all()
