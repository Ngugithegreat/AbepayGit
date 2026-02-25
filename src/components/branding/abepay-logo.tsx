'use client';

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function AbepayLogo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: 'text-lg' },
    md: { icon: 48, text: 'text-2xl' },
    lg: { icon: 64, text: 'text-3xl' },
    xl: { icon: 96, text: 'text-5xl' },
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon - Gradient A */}
      <div 
        style={{ width: currentSize.icon, height: currentSize.icon }}
        className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 shadow-xl"
      >
        <span className="text-white font-black" style={{ fontSize: currentSize.icon * 0.5 }}>
          A
        </span>
        
        {/* Animated pulse effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-300 animate-pulse opacity-30" />
      </div>

      {/* App Name */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent ${currentSize.text}`}>
            ABEPAY
          </span>
          <span className="text-xs text-gray-500 font-medium -mt-1">
            Payment Agent
          </span>
        </div>
      )}
    </div>
  );
}
