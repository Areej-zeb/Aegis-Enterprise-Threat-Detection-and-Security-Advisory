# backend/chatbot/app.py
"""
Aegis Advisory Chatbot - Module 3
Implements AI-powered security advisory with explainable AI (LIME/SHAP)
Integrates with IDS alerts and Pentest results
References: MITRE ATT&CK, AbuseIPDB
Team Member: Sahar (Primary Developer)
"""
from fastapi import FastAPI, WebSocket, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
import uuid
import json
from datetime import datetime

from .models import (
    ChatMessage, ChatSession, SecurityQuery,
    ThreatAnalysis, AdvisoryResponse, ExplainabilityOutput
)
from .advisor import SecurityAdvisor
from .explainability import ExplainabilityEngine
from .threat_intel import ThreatIntelligence
from .integration import IDSIntegrator, PentestIntegrator

app = FastAPI(
    title="Aegis Advisory Chatbot API",
    description="AI-powered security advisory with explainable AI (LIME/SHAP)",
    version="1.0.0",
    contact={
        "name": "Sahar",
        "email": "sahar@example.com",
        "url": "https://aegis-security.com"
    }
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize modules (as per thesis architecture)
advisor = SecurityAdvisor()
explainability_engine = ExplainabilityEngine()
threat_intel = ThreatIntelligence()
ids_integrator = IDSIntegrator()
pentest_integrator = PentestIntegrator()

# In-memory storage (for demo)
chat_sessions = {}

@app.get("/")
async def root():
    """Root endpoint with system information"""
    return {
        "system": "Aegis Advisory Chatbot",
        "module": "Module 3: Advisory Chatbot",
        "version": "1.0.0",
        "developer": "Sahar",
        "supervisor": "Dr. Sana Aurangzeb",
        "university": "National University of Computer and Emerging Sciences",
        "year": "2025-2026",
        "capabilities": [
            "Explainable AI Advisory (LIME/SHAP)",
            "MITRE ATT&CK Integration",
            "Threat Intelligence (AbuseIPDB)",
            "IDS Alert Integration",
            "Pentest Result Integration",
            "Security Policy Recommendations"
        ],
        "documentation": "See project thesis for details"
    }

@app.get("/api/chat/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "modules": {
            "security_advisor": "operational",
            "explainability_engine": "operational",
            "threat_intelligence": "operational",
            "ids_integration": "operational" if ids_integrator.check_connection() else "disconnected",
            "pentest_integration": "operational" if pentest_integrator.check_connection() else "disconnected"
        }
    }

@app.post("/api/chat/sessions", response_model=Dict[str, str])
async def create_session(user_context: Optional[Dict[str, Any]] = None):
    """Create a new advisory session"""
    session_id = str(uuid.uuid4())
    
    session = ChatSession(
        id=session_id,
        user_context=user_context or {},
        created_at=datetime.utcnow(),
        messages=[],
        metadata={
            "system_info": "Aegis Advisory Chatbot v1.0",
            "developer": "Sahar",
            "project": "Module 3: Advisory Chatbot",
            "university": "NUCES Islamabad"
        }
    )
    
    chat_sessions[session_id] = session
    
    # Add welcome message with thesis context
    welcome_msg = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role="assistant",
        content=f"""# 🛡️ Aegis Security Advisory

**Project:** Aegis - AI-Powered Enterprise Security Advisor  
**Module:** Advisory Chatbot (Module 3)  
**Developer:** Sahar  
**Supervisor:** Dr. Sana Aurangzeb  
**University:** NUCES Islamabad  
**Session:** 2025-2026

## Capabilities:
1. **Explainable AI Advisory** - Using LIME & SHAP for interpretability
2. **Threat Intelligence** - MITRE ATT&CK & AbuseIPDB integration
3. **Real-time Integration** - IDS alerts & Pentest results
4. **Actionable Recommendations** - Contextual security guidance

## How I Can Help:
- Analyze security incidents with explainable AI
- Provide MITRE ATT&CK mappings for threats
- Check IP reputation via AbuseIPDB
- Integrate IDS alerts for contextual advice
- Generate security policy recommendations

What security concern would you like to discuss?""",
        timestamp=datetime.utcnow(),
        metadata={
            "type": "welcome",
            "references": ["Thesis Section 2.1.3", "Module 3 Documentation"],
            "suggestions": [
                "Explain recent IDS alert",
                "Check IP reputation",
                "MITRE ATT&CK analysis",
                "Security policy advice"
            ]
        }
    )
    
    session.messages.append(welcome_msg)
    return {"session_id": session_id, "message": "Advisory session created"}

