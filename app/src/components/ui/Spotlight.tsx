import React, { useRef, useState } from 'react';

/**
 * Spotlight Component
 * Adds a mouse-tracking gradient glow effect to the container.
 * Inspired by modern UI libraries (Linear, Aceternity).
 */

interface SpotlightProps {
    className?: string;
    fill?: string;
}

export const Spotlight: React.FC<SpotlightProps> = ({ className = "", fill = "white" }) => {
    return (
        <div
            className={`pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300 z-30 ${className}`}
            aria-hidden="true"
        >
            {/* Placeholder for future SVG spotlight logic if needed. 
            For now, we use the CSS mask method in the parent Card component mostly, 
            but this component is reserved for the 'Light Cone' effect from the top.
        */}
            <svg
                className="animate-spotlight pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%] opacity-0"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 3787 2842"
                fill="none"
            >
                <g filter="url(#filter0_f_29_29)">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M85 0C85 0 812 326 984 1119C1156 1912 562.5 2549 562.5 2549L17.5 2168C17.5 2168 360.5 2200 85 0Z"
                        fill={fill}
                        fillOpacity="0.21"
                    />
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M1962 575C1962 575 1478.5 874.5 1599.5 2049C1720.5 3223.5 1461.5 2847 1461.5 2847L581 2168C581 2168 1269 1195.5 1962 575Z"
                        fill={fill}
                        fillOpacity="0.1"
                    />
                </g>
                <defs>
                    <filter
                        id="filter0_f_29_29"
                        x="0.860352"
                        y="0.838989"
                        width="3785.16"
                        height="2840.26"
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                    >
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur_29_29" />
                    </filter>
                </defs>
            </svg>
        </div>
    );
};

export const SpotlightCard = ({ children, className = "", spotlightColor = "rgba(255,255,255,0.1)" }: { children: React.ReactNode; className?: string; spotlightColor?: string }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;

        const div = divRef.current;
        const rect = div.getBoundingClientRect();

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleFocus = () => {
        setOpacity(1);
    };

    const handleBlur = () => {
        setOpacity(0);
    };

    const handleMouseEnter = () => {
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden rounded-xl border border-white/10 bg-brand-grey ${className}`}
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
                }}
            />
            <div className="relative h-full">{children}</div>
        </div>
    );
};
