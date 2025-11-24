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
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Browser does not support speech recognition.');
            return;
        }

        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.lang = 'ja-JP';
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = false;

        recognitionInstance.onstart = () => setIsListening(true);
        recognitionInstance.onend = () => {
            setIsListening(false);
        };
        recognitionInstance.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setError(event.error);
            setIsListening(false);
        };

        recognitionInstance.onresult = (event: any) => {
            if (isPaused) return;
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript.trim();
            console.log('Voice Input:', transcript);

            if (transcript.includes('上') || transcript.includes('うえ')) onAnswer('up');
            else if (transcript.includes('下') || transcript.includes('した')) onAnswer('down');
            else if (transcript.includes('左') || transcript.includes('ひだり')) onAnswer('left');
            else if (transcript.includes('右') || transcript.includes('みぎ')) onAnswer('right');
        };

        setRecognition(recognitionInstance);
    }, [onAnswer, isPaused]);

    const startListening = useCallback(() => {
        if (recognition && !isListening) {
            try {
                recognition.start();
            } catch (e) {
                console.error("Failed to start recognition:", e);
            }
        }
    }, [recognition, isListening]);

    const stopListening = useCallback(() => {
        if (recognition && isListening) {
            recognition.stop();
        }
    }, [recognition, isListening]);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    return { isListening, error, startListening, stopListening, toggleListening };
};
