import { useCallback } from 'react';

export const useVoiceGuidance = () => {
    const speak = useCallback((text: string) => {
        if (typeof window === 'undefined') return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        window.speechSynthesis.speak(utterance);
    }, []);

    return { speak };
};
