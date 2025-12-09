const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getHealth() {
  await delay();
  return {
    systemsOnline: 12,
    systemsTotal: 14,
    lastIncident: "2025-11-18T10:21:00Z",
    posture: "stable",
  };
}

export async function getAlerts() {
  await delay();
  return [
    {
      id: "AL-2091",
      title: "Privilege escalation attempt",
      severity: "high",
      detectedAt: "2025-11-20T05:14:00Z",
    },
    {
      id: "AL-2087",
      title: "Malware beacon blocked",
      severity: "medium",
      detectedAt: "2025-11-19T22:03:00Z",
    },
  ];
}


