# backend/services/mqtt_ingestor.py

import paho.mqtt.client as mqtt
import json
import os
from ..app.models.sensor import SensorData      # CORRECT: Goes up one level, then into app
from .influx_service import influx_service     # CORRECT: Looks in the current directory (services)
from pydantic import ValidationError

# --- Configuration ---
MQTT_BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
MQTT_BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", 1883))
MQTT_TOPIC = "campus/data/#"

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print(f"Ingestor successfully connected to MQTT Broker at {MQTT_BROKER_HOST}")
        client.subscribe(MQTT_TOPIC)
        print(f"Subscribed to topic: '{MQTT_TOPIC}'")
    else:
        print(f"Ingestor failed to connect, return code {rc}\n")

def on_message(client, userdata, msg):
    print(f"Received message from topic '{msg.topic}'")
    try:
        payload_dict = json.loads(msg.payload.decode("utf-8"))

        # Validate the data using our Pydantic model
        sensor_data = SensorData(**payload_dict)

        # Use the service to write the validated data
        influx_service.write_sensor_data(sensor_data)

    except ValidationError as e:
        print(f"   Data validation error: {e}")
    except json.JSONDecodeError:
        print(f"   Error: Could not decode JSON from payload: {msg.payload}")
    except Exception as e:
        print(f"   An unexpected error occurred: {e}")

def run_ingestor():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message
    print("Starting MQTT Ingestor...")
    try:
        client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, 60)
    except Exception as e:
        print(f"Could not connect to MQTT Broker: {e}")
        return
    client.loop_forever()

if __name__ == "__main__":
    run_ingestor()