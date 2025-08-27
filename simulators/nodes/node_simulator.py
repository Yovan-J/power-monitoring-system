# simulators/nodes/node_simulator.py

import paho.mqtt.client as mqtt
import json
import time
import random
import threading

# --- Configuration ---
MQTT_BROKER_HOST = "localhost"
MQTT_BROKER_PORT = 1883
BASE_MQTT_TOPIC = "campus/data"

# Define the 5 nodes to be simulated based on the project plan 
NODES = [
    {"id": "CLASS_SIM_01", "type": "Classroom", "interval_s": 10},
    {"id": "CLASS_SIM_02", "type": "Classroom", "interval_s": 12},
    {"id": "CLASS_SIM_03", "type": "Classroom", "interval_s": 9},
    {"id": "FACULTY_SIM_01", "type": "Faculty Room", "interval_s": 15},
    {"id": "LAB_SIM_01", "type": "Lab", "interval_s": 7},
]

def create_dummy_data(node_config: dict):
    """Generates a dictionary of realistic-looking sensor data for a specific node."""
    node_id = node_config["id"]
    node_type = node_config["type"]
    
    # Simulate different current ranges based on room type
    current = 0.0
    if node_type == "Lab":
        current = round(random.uniform(2.0, 8.5), 3) # Higher consumption for labs
    elif node_type == "Faculty Room":
        current = round(random.uniform(0.5, 3.0), 3)
    else: # Classroom
        current = round(random.uniform(1.0, 4.5), 3)

    voltage = round(random.uniform(225.0, 235.0), 2)
    power_factor = round(random.uniform(0.85, 0.99), 2)
    frequency = round(random.uniform(49.8, 50.2), 2)
    apparent_power = round(voltage * current, 2)
    real_power = round(apparent_power * power_factor, 2)

    data = {
        "node_id": node_id,
        "timestamp": int(time.time()),
        "voltage": voltage,
        "current": current,
        "power": real_power,
        "power_factor": power_factor,
        "frequency": frequency
    }
    return data

def simulate_node(node_config: dict, client: mqtt.Client, stop_event: threading.Event):
    """The main loop for a single simulated node thread."""
    topic = f"{BASE_MQTT_TOPIC}/{node_config['id']}"
    
    while not stop_event.is_set():
        # Generate and publish data
        payload = create_dummy_data(node_config)
        payload_json = json.dumps(payload)
        
        result = client.publish(topic, payload_json)
        
        if result.rc != mqtt.MQTT_ERR_SUCCESS:
            print(f"   Node {node_config['id']}: Failed to send message to topic {topic}")

        # Wait for the node's specific interval
        time.sleep(node_config["interval_s"])

def main():
    """Main function to set up MQTT and start all node threads."""
    
    def on_connect(client, userdata, flags, rc, properties=None):
        if rc == 0:
            print(f"Successfully connected to MQTT Broker at {MQTT_BROKER_HOST}:{MQTT_BROKER_PORT}")
        else:
            print(f"Failed to connect, return code {rc}\n")

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    
    print("Connecting to MQTT Broker...")
    try:
        client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT, 60)
    except ConnectionRefusedError:
        print("Connection refused. Is the MQTT Broker (Mosquitto) container running?")
        return

    client.loop_start()

    threads = []
    stop_event = threading.Event()

    print(f"Starting simulation for {len(NODES)} nodes...")
    
    for node_config in NODES:
        thread = threading.Thread(target=simulate_node, args=(node_config, client, stop_event))
        threads.append(thread)
        thread.start()
        print(f"  - Thread started for node: {node_config['id']}")

    print("Simulation running. Press CTRL+C to stop.")
    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping simulation...")
        stop_event.set()
        for thread in threads:
            thread.join()
        print("All node threads have been stopped.")
    finally:
        client.loop_stop()
        client.disconnect()
        print("Disconnected from MQTT Broker.")

if __name__ == "__main__":
    main()