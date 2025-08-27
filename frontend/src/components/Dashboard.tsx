// frontend/src/components/Dashboard.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StatusCard } from './StatusCard';
import { CampusSummary } from './CampusSummary'; // <-- IMPORT THE NEW COMPONENT

// ... (type definitions and constants remain the same) ...
const API_BASE_URL = 'http://localhost:8000';
type SensorData = { _time: string; power?: number; };
type NodeStatus = { node_id: string; power?: number; voltage?: number; _time: string; };


export function Dashboard() {
  // ... (all state and useEffect hooks remain the same) ...
  const [chartData, setChartData] = useState<SensorData[]>([]);
  const [allNodeStatus, setAllNodeStatus] = useState<NodeStatus[]>([]);
  const [chartLoading, setChartLoading] = useState<boolean>(true);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string>('CLASS_SIM_01');
  const nodeOptions = ['CLASS_SIM_01', 'CLASS_SIM_02', 'CLASS_SIM_03', 'FACULTY_SIM_01', 'LAB_SIM_01'];

  useEffect(() => {
    let isMounted = true;
    const fetchStatusData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/nodes/status`);
        if (isMounted) {
          setAllNodeStatus(response.data);
          setStatusError(null);
        }
      } catch (err) {
        if (isMounted) setStatusError("Failed to fetch node statuses.");
        console.error("Status fetch error:", err);
      } finally {
        if (isMounted && statusLoading) setStatusLoading(false);
      }
    };

    fetchStatusData();
    const intervalId = setInterval(fetchStatusData, 5000);
    return () => { isMounted = false; clearInterval(intervalId); };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setChartLoading(true);

    const fetchChartData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/nodes/${selectedNode}/data?time_range=-1h`);
        if (isMounted) {
            const formattedData = response.data.map((d: SensorData) => ({ ...d, _time: new Date(d._time).toLocaleTimeString() }));
            setChartData(formattedData);
            setChartError(null);
        }
      } catch (err) {
        if (isMounted) setChartError('Failed to fetch chart data.');
        console.error("Chart fetch error:", err);
      } finally {
        if (isMounted && chartLoading) {
            setChartLoading(false);
        }
      }
    };
    fetchChartData();
    const intervalId = setInterval(fetchChartData, 10000);
    return () => { isMounted = false; clearInterval(intervalId); };
  }, [selectedNode]);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen font-sans text-slate-800 dark:text-slate-200">
      <header className="bg-white dark:bg-slate-800 shadow-md p-4">
        <h1 className="text-3xl font-bold">Power Monitoring Dashboard</h1>
      </header>
      <main className="p-8 space-y-8"> {/* Add space between main sections */}
        
        {/* Pass status data to the new CampusSummary component */}
        <CampusSummary allNodeStatus={allNodeStatus} />

        <div>
          <h2 className="text-2xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Live Node Status</h2>
          {statusLoading && <p>Loading statuses...</p>}
          {statusError && <p className="text-red-500">{statusError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {allNodeStatus.map(status => (
              <StatusCard 
                key={status.node_id}
                node_id={status.node_id}
                power={status.power}
                voltage={status.voltage}
                _time={status._time}
              />
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
          {/* ... (the chart section remains the same) ... */}
           <div className="mb-4">
            <label htmlFor="node-select" className="block text-lg font-medium mb-2">Select a Node for Historical View:</label>
            <select 
              id="node-select" 
              value={selectedNode} 
              onChange={(e) => setSelectedNode(e.target.value)}
              className="w-full md:w-1/3 p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700"
            >
              {nodeOptions.map(node => (<option key={node} value={node}>{node}</option>))}
            </select>
          </div>
          <h2 className="text-2xl font-semibold mb-4">Power Usage for: <span className="font-bold text-indigo-400">{selectedNode}</span></h2>
          {chartLoading && <p className="text-center">Loading chart data...</p>}
          {chartError && <p className="text-center text-red-500 font-semibold">{chartError}</p>}
          <div className="w-full h-96">
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="_time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8">
                  <label {...{ value: 'Power (W)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#94a3b8' }} as any} />
                </YAxis>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#e2e8f0' }} />
                <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                <Line type="monotone" dataKey="power" stroke="#818cf8" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}