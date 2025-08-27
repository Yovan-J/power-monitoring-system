// frontend/src/components/DataTable.tsx
type SensorData = {
  _time: string;
  power?: number;
  current?: number;
  voltage?: number;
  power_factor?: number;
  frequency?: number;
};

type DataTableProps = {
  data: SensorData[];
  totalRecords: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
};

export function DataTable({ data, totalRecords, page, limit, onPageChange }: DataTableProps) {
  const totalPages = Math.ceil(totalRecords / limit);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Power (W)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Current (A)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Voltage (V)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Power Factor</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((record, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">{new Date(record._time).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.power?.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.current?.toFixed(3)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.voltage?.toFixed(1)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{record.power_factor?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Page {page} of {totalPages} ({totalRecords} records)
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}