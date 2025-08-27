# backend/services/influx_service.py

import influxdb_client
from influxdb_client.client.write_api import SYNCHRONOUS
import os
from ..app.models.sensor import SensorData

class InfluxDBService:
    def __init__(self):
        self.bucket = os.getenv("DOCKER_INFLUXDB_INIT_BUCKET", "sensor-data")
        self.org = os.getenv("DOCKER_INFLUXDB_INIT_ORG", "power-monitoring")
        self.token = os.getenv("DOCKER_INFLUXDB_INIT_ADMIN_TOKEN", "my-super-secret-auth-token")
        self.url = os.getenv("INFLUXDB_URL", "http://localhost:8086")

        try:
            self.client = influxdb_client.InfluxDBClient(url=self.url, token=self.token, org=self.org)
            self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
            self.query_api = self.client.query_api()
            print("Successfully connected to InfluxDB.")
        except Exception as e:
            print(f"Error connecting to InfluxDB: {e}")
            self.client = None
            self.write_api = None
            self.query_api = None

    def write_sensor_data(self, data: SensorData):
        if not self.write_api:
            print("Cannot write to InfluxDB: client not initialized.")
            return
        point = (
            influxdb_client.Point("power_measurement")
            .tag("node_id", data.node_id)
            .field("voltage", data.voltage)
            .field("current", data.current)
            .field("power", data.power)
            .field("power_factor", data.power_factor)
            .field("frequency", data.frequency)
            .time(data.timestamp, "s")
        )
        try:
            self.write_api.write(bucket=self.bucket, org=self.org, record=point)
            print(f"Successfully wrote data for node {data.node_id} to InfluxDB.")
        except Exception as e:
            print(f"Error writing to InfluxDB: {e}")

    def read_sensor_data(self, node_id: str, time_range: str = "-1h"):
        if not self.query_api:
            print("Cannot read from InfluxDB: client not initialized.")
            return []
        flux_query = f'''
            from(bucket: "{self.bucket}")
            |> range(start: {time_range})
            |> filter(fn: (r) => r["_measurement"] == "power_measurement")
            |> filter(fn: (r) => r["node_id"] == "{node_id}")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        try:
            result = self.query_api.query(query=flux_query, org=self.org)
            records = []
            for table in result:
                for record in table.records:
                    records.append(record.values)
            return records
        except Exception as e:
            print(f"Error querying InfluxDB: {e}")
            return []

    def get_all_nodes_latest_status(self):
        if not self.query_api:
            print("Cannot read from InfluxDB: client not initialized.")
            return []
        flux_query = f'''
            from(bucket: "{self.bucket}")
            |> range(start: -1d)
            |> filter(fn: (r) => r["_measurement"] == "power_measurement")
            |> last()
            |> pivot(rowKey:["node_id"], columnKey: ["_field"], valueColumn: "_value")
        '''
        try:
            result = self.query_api.query(query=flux_query, org=self.org)
            records = []
            for table in result:
                for record in table.records:
                    record_time = record.values.get("_time")
                    status = {
                        "node_id": record.values.get("node_id"),
                        "power": record.values.get("power"),
                        "voltage": record.values.get("voltage"),
                        # --- THIS IS THE FIX ---
                        # Explicitly format the datetime object to an ISO string with 'Z' for UTC
                        "_time": record_time.isoformat().replace('+00:00', 'Z') if record_time else None
                    }
                    records.append(status)
            return records
        except Exception as e:
            print(f"Error querying latest statuses from InfluxDB: {e}")
            return []
    
    def get_campus_power_summary(self):
        """
        Calculates the total current power consumption across all nodes.
        """
        if not self.query_api:
            return {"total_power": 0}

        # Flux query to get the last point for each node and sum the power
        flux_query = f'''
            from(bucket: "{self.bucket}")
            |> range(start: -1d)
            |> filter(fn: (r) => r["_measurement"] == "power_measurement")
            |> filter(fn: (r) => r["_field"] == "power")
            |> last()
            |> group() 
            |> sum(column: "_value")
        '''
        try:
            result = self.query_api.query(query=flux_query, org=self.org)
            total_power = 0
            if result and result[0].records:
                total_power = result[0].records[0].get_value()
            return {"total_power": total_power or 0}
        except Exception as e:
            print(f"Error querying campus summary from InfluxDB: {e}")
            return {"total_power": 0}

influx_service = InfluxDBService()