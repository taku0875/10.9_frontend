import React from 'react';

type Direction = 'up' | 'down' | 'left' | 'right';

interface LandoltCProps {
    size: number; // pixel size
    direction: Direction;
    className?: string;
    onClick?: () => void;
}

const LandoltC: React.FC<LandoltCProps> = ({ size, direction, className, onClick }) => {
    const rotation = {
        right: 0,
        down: 90,
        left: 180,
        up: 270,
    }[direction];

    // Landolt C geometry
    // Outer diameter: 5 * gap
    // Inner diameter: 3 * gap
    // Gap: 1 * gap
    // We scale everything to the 'size' prop which is the outer diameter.

    return (
        <div
            className={`flex items-center justify-center ${className}`}
            style={{ width: size, height: size, transform: `rotate(${rotation}deg)` }}
            onClick={onClick}
        >
            <svg width={size} height={size} viewBox="0 0 100 100">
                {/* Outer circle mask */}
                <mask id="c-mask">
                    <rect x="0" y="0" width="100" height="100" fill="white" />
                    {/* Inner hole */}
                    <circle cx="50" cy="50" r="30" fill="black" />
                    {/* The gap (right side) */}
                    <rect x="50" y="40" width="50" height="20" fill="black" />
                </mask>

                {/* The ring */}
                <circle cx="50" cy="50" r="50" fill="black" mask="url(#c-mask)" />
            </svg>
        </div>
    );
};

export default LandoltC;
