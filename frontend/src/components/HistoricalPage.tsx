// frontend/src/components/HistoricalPage.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataTable } from './DataTable';

const API_BASE_URL = 'http://localhost:8000';
type SensorData = { _time: string; power?: number; current?: number; voltage?: number; power_factor?: number; frequency?: number; };
type PaginatedData = { total: number; page: number; limit: number; data: SensorData[]; };
type GraphMode = 'page' | 'all';

export function HistoricalPage() {
  const [tableData, setTableData] = useState<PaginatedData>({ total: 0, page: 1, limit: 10, data: [] });
  const [fullChartData, setFullChartData] = useState<SensorData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string>('CLASS_SIM_01');
  const [graphMode, setGraphMode] = useState<GraphMode>('page');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const nodeOptions = ['CLASS_SIM_01', 'CLASS_SIM_02', 'CLASS_SIM_03', 'FACULTY_SIM_01', 'LAB_SIM_01'];
  const TABLE_LIMIT = 10;

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const tableResponse = await axios.get(`${API_BASE_URL}/api/nodes/${selectedNode}/data`, {
          params: { time_range: "-24h", page: currentPage, limit: TABLE_LIMIT }
        });

        if (isMounted) {
          setTableData(tableResponse.data);
          if (graphMode === 'all') {
            const chartResponse = await axios.get<SensorData[]>(`${API_BASE_URL}/api/nodes/${selectedNode}/all-data`, {
              params: { time_range: "-24h" }
            });
            setFullChartData(chartResponse.data);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch data.');
          setTableData({ total: 0, page: 1, limit: TABLE_LIMIT, data: [] });
          setFullChartData([]);
        }
        console.error("Data fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    
    return () => { isMounted = false; };
  }, [selectedNode, currentPage, graphMode]);

  const chartData = (graphMode === 'page' ? tableData.data : fullChartData)
    .map(d => ({
      ...d,
      _time: new Date(d._time).toLocaleTimeString(),
    }))
    .reverse();
  
  // --- THIS IS THE CORRECTED, FULLY IMPLEMENTED FUNCTION ---
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get<SensorData[]>(`${API_BASE_URL}/api/nodes/${selectedNode}/all-data`, {
        params: { time_range: "-24h" }
      });
      
      const allData = response.data;
      if (allData.length === 0) {
        alert("No data to export.");
        return;
      }
      
      const headers = "timestamp,power_W,current_A,voltage_V,power_factor,frequency_Hz";
      const rows = allData.map(d => 
        `"${new Date(d._time).toLocaleString()}",${d.power || ''},${d.current || ''},${d.voltage || ''},${d.power_factor || ''},${d.frequency || ''}`
      );
      
      const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows.join('\n')}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${selectedNode}_full_data_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export data.");
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      <div className="mb-6">
          <label className="block text-lg font-medium mb-2">Select a Node:</label>
          <div className="flex flex-wrap gap-2 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
            {nodeOptions.map(node => {
              const isActive = selectedNode === node;
              return (
                <button
                  key={node}
                  onClick={() => {
                    setSelectedNode(node);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 flex-grow
                    ${isActive 
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`
                  }
                >
                  {node.replace('_SIM_', ' ')}
                </button>
              )
            })}
          </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-semibold">Power Usage Trend for: <span className="font-bold text-indigo-400">{selectedNode}</span></h2>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span>Page Data</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={graphMode === 'all'} onChange={(e) => setGraphMode(e.target.checked ? 'all' : 'page')} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
              <span>All Data</span>
            </div>
            <button 
              onClick={handleExportCSV}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 disabled:opacity-50"
              disabled={isExporting || loading}
            >
                {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
        </div>
      </div>
      
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
  );
}