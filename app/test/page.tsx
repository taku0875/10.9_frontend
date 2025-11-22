'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LandoltC from '@/components/LandoltC';
import { useVisionTest, Direction } from '@/hooks/useVisionTest';
import { saveResult } from '@/lib/api';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useVoiceGuidance } from '@/hooks/useVoiceGuidance';

function TestContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const distance = (searchParams.get('distance') as '30cm' | '3m') || '30cm';

    const { state, currentDirection, calculateSizePx, answer, startLeftEye, nextTest, undo, togglePause, canUndo } = useVisionTest(distance);
    const [showResult, setShowResult] = useState(false);
    const [saved, setSaved] = useState(false);
    const { speak } = useVoiceGuidance();

    const handleAnswer = (dir: Direction) => {
        answer(dir);
    };

    const { isListening, startListening, error: voiceError } = useVoiceInput(handleAnswer, state.isPaused);

    // Initial setup - RUNS ONLY ONCE ON MOUNT
    useEffect(() => {
        nextTest();
        startListening();
        speak('検査をはじめます。開いている方向を教えてください。');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle finish state voice guidance
    useEffect(() => {
        if (state.isFinished) {
            if (state.eye === 'right') {
                speak('右目の検査が終わりました。次は左目です。');
            } else {
                speak('検査が終わりました。お疲れ様でした。');
            }
        }
    }, [state.isFinished, state.eye, speak]);

    const handleNextEye = () => {
        if (state.result !== null) {
            saveResult('right', distance, state.result);
        }
        startLeftEye();
    };

    const handleFinish = async () => {
        if (state.result !== null) {
            await saveResult('left', distance, state.result);
        }
        setSaved(true);
        setShowResult(true);
    };

    if (showResult) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-[#E0F2F7] p-4 font-sans text-[#0093D0]">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6 border-4 border-[#0093D0]">
                    <h2 className="text-3xl font-bold">おつかれさま！</h2>
                    <p className="text-xl text-gray-700">チェックがおわりました</p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-4 bg-[#0093D0] hover:bg-[#007bb5] text-white rounded-2xl font-bold text-xl shadow-md transition-transform active:scale-95"
                    >
                        トップへもどる
                    </button>
                </div>
            </main>
        );
    }

    if (state.isFinished) {
        if (state.eye === 'right') {
            return (
                <main className="flex min-h-screen flex-col items-center justify-center bg-[#E0F2F7] p-4 font-sans text-[#0093D0]">
                    <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6 border-4 border-[#0093D0]">
                        <h2 className="text-2xl font-bold">右目のおわり！</h2>
                        <p className="text-lg text-gray-700">つぎは左目をかくして、<br />左目でやってみよう</p>
                        <button
                            onClick={handleNextEye}
                            className="w-full py-4 bg-[#0093D0] hover:bg-[#007bb5] text-white rounded-2xl font-bold text-xl shadow-md transition-transform active:scale-95"
                        >
                            左目をはじめる
                        </button>
                    </div>
                </main>
            );
        } else {
            return (
                <main className="flex min-h-screen flex-col items-center justify-center bg-[#E0F2F7] p-4 font-sans text-[#0093D0]">
                    <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6 border-4 border-[#0093D0]">
                        <h2 className="text-2xl font-bold">左目のおわり！</h2>
                        <p className="text-lg text-gray-700">これでおしまいです</p>
                        <button
                            onClick={handleFinish}
                            className="w-full py-4 bg-[#0093D0] hover:bg-[#007bb5] text-white rounded-2xl font-bold text-xl shadow-md transition-transform active:scale-95"
                        >
                            結果をほぞんする
                        </button>
                    </div>
                </main>
            );
        }
    }

    const currentLevel = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2][state.currentLevelIndex];
    const sizePx = calculateSizePx(currentLevel);

    return (
        <main className="flex min-h-screen flex-col items-center bg-white overflow-hidden font-sans">
            {/* Header */}
            <div className="w-full p-4 flex justify-between items-center bg-[#E0F2F7] text-[#0093D0]">
                <span className="font-bold text-lg">
                    {state.eye === 'right' ? '右目 (みぎめ)' : '左目 (ひだりめ)'}
                </span>
                <div className="flex items-center gap-2">
                    {isListening && <span className="text-xs bg-red-100 text-red-500 px-2 py-1 rounded-full animate-pulse">音声ON</span>}
                    <span className="text-sm font-bold bg-white px-3 py-1 rounded-full shadow-sm">
                        {distance}
                    </span>
                </div>
            </div>

            {/* C Display Area */}
            <div className="flex-1 flex items-center justify-center w-full relative bg-[#FAFAFA]">
                {state.isPaused ? (
                    <div className="text-2xl font-bold text-gray-400">一時停止中</div>
                ) : (
                    <LandoltC size={sizePx} direction={currentDirection} />
                )}

                {state.isRetrying && !state.isPaused && (
                    <div className="absolute top-8 text-[#0093D0] font-bold text-xl animate-bounce bg-white px-4 py-2 rounded-full shadow-md border-2 border-[#0093D0]">
                        もういっかい！
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="w-full max-w-md p-4 pb-8 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] relative">
                {/* Support Buttons */}
                <div className="absolute -top-12 right-4 flex gap-2">
                    <button
                        onClick={togglePause}
                        className="bg-white p-3 rounded-full shadow-md text-gray-500 hover:text-[#0093D0] transition-colors"
                        title="一時停止"
                    >
                        {state.isPaused ? '▶' : '⏸'}
                    </button>
                    <button
                        onClick={undo}
                        disabled={!canUndo}
                        className={`bg-white p-3 rounded-full shadow-md transition-colors ${!canUndo ? 'text-gray-300' : 'text-gray-500 hover:text-[#0093D0]'}`}
                        title="ひとつ戻る"
                    >
                        ↩
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="col-start-2">
                        <button onClick={() => handleAnswer('up')} className="w-full aspect-square bg-[#E0F2F7] hover:bg-[#B3E5FC] text-[#0093D0] rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center text-4xl font-bold">
                            ↑
                        </button>
                    </div>
                    <div className="col-start-1 row-start-2">
                        <button onClick={() => handleAnswer('left')} className="w-full aspect-square bg-[#E0F2F7] hover:bg-[#B3E5FC] text-[#0093D0] rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center text-4xl font-bold">
                            ←
                        </button>
                    </div>
                    <div className="col-start-2 row-start-2 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                            ●
                        </div>
                    </div>
                    <div className="col-start-3 row-start-2">
                        <button onClick={() => handleAnswer('right')} className="w-full aspect-square bg-[#E0F2F7] hover:bg-[#B3E5FC] text-[#0093D0] rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center text-4xl font-bold">
                            →
                        </button>
                    </div>
                    <div className="col-start-2 row-start-3">
                        <button onClick={() => handleAnswer('down')} className="w-full aspect-square bg-[#E0F2F7] hover:bg-[#B3E5FC] text-[#0093D0] rounded-2xl shadow-sm active:scale-95 transition-all flex items-center justify-center text-4xl font-bold">
                            ↓
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function TestPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TestContent />
        </Suspense>
    );
}
