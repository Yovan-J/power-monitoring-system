# backend/app/models/sensor.py
from pydantic import BaseModel, Field
from typing import Optional

class SensorData(BaseModel):
    """
    Pydantic model for incoming sensor data from MQTT.
    """
    node_id: str = Field(..., description="The unique identifier for the sensor node.")
    timestamp: int = Field(..., description="The UNIX timestamp of the reading.")
    voltage: float = Field(..., description="Voltage reading in Volts (V).")
    current: float = Field(..., description="Current reading in Amperes (A).")
    power: float = Field(..., description="Real power reading in Watts (W).")
    power_factor: float = Field(..., description="The power factor of the load.")
    frequency: float = Field(..., description="The frequency of the AC supply in Hertz (Hz).")