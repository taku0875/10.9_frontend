import { useState, useEffect, useCallback } from 'react';
import { Direction } from './useVisionTest';

// Extend Window interface for webkitSpeechRecognition
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

export const useVoiceInput = (onAnswer: (dir: Direction) => void, isPaused: boolean) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startListening = useCallback(() => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Browser does not support speech recognition.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => setError(event.error);

        recognition.onresult = (event: any) => {
            if (isPaused) return;
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript.trim();
            console.log('Voice Input:', transcript);

            if (transcript.includes('上') || transcript.includes('うえ')) onAnswer('up');
            else if (transcript.includes('下') || transcript.includes('した')) onAnswer('down');
            else if (transcript.includes('左') || transcript.includes('ひだり')) onAnswer('left');
            else if (transcript.includes('右') || transcript.includes('みぎ')) onAnswer('right');
        };

        recognition.start();
        return () => recognition.stop();
    }, [onAnswer, isPaused]);

    return { isListening, error, startListening };
};
