// frontend/src/components/CostSummary.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

type CostData = {
  daily: number;
  weekly: number;
  monthly: number;
};

function CostCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md text-center">
      <h4 className="text-md font-medium text-slate-500 dark:text-slate-400">{title}</h4>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">
        ₹{value.toFixed(2)}
      </p>
    </div>
  );
}

export function CostSummary() {
  const [costs, setCosts] = useState<CostData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCostData = async () => {
      try {
        const response = await axios.get<CostData>(`${API_BASE_URL}/api/campus/cost`);
        setCosts(response.data);
      } catch (err) {
        setError('Failed to fetch cost data.');
        console.error(err);
      }
    };
    fetchCostData();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Cost Estimation</h2>
      {error && <p className="text-red-500">{error}</p>}
      {costs ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CostCard title="Last 24 Hours" value={costs.daily} />
          <CostCard title="Last 7 Days" value={costs.weekly} />
          <CostCard title="Last 30 Days" value={costs.monthly} />
        </div>
      ) : (
        <p>Loading cost data...</p>
      )}
    </div>
  );
}