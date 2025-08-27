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

    # --- THIS IS THE CORRECTED METHOD ---
    def read_sensor_data(self, node_id: str, start: str, end: str | None = None, page: int = 1, limit: int = 100):
        if not self.query_api:
            return {"total": 0, "page": page, "limit": limit, "data": []}

        offset = (page - 1) * limit

        if start.startswith('-'):
            start_query = f'start: {start}'
        else:
            start_query = f'start: time(v: "{start}")'

        stop_query = f', stop: time(v: "{end}")' if end else ""
        range_query = f'range({start_query}{stop_query})'
        
        # Simplified and corrected Flux query
        flux_query = f'''
            from(bucket: "{self.bucket}")
            |> {range_query}
            |> filter(fn: (r) => r["_measurement"] == "power_measurement")
            |> filter(fn: (r) => r["node_id"] == "{node_id}")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
            |> sort(columns: ["_time"], desc: true)
        '''
        
        try:
            result = self.query_api.query(query=flux_query, org=self.org)
            records = []
            for table in result:
                for record in table.records:
                    record.values['_time'] = record.values['_time'].isoformat()
                    records.append(record.values)
            
            # Perform pagination in Python after getting all results
            total_count = len(records)
            paginated_records = records[offset : offset + limit]
            
            return {"total": total_count, "page": page, "limit": limit, "data": paginated_records}
        except Exception as e:
            print(f"Error querying paginated data from InfluxDB: {e}")
            return {"total": 0, "page": page, "limit": limit, "data": []}

    def get_all_nodes_latest_status(self):
        if not self.query_api:
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
                        "_time": record_time.isoformat().replace('+00:00', 'Z') if record_time else None
                    }
                    records.append(status)
            return records
        except Exception as e:
            print(f"Error querying latest statuses from InfluxDB: {e}")
            return []

    def get_campus_power_summary(self):
        if not self.query_api:
            return {"total_power": 0}
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

    def get_cost_summary(self, tariff_rate: float = 8.0):
        if not self.query_api:
            return {"daily": 0, "weekly": 0, "monthly": 0}
        costs = {}
        time_periods = {"daily": "-1d", "weekly": "-7d", "monthly": "-30d"}
        for period, duration in time_periods.items():
            flux_query = f'''
                import "math"
                from(bucket: "{self.bucket}")
                |> range(start: {duration})
                |> filter(fn: (r) => r["_measurement"] == "power_measurement")
                |> filter(fn: (r) => r["_field"] == "power")
                |> integral(unit: 1s)
                |> map(fn: (r) => ({{ r with _value: r._value / 3600000.0 }}))
                |> sum()
            '''
            try:
                result = self.query_api.query(query=flux_query, org=self.org)
                total_kwh = 0
                if result and result[0].records:
                    total_kwh = result[0].records[0].get_value() or 0
                costs[period] = round(total_kwh * tariff_rate, 2)
            except Exception as e:
                print(f"Error querying cost for period {period}: {e}")
                costs[period] = 0
        return costs
    
    # backend/services/influx_service.py
# Add this new method inside the InfluxDBService class

    def read_all_node_data(self, node_id: str, start: str, end: str | None = None):
        """
        Reads ALL sensor data for a specific node in a time range (for CSV export).
        """
        if not self.query_api:
            return []

        if start.startswith('-'):
            start_query = f'start: {start}'
        else:
            start_query = f'start: time(v: "{start}")'

        stop_query = f', stop: time(v: "{end}")' if end else ""
        range_query = f'range({start_query}{stop_query})'
        
        flux_query = f'''
            from(bucket: "{self.bucket}")
            |> {range_query}
            |> filter(fn: (r) => r["_measurement"] == "power_measurement")
            |> filter(fn: (r) => r["node_id"] == "{node_id}")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
            |> sort(columns: ["_time"], desc: true)
        '''
        try:
            result = self.query_api.query(query=flux_query, org=self.org)
            records = []
            for table in result:
                for record in table.records:
                    record.values['_time'] = record.values['_time'].isoformat()
                    records.append(record.values)
            return records
        except Exception as e:
            print(f"Error querying all node data from InfluxDB: {e}")
            return []

influx_service = InfluxDBService()