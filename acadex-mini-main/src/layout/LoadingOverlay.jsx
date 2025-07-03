// LoadingOverlay.js

import React from 'react';
// import './LoadingOverlay.css';

const LoadingOverlay = ({ isLoading, title = '' }) => {
    return (
        <div className={`loading-overlay z-50 ${isLoading ? 'visible' : ''}`}>
            <div className="loading-spinner"></div>
            <div className="loading-text">{title.length ? title : 'Loading...'}</div>
        </div>
    );
};

export default LoadingOverlay;
