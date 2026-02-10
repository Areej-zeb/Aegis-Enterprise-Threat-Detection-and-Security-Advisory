"""
Threat Intelligence API Endpoints
FastAPI routes for threat intelligence dashboard.
"""

from fastapi import APIRouter, Query, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from typing import List, Optional
import json
import asyncio
import uuid

from .models import (
    ThreatIncident, ThreatActor, MITRETechnique, IPReputation,
    ThreatIntelResponse, SeverityLevel, AttackType
)
from .database import get_db
from .threat_generator import ThreatGenerator

router = APIRouter(prefix="/api/threat-intel", tags=["threat-intelligence"])
threat_gen = ThreatGenerator()
active_connections: List[WebSocket] = []


# ============================================================================
# Summary & Overview Endpoints
# ============================================================================

@router.get("/summary")
async def get_threat_summary():
    """Get overall threat summary statistics"""
    db = get_db()
    summary = db.get_summary()
    return {
        "status": "success",
        "data": summary.model_dump(),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/dashboard")
async def get_dashboard_data():
    """Get complete dashboard data (all threat intelligence)"""
    db = get_db()
    
    response = ThreatIntelResponse(
        summary=db.get_summary(),
        recent_incidents=db.get_recent_incidents(limit=50),
        attack_distribution=db.get_attack_distribution(),
        top_threat_actors=db.get_top_threat_actors(limit=5),
        top_malicious_ips=db.get_top_malicious_ips(limit=10),
        mitre_techniques_used=db.get_mitre_techniques_used()
    )
    
    return {
        "status": "success",
        "data": response.model_dump(mode='json'),
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# Incident Management Endpoints
# ============================================================================

@router.get("/incidents")
async def get_incidents(
    limit: int = Query(50, ge=1, le=500),
    hours: int = Query(24, ge=1, le=720),
    severity: Optional[SeverityLevel] = Query(None)
):
    """Get recent incidents with optional filtering"""
    db = get_db()
    
    incidents = db.get_recent_incidents(limit=limit, hours=hours)
    
    if severity:
        incidents = [i for i in incidents if i.severity == severity]
    
    return {
        "status": "success",
        "data": [i.model_dump(mode='json') for i in incidents],
        "count": len(incidents),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/incidents/{incident_id}")
async def get_incident_details(incident_id: str):
    """Get detailed information about a specific incident"""
    db = get_db()
    incident = db.get_incident(incident_id)
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Get related threat actor and techniques
    actor = None
    if incident.threat_actor:
        actor = db.get_actor(incident.threat_actor)
    
    techniques = [
        db.get_technique(t) for t in incident.mitre_techniques
        if db.get_technique(t)
    ]
    
    return {
        "status": "success",
        "data": {
            "incident": incident.model_dump(mode='json'),
            "threat_actor": actor.model_dump(mode='json') if actor else None,
            "mitre_techniques": [t.model_dump(mode='json') for t in techniques]
        },
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/incidents")
async def create_incident(incident: ThreatIncident):
    """Create a new threat incident (for testing/manual entry)"""
    db = get_db()
    
    # Generate ID if not provided
    if not incident.id:
        incident.id = f"inc-{uuid.uuid4().hex[:8]}"
    
    db.add_incident(incident)
    
    return {
        "status": "success",
        "data": incident.model_dump(mode='json'),
        "message": "Incident created successfully",
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# Attack Analysis Endpoints
# ============================================================================

@router.get("/attacks/distribution")
async def get_attack_distribution():
    """Get attack type distribution"""
    db = get_db()
    distribution = db.get_attack_distribution()
    
    return {
        "status": "success",
        "data": [d.model_dump(mode='json') for d in distribution],
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/attacks/by-type/{attack_type}")
async def get_incidents_by_type(attack_type: AttackType):
    """Get incidents by attack type"""
    db = get_db()
    incidents = [
        i for i in db.get_recent_incidents(limit=1000)
        if i.attack_type == attack_type
    ]
    
    return {
        "status": "success",
        "data": [i.model_dump(mode='json') for i in incidents],
        "count": len(incidents),
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# MITRE ATT&CK Endpoints
# ============================================================================

@router.get("/mitre/techniques")
async def get_mitre_techniques():
    """Get all MITRE techniques used in recent incidents"""
    db = get_db()
    techniques = db.get_mitre_techniques_used()
    
    return {
        "status": "success",
        "data": [t.model_dump(mode='json') for t in techniques],
        "count": len(techniques),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/mitre/techniques/{technique_id}")
async def get_mitre_technique(technique_id: str):
    """Get detailed MITRE technique information"""
    db = get_db()
    technique = db.get_technique(technique_id)
    
    if not technique:
        raise HTTPException(status_code=404, detail="Technique not found")
    
    # Get incidents using this technique
    incidents = [
        i for i in db.get_recent_incidents(limit=1000)
        if technique_id in i.mitre_techniques
    ]
    
    return {
        "status": "success",
        "data": {
            "technique": technique.model_dump(mode='json'),
            "incident_count": len(incidents),
            "recent_incidents": [i.model_dump(mode='json') for i in incidents[:10]]
        },
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# Threat Actor Endpoints
# ============================================================================

@router.get("/threat-actors")
async def get_threat_actors():
    """Get top threat actors"""
    db = get_db()
    actors = db.get_top_threat_actors(limit=10)
    
    return {
        "status": "success",
        "data": [a.model_dump(mode='json') for a in actors],
        "count": len(actors),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/threat-actors/{actor_id}")
async def get_threat_actor(actor_id: str):
    """Get detailed threat actor information"""
    db = get_db()
    actor = db.get_actor(actor_id)
    
    if not actor:
        raise HTTPException(status_code=404, detail="Threat actor not found")
    
    # Get incidents attributed to this actor
    incidents = [
        i for i in db.get_recent_incidents(limit=1000)
        if i.threat_actor == actor_id
    ]
    
    return {
        "status": "success",
        "data": {
            "actor": actor.model_dump(mode='json'),
            "incident_count": len(incidents),
            "recent_incidents": [i.model_dump(mode='json') for i in incidents[:10]]
        },
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# IP Reputation Endpoints
# ============================================================================

@router.get("/ip-reputation/{ip_address}")
async def check_ip_reputation(ip_address: str):
    """Check reputation of an IP address"""
    db = get_db()
    reputation = db.check_ip_reputation(ip_address)
    
    if not reputation:
        # Return neutral reputation for unknown IPs
        reputation = IPReputation(
            ip_address=ip_address,
            reputation_score=0,
            threat_count=0,
            is_malicious=False
        )
    
    # Get incidents from this IP
    incidents = [
        i for i in db.get_recent_incidents(limit=1000)
        if i.source_ip == ip_address
    ]
    
    return {
        "status": "success",
        "data": {
            "reputation": reputation.model_dump(mode='json'),
            "incident_count": len(incidents),
            "recent_incidents": [i.model_dump(mode='json') for i in incidents[:10]]
        },
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/ip-reputation/top")
async def get_top_malicious_ips(limit: int = Query(10, ge=1, le=100)):
    """Get top malicious IP addresses"""
    db = get_db()
    ips = db.get_top_malicious_ips(limit=limit)
    
    return {
        "status": "success",
        "data": [ip.model_dump(mode='json') for ip in ips],
        "count": len(ips),
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# Real-time WebSocket Endpoints
# ============================================================================

@router.websocket("/ws/live-threats")
async def websocket_live_threats(websocket: WebSocket):
    """WebSocket endpoint for real-time threat updates"""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            # Generate new threat every 5 seconds
            await asyncio.sleep(5)
            
            incident = threat_gen.generate_incident()
            db = get_db()
            db.add_incident(incident)
            
            # Broadcast to all connected clients
            message = {
                "type": "new_incident",
                "data": incident.model_dump(mode='json'),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            for connection in active_connections:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    except WebSocketDisconnect:
        active_connections.remove(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        if websocket in active_connections:
            active_connections.remove(websocket)


# ============================================================================
# Testing & Demo Endpoints
# ============================================================================

@router.post("/demo/generate-incidents")
async def generate_demo_incidents(count: int = Query(10, ge=1, le=100)):
    """Generate demo incidents for testing"""
    db = get_db()
    incidents = []
    
    for _ in range(count):
        incident = threat_gen.generate_incident()
        db.add_incident(incident)
        incidents.append(incident)
    
    return {
        "status": "success",
        "message": f"Generated {count} demo incidents",
        "data": [i.model_dump(mode='json') for i in incidents],
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    db = get_db()
    summary = db.get_summary()
    
    return {
        "status": "healthy",
        "service": "threat-intelligence",
        "incidents_count": summary.total_incidents,
        "timestamp": datetime.utcnow().isoformat()
    }
