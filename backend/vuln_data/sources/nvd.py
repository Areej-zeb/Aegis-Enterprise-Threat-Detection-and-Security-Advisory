import requests
import logging
import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from ..models import Vulnerability, VulnerabilityReference

logger = logging.getLogger(__name__)

class NvdIngestor:
    """
    Ingests data from NIST NVD API 2.0.
    """
    BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"
    SOURCE_NAME = "NIST NVD"
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        # Delay to respect rate limits (without Key: 5 req/30s -> 6s delay. With Key: 50 req/30s -> 0.6s)
        self.delay = 0.6 if api_key else 6.0 

    def fetch_changes(self, last_mod_start_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Fetches CVEs modified since the given date.
        If None, fetches recent (last 7 days) to limit volume for this demo.
        """
        params = {}
        if last_mod_start_date:
            params["lastModStartDate"] = last_mod_start_date.isoformat()
            params["lastModEndDate"] = datetime.utcnow().isoformat()
        else:
            # Default to last 30 days for initial seed if no persistence found
            start = datetime.utcnow() - timedelta(days=30)
            end = datetime.utcnow()
            params["pubStartDate"] = start.isoformat()
            params["pubEndDate"] = end.isoformat()

        headers = {}
        if self.api_key:
            headers["apiKey"] = self.api_key

        try:
            logger.info(f"Fetching NVD data with params: {params}")
            # Note: In a real prod system, we would handle pagination (startIndex).
            # For this MVP, we fetch the first page (2000 items max default).
            params["resultsPerPage"] = 500 
            
            response = requests.get(self.BASE_URL, params=params, headers=headers, timeout=60)
            response.raise_for_status()
            data = response.json()
            return data.get("vulnerabilities", [])
        except Exception as e:
            logger.error(f"Failed to fetch NVD data: {e}")
            return []

    def normalize(self, raw_item: Dict[str, Any]) -> Vulnerability:
        """Converts NVD JSON item to Aegis Vulnerability."""
        cve = raw_item.get("cve", {})
        cve_id = cve.get("id")
        
        # Metrics
        metrics = cve.get("metrics", {})
        cvss_v3_data = metrics.get("cvssMetricV31", []) or metrics.get("cvssMetricV30", [])
        
        score = 0.0
        vector = None
        severity = "LOW"
        
        if cvss_v3_data:
            primary = cvss_v3_data[0].get("cvssData", {})
            score = primary.get("baseScore", 0.0)
            vector = primary.get("vectorString")
            severity = primary.get("baseSeverity", "LOW")

        vuln = Vulnerability(
            id=cve_id,
            cve_id=cve_id,
            severity_score=score,
            severity_level=severity,
            cvss_v3_score=score,
            cvss_v3_vector=vector,
            description=cve.get("descriptions", [{}])[0].get("value", ""),
            published_date=datetime.fromisoformat(cve.get("published", "").replace("Z", "+00:00")) if cve.get("published") else None,
            last_modified=datetime.fromisoformat(cve.get("lastModified", "").replace("Z", "+00:00")) if cve.get("lastModified") else None,
        )
        
        # Configurations / CPEs
        # Extract CPEs for matching
        if "configurations" in cve:
            for config in cve["configurations"]:
                for node in config.get("nodes", []):
                    for match in node.get("cpeMatch", []):
                        if match.get("vulnerable"):
                            vuln.affected_cpes.append(match.get("criteria"))
        
        return vuln

    def run(self) -> List[Vulnerability]:
        """Runs the sync."""
        raw_items = self.fetch_changes()
        normalized_items = []
        for item in raw_items:
            try:
                # NVD API structure: { "cve": ... } wrapped in list items
                normalized = self.normalize(item)
                normalized_items.append(normalized)
            except Exception as e:
                logger.debug(f"Failed to normalize NVD item: {e}")
                
        logger.info(f"Ingested {len(normalized_items)} vulnerabilities from NVD.")
        return normalized_items
