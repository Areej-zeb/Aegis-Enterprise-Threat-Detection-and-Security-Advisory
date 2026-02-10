"""
Analytics API Endpoints
Provides real-time analytics data for the dashboard.
"""

from fastapi import APIRouter, Query
from datetime import datetime, timedelta
from typing import Optional
from .analytics_service import get_analytics_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# Mock alerts data (in production, this would come from database)
MOCK_ALERTS = []

def update_mock_alerts(alerts):
    """Update mock alerts"""
    global MOCK_ALERTS
    MOCK_ALERTS = alerts


@router.get("/summary")
async def get_analytics_summary(
    from_time: Optional[str] = Query(None),
    to_time: Optional[str] = Query(None),
):
    """Get analytics summary for time range"""
    try:
        # Parse time range
        if not from_time or not to_time:
            to_time_dt = datetime.utcnow()
            from_time_dt = to_time_dt - timedelta(hours=1)
        else:
            from_time_dt = datetime.fromisoformat(from_time.replace('Z', '+00:00'))
            to_time_dt = datetime.fromisoformat(to_time.replace('Z', '+00:00'))
        
        service = get_analytics_service(MOCK_ALERTS)
        data = service.get_time_range_data(from_time_dt, to_time_dt)
        
        return {
            "status": "success",
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.get("/timeline")
async def get_timeline(
    from_time: Optional[str] = Query(None),
    to_time: Optional[str] = Query(None),
):
    """Get time-series alert data"""
    try:
        if not from_time or not to_time:
            to_time_dt = datetime.utcnow()
            from_time_dt = to_time_dt - timedelta(hours=1)
        else:
            from_time_dt = datetime.fromisoformat(from_time.replace('Z', '+00:00'))
            to_time_dt = datetime.fromisoformat(to_time.replace('Z', '+00:00'))
        
        service = get_analytics_service(MOCK_ALERTS)
        timeline = service._compute_timeline(
            service._filter_by_time(from_time_dt, to_time_dt),
            from_time_dt,
            to_time_dt
        )
        
        return {
            "status": "success",
            "data": timeline,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.get("/attack-types")
async def get_attack_types(
    from_time: Optional[str] = Query(None),
    to_time: Optional[str] = Query(None),
):
    """Get attack type distribution"""
    try:
        if not from_time or not to_time:
            to_time_dt = datetime.utcnow()
            from_time_dt = to_time_dt - timedelta(hours=1)
        else:
            from_time_dt = datetime.fromisoformat(from_time.replace('Z', '+00:00'))
            to_time_dt = datetime.fromisoformat(to_time.replace('Z', '+00:00'))
        
        service = get_analytics_service(MOCK_ALERTS)
        filtered = service._filter_by_time(from_time_dt, to_time_dt)
        distribution = service._compute_attack_distribution(filtered)
        
        return {
            "status": "success",
            "data": distribution,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.get("/severity")
async def get_severity_breakdown(
    from_time: Optional[str] = Query(None),
    to_time: Optional[str] = Query(None),
):
    """Get severity breakdown"""
    try:
        if not from_time or not to_time:
            to_time_dt = datetime.utcnow()
            from_time_dt = to_time_dt - timedelta(hours=1)
        else:
            from_time_dt = datetime.fromisoformat(from_time.replace('Z', '+00:00'))
            to_time_dt = datetime.fromisoformat(to_time.replace('Z', '+00:00'))
        
        service = get_analytics_service(MOCK_ALERTS)
        filtered = service._filter_by_time(from_time_dt, to_time_dt)
        breakdown = service._compute_severity_breakdown(filtered)
        
        return {
            "status": "success",
            "data": breakdown,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.get("/top-talkers")
async def get_top_talkers(
    limit: int = Query(10, ge=1, le=100),
    from_time: Optional[str] = Query(None),
    to_time: Optional[str] = Query(None),
):
    """Get top source IPs"""
    try:
        if not from_time or not to_time:
            to_time_dt = datetime.utcnow()
            from_time_dt = to_time_dt - timedelta(hours=1)
        else:
            from_time_dt = datetime.fromisoformat(from_time.replace('Z', '+00:00'))
            to_time_dt = datetime.fromisoformat(to_time.replace('Z', '+00:00'))
        
        service = get_analytics_service(MOCK_ALERTS)
        filtered = service._filter_by_time(from_time_dt, to_time_dt)
        talkers = service._compute_top_talkers(filtered, limit)
        
        return {
            "status": "success",
            "data": talkers,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
