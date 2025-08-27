# backend/app/api/endpoints.py

from fastapi import APIRouter, HTTPException
from typing import Optional
from ...services.influx_service import influx_service

router = APIRouter()

@router.get("/")
def read_root():
    return {"status": "ok", "message": "Power Monitoring API is running!"}

@router.get("/nodes/{node_id}/data")
def get_node_data(node_id: str, start: str = "-1h", end: Optional[str] = None, page: int = 1, limit: int = 10):
    """
    Retrieves paginated historical sensor data for a specific node.
    """
    try:
        data = influx_service.read_sensor_data(node_id=node_id, start=start, end=end, page=page, limit=limit)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/nodes/status")
def get_all_nodes_status():
    try:
        data = influx_service.get_all_nodes_latest_status()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campus/summary")
def get_campus_summary():
    try:
        data = influx_service.get_campus_power_summary()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campus/cost")
def get_campus_cost():
    try:
        data = influx_service.get_cost_summary()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))