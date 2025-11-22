'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MeasurementResult } from '@/lib/api';

interface HistoryChartProps {
    data: MeasurementResult[];
}

export default function HistoryChart({ data }: HistoryChartProps) {
    // Process data for chart
    // Group by date? Or just show all points?
    // Let's show individual points for now, maybe filtered by eye/distance if we had more data.
    // For MVP, let's just map date to a readable format.

    const formattedData = data.map(item => ({
        ...item,
        dateStr: new Date(item.date).toLocaleDateString('ja-JP'),
        visual_acuity: item.visual_acuity,
    }));

    return (
        <div className="w-full h-64 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={formattedData}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="dateStr" stroke="#888" fontSize={12} />
                    <YAxis domain={[0, 2.0]} stroke="#888" fontSize={12} />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="visual_acuity" stroke="#0093D0" strokeWidth={3} dot={{ r: 4, fill: '#0093D0' }} name="視力" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
