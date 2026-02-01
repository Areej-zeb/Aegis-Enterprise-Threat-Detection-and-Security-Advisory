
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

# Import the data source (In-memory for MVP)
# In Phase 6 (Persistence), this would be a DB query
from backend.pentest.api import SCAN_RESULTS

logger = logging.getLogger(__name__)

class CorrelationEngine:
    """
    The Intelligence Layer.
    Connects 'What is happening' (IDS) with 'What is vulnerable' (Pentest).
    """

    @staticmethod
    def enrich_alert(alert: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes an alert and escalates it if the target is known to be vulnerable.
        """
        # 1. Extract Attack Context
        # Standardize keys (handling different alert formats)
        dest_ip = alert.get("dst_ip") or alert.get("destination_ip")
        dest_port = alert.get("dst_port") or alert.get("destination_port")
        
        if not dest_ip:
            return alert

        # 2. Asset Lookup
        asset_info = CorrelationEngine._find_asset(dest_ip)
        
        if not asset_info:
            return alert # Unknown target, standard alert
            
        # 3. Vulnerability Match
        # We found the host, now check the specific port
        vuln_context = CorrelationEngine._check_port_vulnerability(asset_info, dest_port)
        
        if vuln_context:
            logger.warning(f"CORRELATION HIT: Attack on {dest_ip}:{dest_port} matches known vulnerability!")
            
            # 4. ESCALATION LOGIC
            alert["severity"] = "CRITICAL"
            alert["score"] = 1.0 # Max confidence
            
            # 5. Context Injection
            # Add a new section to the alert payload
            alert["correlation_context"] = {
                "is_vulnerable": True,
                "asset_known": True,
                "vulnerabilities": vuln_context,
                "message": f"CRITICAL: Target is vulnerable to {len(vuln_context)} known CVEs."
            }
            
            # Add tag
            if "tags" not in alert:
                alert["tags"] = []
            alert["tags"].append("KNOWN_VULNERABILITY")
            alert["tags"].append("EXPLOIT_ATTEMPT")
            
        else:
            # Asset known, but port/service not flagged as vulnerable
            if "meta" not in alert:
                alert["meta"] = {}
            alert["meta"]["asset_known"] = True

        return alert

    @staticmethod
    def _find_asset(ip: str) -> Optional[Dict[str, Any]]:
        """
        Searches all scan results for a matching host IP.
        """
        # Iterate through all scans to find data on this IP
        # We check most recent scans first?
        # For MVP, we check all successful scans.
        
        # SCAN_RESULTS structure: {scan_id: {result: {hosts: [...]}}}
        for scan in SCAN_RESULTS.values():
            if scan.get("status") != "completed":
                continue
                
            result = scan.get("result", {})
            for host in result.get("hosts", []):
                # Nmap can return multiple addresses, usually we assume 'ip' field matches standard format
                if host.get("ip") == ip:
                    return host
                
                # Check hostnames too? 
                # host.docker.internal handling might need special care if dest_ip is resolved or not.
                # For now, exact IP match.
        return None

    @staticmethod
    def _check_port_vulnerability(host_data: Dict[str, Any], port_num: Any) -> List[Dict[str, Any]]:
        """
        Checks if the specific port on the host has vulnerabilities.
        """
        if not port_num:
            return []
            
        try:
            port_num = int(port_num)
        except:
            return []

        vulns_found = []
        
        for p in host_data.get("ports", []):
            if p.get("port") == port_num:
                # Found the port, check for vulns
                if "vulnerabilities" in p and p["vulnerabilities"]:
                    vulns_found.extend(p["vulnerabilities"])
                    
        return vulns_found
