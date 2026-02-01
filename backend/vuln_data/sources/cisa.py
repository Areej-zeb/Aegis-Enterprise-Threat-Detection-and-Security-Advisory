import requests
import logging
from typing import List, Dict, Any
from datetime import datetime
from ..models import Vulnerability, VulnerabilityReference

logger = logging.getLogger(__name__)

class CisaKevIngestor:
    """
    Ingests data from CISA's Known Exploited Vulnerabilities Catalog.
    Source: https://www.cisa.gov/known-exploited-vulnerabilities-catalog
    """
    URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
    SOURCE_NAME = "CISA KEV"

    def fetch(self) -> List[Dict[str, Any]]:
        """Fetches the raw JSON catalog."""
        try:
            logger.info(f"Fetching CISA KEV from {self.URL}...")
            response = requests.get(self.URL, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data.get("vulnerabilities", [])
        except Exception as e:
            logger.error(f"Failed to fetch CISA KEV: {e}")
            return []

    def normalize(self, raw_vuln: Dict[str, Any]) -> Vulnerability:
        """Converts a CISA KEV entry into an Aegis Vulnerability model."""
        cve_id = raw_vuln.get("cveID")
        
        # CISA data is minimal but critical
        # It guarantees "known_exploited = True"
        
        vuln = Vulnerability(
            id=cve_id,
            cve_id=cve_id,
            title=raw_vuln.get("vulnerabilityName"),
            description=raw_vuln.get("shortDescription"),
            known_exploited=True,
            severity_level="CRITICAL", # KEV implies critical attention req, though CVSS might vary
            severity_score=9.0, # Base proxy score if CVSS missing (will be merged later)
            tags=["KEV", "EXPLOITED"]
        )

        # Attempt to create a pseudo-CPE for matching
        # CISA gives "vendorProject" and "product"
        vendor = raw_vuln.get("vendorProject", "").lower().replace(" ", "_")
        product = raw_vuln.get("product", "").lower().replace(" ", "_")
        
        if vendor and product:
            # Construct cpe:2.3:a:vendor:product:*:...
            pseudo_cpe = f"cpe:2.3:a:{vendor}:{product}:*:*:*:*:*:*:*:*"
            vuln.affected_cpes.append(pseudo_cpe)
        
        # Parse dates
        if raw_vuln.get("dateAdded"):
            try:
                vuln.published_date = datetime.strptime(raw_vuln["dateAdded"], "%Y-%m-%d")
            except ValueError:
                pass
                
        # References
        if raw_vuln.get("notes"):
            vuln.references.append(VulnerabilityReference(
                url=raw_vuln["notes"], # CISA often puts act URL here or text
                source=self.SOURCE_NAME,
                tags=["Notes"]
            ))
            
        return vuln

    def run(self) -> List[Vulnerability]:
        """Main execution method."""
        raw_items = self.fetch()
        normalized_items = []
        for item in raw_items:
            try:
                normalized = self.normalize(item)
                normalized_items.append(normalized)
            except Exception as e:
                logger.warning(f"Failed to normalize CISA item {item.get('cveID')}: {e}")
        
        logger.info(f"Ingested {len(normalized_items)} vulnerabilities from CISA KEV.")
        return normalized_items
