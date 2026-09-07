import React from 'react';

type IconProps = { size?: number; className?: string };

export const SearchIcon = ({ size = 14, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M229.7 218.3l-43.3-43.3a92.1 92.1 0 10-11.4 11.4l43.3 43.3a8 8 0 0011.4-11.4zM40 112a72 72 0 1172 72 72.1 72.1 0 01-72-72z" />
  </svg>
);

export const SparkleIcon = ({ size = 15, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M137.5 22.5a8 8 0 00-13.6 4l-8.9 44.5-38.2-22.9a8 8 0 00-10.4 11.8l28.6 34.4-44.2 10.4a8 8 0 00.4 15.6l44.7 8.4-24.6 37.7a8 8 0 0011.1 11.1l37.7-24.6 8.4 44.7a8 8 0 0015.6.4l10.4-44.2 34.4 28.6a8 8 0 0011.8-10.4l-22.9-38.2 44.5-8.9a8 8 0 004-13.6z" />
  </svg>
);

export const PlusIcon = ({ size = 15, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M224 128a8 8 0 01-8 8h-80v80a8 8 0 01-16 0v-80H40a8 8 0 010-16h80V40a8 8 0 0116 0v80h80a8 8 0 018 8z" />
  </svg>
);

export const LinkIcon = ({ size = 15, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M137.5 118.5a8 8 0 010 11.3l-28.3 28.3a40 40 0 01-56.6-56.6l28.3-28.2a8 8 0 0111.3 11.3l-28.3 28.3a24 24 0 0033.9 33.9l28.3-28.3a8 8 0 0111.4 0zm66-66a40 40 0 00-56.6 0l-28.2 28.3a8 8 0 0011.3 11.3l28.3-28.3a24 24 0 0133.9 33.9l-28.3 28.3a8 8 0 0011.3 11.3l28.3-28.3a40 40 0 000-56.5z" />
  </svg>
);

export const AliasIcon = ({ size = 15, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M243.3 136.8l-16.1-16a8 8 0 00-11.3 0L136 200.7V216h15.3l80-79.9a8 8 0 000-11.3zM32 64h96a8 8 0 000-16H32a8 8 0 000 16zm0 48h72a8 8 0 000-16H32a8 8 0 000 16zm64 32H32a8 8 0 000 16h64a8 8 0 000-16z" />
  </svg>
);

export const MapIcon = ({ size = 15, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M228.9 49.5a8 8 0 00-6.7-1.4l-61.5 15.4-63.4-25.4a8 8 0 00-5.6 0L28.5 56.1A8 8 0 0023 63.6v144.8a8 8 0 0011 7.4l58.7-22.9 63.4 25.4a8.1 8.1 0 006 0l63.2-18a8 8 0 006.2-7.8V56a8 8 0 00-3.6-6.5zM99.4 54.9l57.2 22.9v122.2l-57.2-22.9zm-60.4 8.9L88 44.6v121.8l-49 19.2zm188 128L184 210.4V88.5l53-15.1z" />
  </svg>
);

export const WikiIcon = ({ size = 15, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M224 48H32a8 8 0 00-8 8v136a16 16 0 0016 16h176a16 16 0 0016-16V56a8 8 0 00-8-8zM40 64h80v128H40zm176 128h-80V64h80z" />
  </svg>
);

export const XIcon = ({ size = 12, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M205.7 194.3a8 8 0 11-11.4 11.4L128 139.3l-66.3 66.4a8 8 0 01-11.4-11.4L116.7 128 50.3 61.7a8 8 0 0111.4-11.4L128 116.7l66.3-66.4a8 8 0 0111.4 11.4L139.3 128z" />
  </svg>
);

export const QuoteIcon = ({ size = 15, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" className={className}>
    <path d="M96 88a48 48 0 00-48 48v40a16 16 0 0016 16h40a16 16 0 0016-16v-32a16 16 0 00-16-16H72a32 32 0 0132-32 8 8 0 000-16zm112 0a48 48 0 00-48 48v40a16 16 0 0016 16h40a16 16 0 0016-16v-32a16 16 0 00-16-16h-32a32 32 0 0132-32 8 8 0 000-16z" />
  </svg>
);
