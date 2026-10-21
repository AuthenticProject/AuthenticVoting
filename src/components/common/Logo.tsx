import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      {/* Outer Golden Laurel / Shield Ring */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <circle cx="50" cy="50" r="46" stroke="#C9A45C" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.6" />
        <circle cx="50" cy="50" r="41" stroke="#DFBF7A" strokeWidth="1.5" />
        
        {/* Shield background */}
        <path
          d="M50 18L72 26V48C72 63.5 62.5 75 50 82C37.5 75 28 63.5 28 48V26L50 18Z"
          fill="url(#navyGrad)"
          stroke="#C9A45C"
          strokeWidth="2"
        />

        {/* Five-point Star representing Honour & Leadership */}
        <polygon
          points="50,28 53.5,38 64,38 55.5,44 59,54 50,48 41,54 44.5,44 36,38 46.5,38"
          fill="url(#goldGrad)"
          stroke="#9F7E3B"
          strokeWidth="0.5"
        />

        {/* Balance Scale / Pillar mark */}
        <path
          d="M42 64H58M50 52V64M45 56H55"
          stroke="#DFBF7A"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Small laurel leaf accents */}
        <path
          d="M20 52C18 42 24 32 30 28"
          stroke="#C9A45C"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M80 52C82 42 76 32 70 28"
          stroke="#C9A45C"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
        />

        <defs>
          <linearGradient id="navyGrad" x1="50" y1="18" x2="50" y2="82" gradientUnits="userSpaceOnUse">
            <stop stopColor="#24344E" />
            <stop offset="1" stopColor="#101D35" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="50" y1="28" x2="50" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF2D6" />
            <stop offset="0.4" stopColor="#DFBF7A" />
            <stop offset="1" stopColor="#9F7E3B" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
