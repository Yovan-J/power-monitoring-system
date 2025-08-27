// frontend/src/components/LiveChart.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE_URL = 'http://localhost:8000';
type SensorData = { _time: string; power?: number; };

// Define the props the component will accept
type LiveChartProps = {
  selectedNode: string;
};

export function LiveChart({ selectedNode }: LiveChartProps) {
  const [chartData, setChartData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchChartData = async () => {
      try {
        // Fetch a smaller time range for the live view, e.g., last 15 minutes
        const response = await axios.get(`${API_BASE_URL}/api/nodes/${selectedNode}/data`, {
          params: { time_range: "-15m", limit: 100 } // Limit to 100 points for performance
        });
        
        if (isMounted) {
            const formattedData = response.data.data.map((d: SensorData) => ({ 
              ...d, 
              _time: new Date(d._time).toLocaleTimeString() 
            })).reverse();
            setChartData(formattedData);
            setError(null);
        }
      } catch (err) {
        if (isMounted) setError('Failed to fetch live chart data.');
        console.error("Live chart fetch error:", err);
      } finally {
        if (isMounted && loading) setLoading(false);
      }
    };

    fetchChartData();
    const intervalId = setInterval(fetchChartData, 10000); // Refresh every 10 seconds

    return () => { isMounted = false; clearInterval(intervalId); };
  }, [selectedNode]);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Live Power Usage Trend for: <span className="font-bold text-indigo-400">{selectedNode}</span></h2>
      {loading && <p className="text-center">Loading chart data...</p>}
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
    </div>
  );
}