import { useState, useCallback } from 'react';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type Eye = 'right' | 'left';

// 1mm approx 13px.
// Visual Acuity (V) = 1 / gap(min)
// Gap size (mm) = 1.454 / V (at 5m standard, but we scale for distance)
// Actually, simpler formula: Size (mm) = 7.272 / V (at 5m).
// For 3m: Size_3m = Size_5m * (3/5) = (7.272 / V) * 0.6 = 4.3632 / V
// For 30cm: Size_30cm = Size_5m * (0.3/5) = (7.272 / V) * 0.06 = 0.43632 / V
// Then convert mm to px (x13).

const MM_TO_PX = 13;

const LEVELS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2];

interface TestState {
    eye: Eye;
    currentLevelIndex: number;
    consecutiveWrong: number;
    isRetrying: boolean; // If true, we are in "re-test mode" (went back a level)
    isFinished: boolean;
    result: number | null; // The determined visual acuity
    history: { level: number; correct: boolean; direction: Direction; answer: Direction }[];
    isPaused: boolean;
}

export const useVisionTest = (distance: '30cm' | '3m') => {
    const [state, setState] = useState<TestState>({
        eye: 'right',
        currentLevelIndex: 0,
        consecutiveWrong: 0,
        isRetrying: false,
        isFinished: false,
        result: null,
        history: [],
        isPaused: false,
    });

    const [currentDirection, setCurrentDirection] = useState<Direction>('right');
    const [prevStates, setPrevStates] = useState<TestState[]>([]);

    const generateDirection = () => {
        const dirs: Direction[] = ['up', 'down', 'left', 'right'];
        return dirs[Math.floor(Math.random() * 4)];
    };

    const nextTest = useCallback(() => {
        setCurrentDirection(generateDirection());
    }, []);

    const calculateSizePx = (visualAcuity: number) => {
        let sizeMm = 0;
        if (distance === '3m') {
            sizeMm = 4.3632 / visualAcuity;
        } else {
            sizeMm = 0.43632 / visualAcuity;
        }
        return sizeMm * MM_TO_PX;
    };

    const undo = () => {
        if (prevStates.length > 0) {
            const lastState = prevStates[prevStates.length - 1];
            setState(lastState);
            setPrevStates(prev => prev.slice(0, -1));
            // Also need to restore direction? 
            // Ideally yes, but random is fine for MVP or we store it in history.
            // Let's just generate new direction to avoid memorization.
            nextTest();
        }
    };

    const togglePause = () => {
        setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    };

    const answer = (direction: Direction) => {
        if (state.isPaused || state.isFinished) return;

        const isCorrect = direction === currentDirection;
        const currentLevel = LEVELS[state.currentLevelIndex];

        setPrevStates(prev => [...prev, state]);

        setState((prev) => {
            const newHistory = [...prev.history, { level: currentLevel, correct: isCorrect, direction: currentDirection, answer: direction }];

            if (isCorrect) {
                if (prev.isRetrying) {
                    // If correct in re-test mode, we are done. The result is this level.
                    return {
                        ...prev,
                        history: newHistory,
                        isFinished: true,
                        result: currentLevel,
                    };
                }

                // Normal mode correct: go to next level
                if (prev.currentLevelIndex < LEVELS.length - 1) {
                    return {
                        ...prev,
                        history: newHistory,
                        currentLevelIndex: prev.currentLevelIndex + 1,
                        consecutiveWrong: 0,
                    };
                } else {
                    // Max level reached and correct
                    return {
                        ...prev,
                        history: newHistory,
                        isFinished: true,
                        result: currentLevel,
                    };
                }
            } else {
                // Incorrect
                if (prev.isRetrying) {
                    // Failed re-test mode. Recursive fallback.
                    // Go back another level if possible.
                    if (prev.currentLevelIndex > 0) {
                        return {
                            ...prev,
                            history: newHistory,
                            currentLevelIndex: prev.currentLevelIndex - 1,
                            consecutiveWrong: 0,
                            isRetrying: true, // Still in retry mode effectively (or just normal check at lower level?)
                            // Prompt says: "1つ前サイズへ戻る（戻りモード）" -> "×（再検査）さらに戻る" -> "もう1つ前のサイズへ"
                            // So we stay in "re-test" logic? Or treat it as a fresh start at that level?
                            // Let's keep isRetrying=true to imply we are searching downwards.
                        };
                    } else {
                        // Cannot go back further (failed 0.5)
                        return {
                            ...prev,
                            history: newHistory,
                            isFinished: true,
                            result: 0.1, // < 0.5
                        };
                    }
                }

                // Normal mode incorrect
                if (prev.consecutiveWrong === 0) {
                    // First wrong, retry same level
                    return {
                        ...prev,
                        history: newHistory,
                        consecutiveWrong: 1,
                    };
                } else {
                    // Second wrong (consecutive)
                    // Go back one level (Re-test mode)
                    if (prev.currentLevelIndex > 0) {
                        return {
                            ...prev,
                            history: newHistory,
                            currentLevelIndex: prev.currentLevelIndex - 1,
                            consecutiveWrong: 0,
                            isRetrying: true,
                        };
                    } else {
                        // Failed 0.5 twice
                        return {
                            ...prev,
                            history: newHistory,
                            isFinished: true,
                            result: 0.1, // < 0.5
                        };
                    }
                }
            }
        });

        nextTest();
    };

    const startLeftEye = () => {
        setState({
            eye: 'left',
            currentLevelIndex: 0,
            consecutiveWrong: 0,
            isRetrying: false,
            isFinished: false,
            result: null,
            history: [],
            isPaused: false,
        });
        setPrevStates([]);
        nextTest();
    };

    return {
        state,
        currentDirection,
        calculateSizePx,
        answer,
        startLeftEye,
        nextTest,
        undo,
        togglePause,
        canUndo: prevStates.length > 0,
    };
};
