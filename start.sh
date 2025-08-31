#!/bin/bash
# File: start.sh
# Starts all services for the power monitoring system in separate terminal windows.

echo "--- Starting Power Monitoring System ---"

# --- Activate Virtual Environment ---
echo "Activating Python virtual environment..."
source venv/bin/activate

# --- 1. Start Core Infrastructure (Docker) ---
echo "Starting Docker services (InfluxDB, Mosquitto, etc.)..."
docker compose -f docker-compose.dev.yml up -d
sleep 5 # Give services a moment to initialize

# --- 2. Start Backend API Server ---
echo "Starting Backend API Server in a new terminal..."
gnome-terminal --title="Backend API" -- bash -c "source venv/bin/activate; uvicorn backend.app.main:app --host 0.0.0.0 --port 8000; exec bash"

# --- 3. Start MQTT Ingestor ---
echo "Starting MQTT Ingestor in a new terminal..."
gnome-terminal --title="MQTT Ingestor" -- bash -c "source venv/bin/activate; python -m backend.services.mqtt_ingestor; exec bash"

# --- 4. Start Data Simulator ---
echo "Starting Data Simulator in a new terminal..."
gnome-terminal --title="Data Simulator" -- bash -c "source venv/bin/activate; python simulators/nodes/node_simulator.py; exec bash"

# --- 5. Start Frontend Dashboard ---
echo "Starting Frontend Dashboard in a new terminal..."
gnome-terminal --title="Frontend Dashboard" -- bash -c "cd frontend && npm run dev; exec bash"

echo ""
echo "--- All services have been started in new terminal windows. ---"

# --- 6. Open Webpage ---
echo "Opening dashboard in your web browser..."
sleep 5 # Wait a few seconds for the frontend server to be ready
xdg-open http://localhost:5173