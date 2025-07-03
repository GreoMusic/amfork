import React from 'react';

export const StatCard = ({ title, value, delay, onClick }) => (
    <div
        className={`bg-white p-4 rounded-2xl shadow-md text-center fade-in-up relative overflow-hidden corner-gradient ${onClick ? 'apple-hover cursor-pointer' : ''}`}
        style={{ animationDelay: `${delay}s` }}
        onClick={onClick}
    >
        <h2 className="text-xl font-medium text-black">{title}</h2>
        <p className="text-3xl font-bold mt-2 text-black">{value}</p>
    </div>
);