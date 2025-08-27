# backend/app/api/endpoints.py

from fastapi import APIRouter, HTTPException
from ...services.influx_service import influx_service

router = APIRouter()

@router.get("/")
def read_root():
    return {"status": "ok", "message": "Power Monitoring API is running!"}

# --- NEW ENDPOINT ---
@router.get("/nodes/{node_id}/data")
def get_node_data(node_id: str, time_range: str = "-1h"):
    """
    Retrieves historical sensor data for a specific node.
    'time_range' can be like "-1h", "-24h", "-7d".
    """
    try:
        data = influx_service.read_sensor_data(node_id=node_id, time_range=time_range)
        if not data:
            raise HTTPException(
                status_code=404, 
                detail=f"No data found for node '{node_id}' in the specified time range."
            )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/nodes/status")
def get_all_nodes_status():
    """
    Retrieves the latest data point from all nodes for the status cards.
    """
    try:
        data = influx_service.get_all_nodes_latest_status()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# backend/app/api/endpoints.py
# ... (existing endpoints) ...

# --- NEW ENDPOINT FOR CAMPUS-WIDE SUMMARY ---
@router.get("/campus/summary")
def get_campus_summary():
    """
    Retrieves a campus-wide summary of power consumption.
    """
    try:
        data = influx_service.get_campus_power_summary()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))