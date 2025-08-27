// frontend/src/components/StatusCard.tsx
type StatusCardProps = {
  node_id: string;
  power?: number;
  voltage?: number;
  _time: string; // Prop is still received but not used
};

export function StatusCard({ node_id, power = 0, voltage = 0 }: StatusCardProps) {
  const powerLevel = power > 1500 ? 'high' : power > 500 ? 'medium' : 'low';
  
  const statusColorClasses = {
    low: 'bg-green-100 dark:bg-green-900/50 border-green-500',
    medium: 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-500',
    high: 'bg-red-100 dark:bg-red-900/50 border-red-500',
  };

  return (
    <div className={`p-4 rounded-lg shadow-md border-l-4 ${statusColorClasses[powerLevel]}`}>
      <div className="flex justify-between items-center mb-2">
        {/* The timestamp span has been removed from here */}
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{node_id}</h3>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
          {power.toFixed(2)} <span className="text-lg font-medium">W</span>
        </p>
        <p className="text-md text-slate-600 dark:text-slate-300">
          {voltage.toFixed(1)} V
        </p>
      </div>
    </div>
  );
}