@app.post("/api/chat/query", response_model=AdvisoryResponse)
async def process_security_query(query: SecurityQuery):
    """Process security query with explainable AI"""
    if query.session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = chat_sessions[query.session_id]
    
    # Add user query to session
    user_msg = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=query.session_id,
        role="user",
        content=query.query,
        timestamp=datetime.utcnow(),
        metadata={
            "query_type": query.query_type,
            "context": query.context
        }
    )
    session.messages.append(user_msg)
    
    # Process query based on type
    if query.query_type == "threat_analysis":
        response = await advisor.analyze_threat(
            query=query.query,
            context=query.context
        )
    elif query.query_type == "mitre_mapping":
        response = await threat_intel.map_to_mitre(query.query)
    elif query.query_type == "ip_reputation":
        response = await threat_intel.check_ip_reputation(query.query)
    elif query.query_type == "policy_advice":
        response = await advisor.provide_policy_advice(
            query=query.query,
            context=query.context
        )
    else:
        response = await advisor.general_advice(query.query)
    
    # Generate explainability output (LIME/SHAP)
    if response.explainability_enabled:
        explainability = explainability_engine.generate_explanation(
            query=query.query,
            response=response,
            model_type="security_advisor"
        )
        response.explainability = explainability
    
    # Add to session
    advisor_msg = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=query.session_id,
        role="assistant",
        content=response.answer,
        timestamp=datetime.utcnow(),
        metadata={
            "confidence": response.confidence,
            "explainability": response.explainability.dict() if response.explainability else None,
            "references": response.references,
            "actions": response.recommended_actions
        }
    )
    session.messages.append(advisor_msg)
    
    return response

@app.get("/api/chat/sessions/{session_id}/integrate/ids")
async def integrate_ids_alerts(session_id: str):
    """Integrate recent IDS alerts into chat session"""
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Fetch recent alerts from IDS module
    alerts = await ids_integrator.get_recent_alerts(limit=10)
    
    if not alerts:
        return {"message": "No recent IDS alerts found", "alerts": []}
    
    # Analyze alerts with advisor
    analysis = await advisor.analyze_ids_alerts(alerts)
    
    session = chat_sessions[session_id]
    
    # Add analysis to session
    analysis_msg = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role="assistant",
        content=analysis.summary,
        timestamp=datetime.utcnow(),
        metadata={
            "type": "ids_analysis",
            "alert_count": len(alerts),
            "threat_level": analysis.threat_level,
            "recommendations": analysis.recommendations
        }
    )
    session.messages.append(analysis_msg)
    
    return {
        "message": "IDS alerts integrated successfully",
        "alert_count": len(alerts),
        "analysis": analysis.dict()
    }

@app.get("/api/chat/sessions/{session_id}/integrate/pentest")
async def integrate_pentest_results(session_id: str):
    """Integrate pentest results into chat session"""
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Fetch recent pentest results
    results = await pentest_integrator.get_recent_results(limit=5)
    
    if not results:
        return {"message": "No pentest results found", "results": []}
    
    # Analyze results with advisor
    analysis = await advisor.analyze_pentest_results(results)
    
    session = chat_sessions[session_id]
    
    # Add analysis to session
    analysis_msg = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role="assistant",
        content=analysis.summary,
        timestamp=datetime.utcnow(),
        metadata={
            "type": "pentest_analysis",
            "vulnerabilities": analysis.vulnerability_count,
            "risk_score": analysis.risk_score,
            "recommendations": analysis.recommendations
        }
    )
    session.messages.append(analysis_msg)
    
    return {
        "message": "Pentest results integrated successfully",
        "result_count": len(results),
        "analysis": analysis.dict()
    }

@app.get("/api/mitre/search")
async def search_mitre_techniques(keyword: str):
    """Search MITRE ATT&CK techniques"""
    techniques = threat_intel.search_mitre_techniques(keyword)
    return {
        "keyword": keyword,
        "count": len(techniques),
        "techniques": techniques
    }

@app.get("/api/threat/ip/{ip_address}")
async def get_ip_threat_intel(ip_address: str):
    """Get threat intelligence for IP address"""
    intel = await threat_intel.get_ip_intelligence(ip_address)
    return intel

@app.post("/api/explain/generate")
async def generate_explanation(request: Dict[str, Any]):
    """Generate LIME/SHAP explanation for a security decision"""
    explanation = explainability_engine.generate_custom_explanation(
        data=request.get("data"),
        model_output=request.get("model_output"),
        feature_names=request.get("feature_names", []),
        explanation_type=request.get("type", "lime")
    )
    return explanation

@app.get("/api/chat/export/{session_id}")
async def export_session_report(session_id: str, format: str = "json"):
    """Export chat session as report"""
    if session_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = chat_sessions[session_id]
    
    if format == "json":
        return JSONResponse(
            content=session.dict(),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=aegis_advisory_{session_id}.json"
            }
        )
    elif format == "report":
        # Generate comprehensive security report
        report = await advisor.generate_security_report(session)
        return report
    
    return {"error": "Unsupported format"}

# WebSocket for real-time advisory
@app.websocket("/ws/chat/{session_id}")
async def websocket_advisory(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "query":
                # Process real-time query
                query = SecurityQuery(
                    session_id=session_id,
                    query=data["content"],
                    query_type=data.get("query_type", "general")
                )
                
                response = await process_security_query(query)
                
                await websocket.send_json({
                    "type": "response",
                    "content": response.answer,
                    "metadata": {
                        "confidence": response.confidence,
                        "references": response.references,
                        "actions": response.recommended_actions
                    }
                })
                
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002, reload=True)