// frontend/src/components/Dashboard.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StatusCard } from './StatusCard';
import { CampusSummary } from './CampusSummary';
import { Sidebar } from './Sidebar';
import { CostSummary } from './CostSummary';
import { DataTable } from './DataTable';

const API_BASE_URL = 'http://localhost:8000';
type SensorData = { _time: string; power?: number; current?: number; voltage?: number; power_factor?: number; frequency?: number; };
type NodeStatus = { node_id: string; power?: number; voltage?: number; _time: string; };
type PaginatedData = { total: number; page: number; limit: number; data: SensorData[]; };

export function Dashboard() {
  const [allNodeStatus, setAllNodeStatus] = useState<NodeStatus[]>([]);
  const [tableData, setTableData] = useState<PaginatedData>({ total: 0, page: 1, limit: 10, data: [] });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string>('CLASS_SIM_01');
  const nodeOptions = ['CLASS_SIM_01', 'CLASS_SIM_02', 'CLASS_SIM_03', 'FACULTY_SIM_01', 'LAB_SIM_01'];
  const TABLE_LIMIT = 10;

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
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/nodes/${selectedNode}/data`, {
          params: { time_range: "-24h", page: currentPage, limit: TABLE_LIMIT }
        });
        if (isMounted) {
          setTableData(response.data);
        }
      } catch (err) {
        if (isMounted) {
            setError('Failed to fetch data.');
            setTableData({ total: 0, page: 1, limit: TABLE_LIMIT, data: [] });
        }
        console.error("Data fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
  }, [selectedNode, currentPage]);

  const chartData = tableData.data.map(d => ({
    ...d,
    _time: new Date(d._time).toLocaleTimeString(),
  })).reverse();

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen font-sans text-slate-800 dark:text-slate-200 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-slate-800 shadow-md p-4">
          <h1 className="text-3xl font-bold">Power Monitoring Dashboard</h1>
        </header>
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          <CampusSummary allNodeStatus={allNodeStatus} />
          <CostSummary />
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Live Node Status</h2>
            {statusLoading && <p>Loading statuses...</p>}
            {statusError && <p className="text-red-500">{statusError}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
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
            <div className="mb-4">
              <label htmlFor="node-select" className="block text-lg font-medium mb-2">Select a Node for Historical View:</label>
              <select 
                id="node-select" 
                value={selectedNode} 
                onChange={(e) => {
                  setSelectedNode(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full md:w-1/3 p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700"
              >
                {nodeOptions.map(node => (<option key={node} value={node}>{node}</option>))}
              </select>
            </div>
            <h2 className="text-2xl font-semibold mb-4">Power Usage for: <span className="font-bold text-indigo-400">{selectedNode}</span></h2>
            {loading && <p className="text-center">Loading data...</p>}
            {error && <p className="text-center text-red-500 font-semibold">{error}</p>}
            <div className="w-full h-96">
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="_time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8">
                    <label {...{ value: 'Power (W)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#94a3b8' }} as any} />
                  </YAxis>
                  <Tooltip contentStyle={{ backgroundColor: '#1e2b3b', border: '1px solid #475569', color: '#e2e8f0' }} />
                  <Legend wrapperStyle={{ color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="power" stroke="#818cf8" strokeWidth={2} dot={false} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Historical Data Log</h3>
                {loading ? (
                    <p className="text-center">Loading data...</p>
                ) : (
                    <DataTable 
                        data={tableData.data}
                        totalRecords={tableData.total}
                        page={tableData.page}
                        limit={tableData.limit}
                        onPageChange={(newPage) => setCurrentPage(newPage)}
                    />
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}