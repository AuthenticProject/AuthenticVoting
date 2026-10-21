import React, { useState } from 'react';
import defaultOfficialLogo from '../../assets/logo.png';

interface LogoProps {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({
  src,
  alt = 'Lambang Resmi Pemilihan',
  className = '',
  size = 'md',
}) => {
  // If no custom uploaded logo or if it references default/legacy paths, use the bundled official logo.png
  const isDefaultOrLegacy =
    !src ||
    src.trim() === '' ||
    src === '/logo.png' ||
    src === '/assets/logo.png' ||
    src === '/assets/logo-garuda.svg';

  const activeSrc = isDefaultOrLegacy ? defaultOfficialLogo : src;
  const [prevSrc, setPrevSrc] = useState(activeSrc);
  const [imgError, setImgError] = useState(false);

  if (prevSrc !== activeSrc) {
    setPrevSrc(activeSrc);
    setImgError(false);
  }

  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  // If a valid custom logo URL is provided and has not errored, render the image
  if (activeSrc && !imgError) {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
        <img
          src={activeSrc}
          alt={alt}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain drop-shadow-md rounded-xl"
        />
      </div>
    );
  }

  // Fallback to the authoritative institutional golden shield & star SVG
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      {/* Outer Golden Laurel / Shield Ring */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <circle cx="50" cy="50" r="46" stroke="#D4AF37" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.6" />
        <circle cx="50" cy="50" r="41" stroke="#E5C158" strokeWidth="1.5" />
        
        {/* Shield background */}
        <path
          d="M50 18L72 26V48C72 63.5 62.5 75 50 82C37.5 75 28 63.5 28 48V26L50 18Z"
          fill="url(#navyGrad)"
          stroke="#D4AF37"
          strokeWidth="2"
        />

        {/* Five-point Star representing Honour & Leadership */}
        <polygon
          points="50,28 53.5,38 64,38 55.5,44 59,54 50,48 41,54 44.5,44 36,38 46.5,38"
          fill="url(#goldGrad)"
          stroke="#B08D23"
          strokeWidth="0.5"
        />

        {/* Balance Scale / Pillar mark */}
        <path
          d="M42 64H58M50 52V64M45 56H55"
          stroke="#E5C158"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Small laurel leaf accents */}
        <path
          d="M20 52C18 42 24 32 30 28"
          stroke="#D4AF37"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M80 52C82 42 76 32 70 28"
          stroke="#D4AF37"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
        />

        <defs>
          <linearGradient id="navyGrad" x1="50" y1="18" x2="50" y2="82" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2C2C2E" />
            <stop offset="1" stopColor="#1C1C1E" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="50" y1="28" x2="50" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF2D6" />
            <stop offset="0.4" stopColor="#E5C158" />
            <stop offset="1" stopColor="#B08D23" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
