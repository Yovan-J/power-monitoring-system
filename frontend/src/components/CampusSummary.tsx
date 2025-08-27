// frontend/src/components/CampusSummary.tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

type NodeStatus = {
  node_id: string;
  power?: number;
};

type CampusSummaryProps = {
  allNodeStatus: NodeStatus[];
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

export function CampusSummary({ allNodeStatus }: CampusSummaryProps) {
  // Calculate total power
  const totalPower = allNodeStatus.reduce((sum, node) => sum + (node.power || 0), 0);

  // Calculate power breakdown by room type
  const powerByRoomType = allNodeStatus.reduce((acc, node) => {
    const roomType = node.node_id.split('_')[0]; // e.g., 'CLASS', 'LAB'
    acc[roomType] = (acc[roomType] || 0) + (node.power || 0);
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.keys(powerByRoomType).map(key => ({
    name: `${key}S`,
    value: parseFloat(powerByRoomType[key].toFixed(2)),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Total Power Display */}
      <div className="md:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
        <h3 className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-2">Total Campus Power</h3>
        <p className="text-5xl font-extrabold text-slate-900 dark:text-white">
          {(totalPower / 1000).toFixed(2)}
          <span className="text-2xl font-medium"> kW</span>
        </p>
      </div>

      {/* Pie Chart Display */}
      <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-4">Power Distribution by Room Type</h3>
        <div className="w-full h-64">
          <ResponsiveContainer>
            <PieChart>
              <Tooltip formatter={(value: number) => `${value.toFixed(2)} W`} />
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                // --- THIS IS THE FIX ---
                // The label function receives the full payload object
                label={({ name, percent, ...payload }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}