import React from 'react';

export const GramGptLogo: React.FC = () => (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="url(#paint0_linear_1_2)"/>
        <defs>
            <linearGradient id="paint0_linear_1_2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10B981"/>
                <stop offset="1" stopColor="#34D399"/>
            </linearGradient>
        </defs>
    </svg>
);

export const HistoryIcon: React.FC = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" fill="#64748b"/>
        <path d="M12 7c-.552 0-1 .447-1 1v4c0 .266.105.52.293.707l3 3c.391.391 1.023.391 1.414 0s.391-1.023 0-1.414L12.414 11.586 13 11V8c0-.553-.448-1-1-1z" fill="#64748b"/>
    </svg>
);


export const ImageIcon: React.FC = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19Z" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 15L16 10L5 21" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
