import React, { useState, useRef, useEffect } from 'react';

export const GraphModal = ({ isOpen, onClose, type }) => {
    const [chartType, setChartType] = useState('line');
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;

        // Chart initialization logic here
        // Use chart.js with canvasRef.current.getContext('2d')

        return () => {
            // Cleanup chart
        };
    }, [isOpen, chartType, type]);

    return (
        <div className={`fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center ${!isOpen ? 'hidden' : ''}`}>
            <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md relative mx-4">
                {/* Modal content */}
            </div>
        </div>
    );
};