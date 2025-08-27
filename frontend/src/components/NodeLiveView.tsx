// frontend/src/components/NodeLiveView.tsx
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';

type NodeLiveViewProps = {
  dataHistory: any[];
  powerFactor: number;
  frequency: number;
};

function SparklineIndicator({ title, unit, data, dataKey, color }: { title: string; unit: string; data: any[]; dataKey: string; color: string; }) {
    const latestValue = data.length > 0 ? data[data.length - 1][dataKey] : 0;
    return (
        <div className="flex items-center justify-between p-3 rounded-lg gap-4">
            <div>
                <h4 className="font-medium text-slate-500 dark:text-slate-400">{title}</h4>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {latestValue.toFixed(2)} <span className="text-lg">{unit}</span>
                </p>
            </div>
            <div className="w-28 h-12 flex-shrink-0">
                <ResponsiveContainer>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={color} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip contentStyle={{ backgroundColor: '#1e2b3b', border: '1px solid #475569' }} />
                        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color-${dataKey})`} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function ToggleButton({ label, color, isActive, onClick }: { label: string; color: string; isActive: boolean; onClick: () => void; }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-opacity duration-200
            ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
            style={{ backgroundColor: color, color: '#fff' }}
        >
            {label}
        </button>
    );
}

export function NodeLiveView({ dataHistory, powerFactor, frequency }: NodeLiveViewProps) {
  const [visibleLines, setVisibleLines] = useState({
    power: true,
    voltage: true,
  });

  const toggleLine = (line: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({ ...prev, [line]: !prev[line] }));
  };

  return (
    <div className="space-y-4">
      {/* --- THIS SECTION IS UPDATED --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Box around Power Factor */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <SparklineIndicator title="Power Factor" unit="" data={dataHistory} dataKey="power_factor" color="#f43f5e" />
        </div>
        {/* Box around Frequency */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <SparklineIndicator title="Frequency" unit="Hz" data={dataHistory} dataKey="frequency" color="#0ea5e9" />
        </div>
      </div>

      <div className="flex justify-center gap-4 py-2">
        <ToggleButton label="Power" color="#818cf8" isActive={visibleLines.power} onClick={() => toggleLine('power')} />
        <ToggleButton label="Voltage" color="#fb923c" isActive={visibleLines.voltage} onClick={() => toggleLine('voltage')} />
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer>
          <LineChart data={dataHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="_time" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" stroke="#818cf8" hide={!visibleLines.power} label={{ value: 'Power (W)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#fb923c" hide={!visibleLines.voltage} label={{ value: 'Voltage (V)', angle: -90, position: 'insideRight', fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e2b3b', border: '1px solid #475569' }} />
            <Legend />
            {visibleLines.power && <Line yAxisId="left" type="monotone" dataKey="power" stroke="#818cf8" dot={false} />}
            {visibleLines.voltage && <Line yAxisId="right" type="monotone" dataKey="voltage" stroke="#fb923c" dot={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full h-48">
        <ResponsiveContainer>
          <LineChart data={dataHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="_time" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#22c55e" label={{ value: 'Current (A)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e2b3b', border: '1px solid #475569' }} />
            <Legend />
            <Line type="monotone" dataKey="current" stroke="#22c55e" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}