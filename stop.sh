#!/bin/bash
# File: stop.sh
# Stops all services for the power monitoring system.

echo "--- Stopping Power Monitoring System ---"

# --- 1. Stop Docker Infrastructure ---
echo "Stopping Docker services..."
docker compose -f docker-compose.dev.yml down -v

# --- 2. Stop Background Python and Node Processes ---
# This command finds and kills the processes for uvicorn, the ingestor, and the simulator.
echo "Stopping Python services (API, Ingestor, Simulator)..."
pkill -f "uvicorn backend.app.main:app"
pkill -f "backend.services.mqtt_ingestor"
pkill -f "simulators/nodes/node_simulator.py"

# --- 3. Stop Frontend Server ---
# This finds the Vite/Node process running on port 5173
echo "Stopping Frontend server..."
kill $(lsof -t -i:5173) 2>/dev/null || echo "Frontend server was not running."


echo ""
echo "--- All services have been stopped. ---"