// frontend/src/components/Dashboard.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { StatusCard } from './StatusCard';
import { CampusSummary } from './CampusSummary';
import { CostSummary } from './CostSummary';
import { LiveChart } from './LiveChart';

const API_BASE_URL = 'http://localhost:8000';
type NodeStatus = { node_id: string; power?: number; voltage?: number; _time: string; };

export function Dashboard() {
  const [allNodeStatus, setAllNodeStatus] = useState<NodeStatus[]>([]);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);
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

  return (
    <div className="space-y-8">
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

      {/* --- THIS SECTION IS UPDATED --- */}
      <div>
        <div className="mb-4">
          <label className="block text-lg font-medium mb-2 text-slate-700 dark:text-slate-300">Select Node for Live Graph:</label>
          {/* Pill Button Selector */}
          <div className="flex flex-wrap gap-2">
            {nodeOptions.map(node => {
                const isActive = selectedNode === node;
                return (
                    <button
                        key={node}
                        onClick={() => setSelectedNode(node)}
                        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-200
                        ${isActive
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                    >
                        {node.replace('_SIM_', ' ')}
                    </button>
                )
            })}
          </div>
        </div>
        <LiveChart selectedNode={selectedNode} />
      </div>
    </div>
  );
}