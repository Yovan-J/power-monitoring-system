// frontend/src/components/HistoricalPage.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataTable } from './DataTable';

const API_BASE_URL = 'http://localhost:8000';
type SensorData = { _time: string; power?: number; current?: number; voltage?: number; power_factor?: number; frequency?: number; };
type PaginatedData = { total: number; page: number; limit: number; data: SensorData[]; };
type TimeRange = '-1h' | '-6h' | '-24h';

function ToggleButton({ label, color, isActive, onClick }: { label: string; color: string; isActive: boolean; onClick: () => void; }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
            style={{ backgroundColor: color, color: '#fff' }}
        >
            {label}
        </button>
    );
}

export function HistoricalPage() {
  const [tableData, setTableData] = useState<PaginatedData>({ total: 0, page: 1, limit: 10, data: [] });
  const [fullChartData, setFullChartData] = useState<SensorData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string>('CLASS_SIM_01');
  const [timeRange, setTimeRange] = useState<TimeRange>('-1h');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [visibleLines, setVisibleLines] = useState({
    power: true, voltage: true, current: true, power_factor: true, frequency: true,
  });
  
  const nodeOptions = ['CLASS_SIM_01', 'CLASS_SIM_02', 'CLASS_SIM_03', 'FACULTY_SIM_01', 'LAB_SIM_01'];
  const timeRangeOptions: { label: string; value: TimeRange }[] = [
    { label: 'Last 1 Hr', value: '-1h' }, { label: 'Last 6 Hrs', value: '-6h' }, { label: 'Last 24 Hrs', value: '-24h' },
  ];
  const TABLE_LIMIT = 10;

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const tablePromise = axios.get(`${API_BASE_URL}/api/nodes/${selectedNode}/data`, {
          params: { time_range: timeRange, page: currentPage, limit: TABLE_LIMIT }
        });

        const fullDataPromise = axios.get<SensorData[]>(`${API_BASE_URL}/api/nodes/${selectedNode}/all-data`, {
          params: { time_range: timeRange }
        });

        const [tableResponse, fullDataResponse] = await Promise.all([tablePromise, fullDataPromise]);

        if (isMounted) {
          setTableData(tableResponse.data);
          const formattedChartData = fullDataResponse.data.map(d => ({
            ...d,
            _time: new Date(d._time).toLocaleString(),
          }));
          setFullChartData(formattedChartData);
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
  }, [selectedNode, currentPage, timeRange]);

  const handleExportCSV = async (exportAll: boolean = false) => {
    setIsExporting(true);
    try {
      const params = { time_range: exportAll ? "all" : timeRange };
      const response = await axios.get<SensorData[]>(`${API_BASE_URL}/api/nodes/${selectedNode}/all-data`, { params });
      const allData = response.data;
      if (allData.length === 0) { alert("No data to export."); return; }
      const headers = "timestamp,power_W,current_A,voltage_V,power_factor,frequency_Hz";
      const rows = allData.map(d => `"${new Date(d._time).toLocaleString()}",${d.power || ''},${d.current || ''},${d.voltage || ''},${d.power_factor || ''},${d.frequency || ''}`);
      const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows.join('\n')}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      const fileName = `${selectedNode}_${exportAll ? 'all_time' : timeRange}_data.csv`;
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export data.");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleLine = (line: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({ ...prev, [line]: !prev[line] }));
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <label className="block text-lg font-medium mb-2">Select Node:</label>
            <div className="flex flex-wrap gap-2 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
            {nodeOptions.map(node => (
                <button
                key={node}
                onClick={() => { setSelectedNode(node); setCurrentPage(1); }}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 flex-grow ${selectedNode === node ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                >{node.replace('_SIM_', ' ')}</button>
            ))}
            </div>
          </div>
          <div className="self-end flex gap-2">
            <button 
                onClick={() => handleExportCSV(false)}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 disabled:opacity-50"
                disabled={isExporting || loading}
            >{isExporting ? '...' : 'Export View'}</button>
            <button 
                onClick={() => handleExportCSV(true)}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-md hover:bg-green-700 disabled:opacity-50"
                disabled={isExporting || loading}
            >{isExporting ? '...' : 'Download All'}</button>
          </div>
        </div>
        <div>
          <label className="block text-lg font-medium mb-2">Select Time Range:</label>
          <div className="flex flex-wrap gap-2">
            {timeRangeOptions.map(option => (
            <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors duration-200 ${timeRange === option.value ? 'bg-indigo-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
            >{option.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-lg font-medium mb-2">Toggle Waveforms:</label>
          <div className="flex flex-wrap gap-2">
            <ToggleButton label="Power" color="#818cf8" isActive={visibleLines.power} onClick={() => toggleLine('power')} />
            <ToggleButton label="Voltage" color="#fb923c" isActive={visibleLines.voltage} onClick={() => toggleLine('voltage')} />
            <ToggleButton label="Current" color="#22c55e" isActive={visibleLines.current} onClick={() => toggleLine('current')} />
            <ToggleButton label="Power Factor" color="#f43f5e" isActive={visibleLines.power_factor} onClick={() => toggleLine('power_factor')} />
            <ToggleButton label="Frequency" color="#0ea5e9" isActive={visibleLines.frequency} onClick={() => toggleLine('frequency')} />
          </div>
        </div>
      </div>

      {loading && <p className="text-center">Loading data...</p>}
      {error && <p className="text-center text-red-500 font-semibold">{error}</p>}
      
      {!loading && !error && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md h-[28rem]">
            <h3 className="text-xl font-semibold mb-4">Power & Voltage</h3>
            <ResponsiveContainer>
                <LineChart data={fullChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="_time" stroke="#94a3b8" />
                    <YAxis yAxisId="left" stroke="#818cf8" hide={!visibleLines.power} />
                    <YAxis yAxisId="right" orientation="right" stroke="#fb923c" hide={!visibleLines.voltage} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e2b3b', border: '1px solid #475569' }} />
                    <Legend />
                    {visibleLines.power && <Line yAxisId="left" type="monotone" dataKey="power" name="Power (W)" stroke="#818cf8" dot={false} />}
                    {visibleLines.voltage && <Line yAxisId="right" type="monotone" dataKey="voltage" name="Voltage (V)" stroke="#fb923c" dot={false} />}
                </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md h-[20rem]">
            <h3 className="text-xl font-semibold mb-4">Current</h3>
            <ResponsiveContainer>
                <LineChart data={fullChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="_time" stroke="#94a3b8" />
                    <YAxis stroke="#22c55e" hide={!visibleLines.current} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e2b3b', border: '1px solid #475569' }} />
                    <Legend />
                    {visibleLines.current && <Line type="monotone" dataKey="current" name="Current (A)" stroke="#22c55e" dot={false} />}
                </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md h-[20rem]">
            <h3 className="text-xl font-semibold mb-4">Power Quality</h3>
            <ResponsiveContainer>
                <LineChart data={fullChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="_time" stroke="#94a3b8" />
                    <YAxis yAxisId="left" stroke="#f43f5e" domain={[0, 1]} hide={!visibleLines.power_factor} />
                    <YAxis yAxisId="right" orientation="right" stroke="#0ea5e9" domain={[49, 51]} hide={!visibleLines.frequency} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e2b3b', border: '1px solid #475569' }} />
                    <Legend />
                    {visibleLines.power_factor && <Line yAxisId="left" type="monotone" dataKey="power_factor" name="Power Factor" stroke="#f43f5e" dot={false} />}
                    {visibleLines.frequency && <Line yAxisId="right" type="monotone" dataKey="frequency" name="Frequency (Hz)" stroke="#0ea5e9" dot={false} />}
                </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Historical Data Log</h3>
            <DataTable 
                data={tableData.data}
                totalRecords={tableData.total}
                page={tableData.page}
                limit={tableData.limit}
                onPageChange={(newPage) => setCurrentPage(newPage)}
            />
          </div>
        </div>
      )}
    </div>
  );
}