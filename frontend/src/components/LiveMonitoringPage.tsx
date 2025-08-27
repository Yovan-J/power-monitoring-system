// frontend/src/components/LiveMonitoringPage.tsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { NodeLiveView } from './NodeLiveView';

const API_BASE_URL = 'http://localhost:8000';
type NodeStatus = {
  node_id: string; power?: number; voltage?: number; current?: number;
  power_factor?: number; frequency?: number; _time: string;
};
type SensorData = { _time: string; power?: number; voltage?: number; current?: number; };
const MAX_CHART_POINTS = 100; // Keep the chart from getting too crowded

export function LiveMonitoringPage() {
  const [liveData, setLiveData] = useState<Record<string, NodeStatus>>({});
  const [historyData, setHistoryData] = useState<Record<string, SensorData[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string>('CLASS_SIM_01');
  const nodeOptions = ['CLASS_SIM_01', 'CLASS_SIM_02', 'CLASS_SIM_03', 'FACULTY_SIM_01', 'LAB_SIM_01'];
  const lastTimestampRef = useRef<Record<string, string>>({}); // Use a ref to store the last timestamp for each node

  useEffect(() => {
    let isMounted = true;
    
    // Function for the initial full data load
    const initialFetch = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
      try {
        const historyPromises = nodeOptions.map(nodeId => 
            axios.get<SensorData[]>(`${API_BASE_URL}/api/nodes/${nodeId}/all-data`, { params: { time_range: "-15m" }})
        );
        const historyResponses = await Promise.all(historyPromises);
        if (!isMounted) return;

        const newHistoryData: Record<string, SensorData[]> = {};
        historyResponses.forEach((response, index) => {
            const nodeId = nodeOptions[index];
            if (response.data.length > 0) {
                lastTimestampRef.current[nodeId] = response.data[response.data.length - 1]._time;
            }
            newHistoryData[nodeId] = response.data;
        });
        setHistoryData(newHistoryData);
      } catch(err) {
        if (isMounted) setError("Failed to fetch initial data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Function for incremental updates
    const incrementalFetch = async () => {
      if (!isMounted) return;
      try {
        // Fetch latest statuses for the indicators
        const statusResponse = await axios.get<NodeStatus[]>(`${API_BASE_URL}/api/nodes/status`);
        if(isMounted) {
            const newLiveData: Record<string, NodeStatus> = {};
            for(const status of statusResponse.data) { newLiveData[status.node_id] = status; }
            setLiveData(newLiveData);
        }

        // Fetch new data points for each chart since the last known timestamp
        const updatePromises = nodeOptions.map(nodeId => {
            const since = lastTimestampRef.current[nodeId];
            return since ? axios.get<SensorData[]>(`${API_BASE_URL}/api/nodes/${nodeId}/all-data`, { params: { since }}) : Promise.resolve({ data: [] });
        });
        const updateResponses = await Promise.all(updatePromises);
        if (!isMounted) return;

        setHistoryData(prevHistory => {
            const newHistory = { ...prevHistory };
            updateResponses.forEach((response, index) => {
                if (response.data.length > 0) {
                    const nodeId = nodeOptions[index];
                    const newPoints = response.data;
                    lastTimestampRef.current[nodeId] = newPoints[newPoints.length - 1]._time;
                    const combined = [...(newHistory[nodeId] || []), ...newPoints];
                    // Trim the data array to prevent it from growing indefinitely
                    newHistory[nodeId] = combined.slice(-MAX_CHART_POINTS);
                }
            });
            return newHistory;
        });

      } catch (err) {
        console.error("Live monitoring incremental fetch error:", err);
      }
    };

    initialFetch();
    const intervalId = setInterval(incrementalFetch, 5000);
    return () => { isMounted = false; clearInterval(intervalId); };
  }, []); // This effect runs only once on mount

  // When selectedNode changes, we don't need to re-fetch, just display the data we already have
  const currentHistory = (historyData[selectedNode] || []).map(d => ({...d, _time: new Date(d._time).toLocaleTimeString()}));
  const currentLive = liveData[selectedNode];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-lg font-medium mb-2 text-slate-700 dark:text-slate-300">Select Node:</label>
        <div className="flex flex-wrap gap-2">
            {nodeOptions.map(node => (
                <button
                    key={node}
                    onClick={() => setSelectedNode(node)}
                    className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-200 ${selectedNode === node ? 'bg-indigo-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                >
                    {node.replace('_SIM_', ' ')}
                </button>
            ))}
        </div>
      </div>
      
      {loading && <p>Loading live data...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {!loading && !error && currentLive && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4">{currentLive.node_id.replace('_SIM_', ' ')}</h3>
          <NodeLiveView 
            dataHistory={currentHistory}
            powerFactor={currentLive.power_factor || 0}
            frequency={currentLive.frequency || 0}
          />
        </div>
      )}
    </div>
  );
}