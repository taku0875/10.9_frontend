const API_URL = 'http://localhost:8000/api';

export interface MeasurementResult {
    id: number;
    date: string;
    eye: string;
    distance: string;
    visual_acuity: number;
}

export const saveResult = async (eye: string, distance: string, visualAcuity: number) => {
    try {
        const response = await fetch(`${API_URL}/results`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ eye, distance, visual_acuity: visualAcuity }),
        });
        if (!response.ok) {
            throw new Error('Failed to save result');
        }
        return response.json();
    } catch (error) {
        console.error(error);
        // For MVP, just log error
    }
};

export const getResults = async (): Promise<MeasurementResult[]> => {
    try {
        const response = await fetch(`${API_URL}/results`);
        if (!response.ok) {
            throw new Error('Failed to fetch results');
        }
        return response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};
