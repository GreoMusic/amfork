import React from 'react';

export const Button = ({ children, icon: Icon, variant = 'primary', className, ...props }) => (
    <button
        className={`px-6 py-2 rounded-xl shadow apple-hover relative overflow-hidden corner-gradient 
        ${variant === 'primary' ? 'bg-primary hover:bg-primary-variant' : 'bg-primary-variant hover:bg-primary'}
        text-white flex items-center ${className}`}
        {...props}
    >
        {Icon && <Icon className="w-5 h-5 mr-2" />}
        <span className="relative z-10">{children}</span>
    </button>
);