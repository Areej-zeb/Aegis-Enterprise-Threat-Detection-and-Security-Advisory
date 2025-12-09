/**
 * IDS Alert type definition
 * Represents a single alert from the IDS system
 */
export type IdsAlert = {
  id: string;
  timestamp: string;          // ISO string or epoch timestamp
  attackType?: string;         // e.g. "BENIGN", "DDoS_SYN", "MITM_ARP + Sniffing", "dns_exfiltration"
  label?: string;              // Alternative field for attack type
  severity: "Low" | "Medium" | "High" | "Critical" | "low" | "medium" | "high" | "critical";
  score: number;
  sourceIp?: string;           // Alternative: src_ip, srcIp
  destIp?: string;             // Alternative: dst_ip, dstIp, destination_ip
  protocol?: string;
  model?: string;              // Optional: syn_model, mitm_arp_model, dns_exfiltration_model
  model_type?: string;         // Alternative field name
  sensor?: string;
  src_ip?: string;
  dst_ip?: string;
  srcIp?: string;
  destIp?: string;
  source_ip?: string;
  destination_ip?: string;
};

