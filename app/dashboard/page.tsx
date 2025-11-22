'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getResults, MeasurementResult } from '@/lib/api';
import HistoryChart from '@/components/HistoryChart';

export default function DashboardPage() {
    const router = useRouter();
    const [results, setResults] = useState<MeasurementResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const data = await getResults();
            setResults(data);
            setLoading(false);
        };
        fetchData();
    }, []);

    return (
        <main className="flex min-h-screen flex-col items-center bg-[#E0F2F7] p-4 font-sans text-[#0093D0]">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">きろく (Dashboard)</h1>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-bold hover:bg-gray-50"
                    >
                        トップへ
                    </button>
                </div>

                {/* Chart Section */}
                <div className="bg-white p-6 rounded-3xl shadow-lg space-y-4">
                    <h2 className="text-lg font-bold border-b pb-2">視力のすいい</h2>
                    {loading ? (
                        <div className="h-64 flex items-center justify-center text-gray-400">読み込み中...</div>
                    ) : results.length > 0 ? (
                        <HistoryChart data={results} />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">まだデータがありません</div>
                    )}
                </div>

                {/* List Section */}
                <div className="bg-white p-6 rounded-3xl shadow-lg space-y-4">
                    <h2 className="text-lg font-bold border-b pb-2">さいきんのきろく</h2>
                    <div className="space-y-3">
                        {loading ? (
                            <div>読み込み中...</div>
                        ) : results.length > 0 ? (
                            results.slice().reverse().slice(0, 5).map((r) => (
                                <div key={r.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500">{new Date(r.date).toLocaleDateString('ja-JP')}</span>
                                        <span className="font-bold text-sm">{r.eye === 'right' ? '右目' : '左目'} ({r.distance})</span>
                                    </div>
                                    <div className="text-xl font-bold text-[#0093D0]">
                                        {r.visual_acuity}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-400 text-center py-4">まだデータがありません</div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
