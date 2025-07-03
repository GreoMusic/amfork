// LoadingButton.js

import React, { useState } from 'react';

const LoadingButton = ({ onClick, isDisabled = false, isLoading, children, handleOnClick, type = "button", btnClasses = '' }) => {
    const [loading, setLoading] = useState(isLoading);

    const handleClick = async () => {
        setLoading(true);
        await onClick();
        setLoading(false);
    };

    return (
        <button disabled={isDisabled} type={type} className={btnClasses ? btnClasses : `flex ${isDisabled ? 'bg-secondary' : 'bg-primary'} hover:bg-blue-700 text-white dark:text-graydark font-bold py-2 px-4 rounded`} onClick={handleOnClick}>
            {loading ? <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                style={{
                    margin: 'auto',
                    background: 'none',
                    display: 'block',
                    shapeRendering: 'auto',
                }}
                width="31px"
                height="31px"
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid"
            >
                <circle
                    cx="50"
                    cy="50"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="10"
                    r="35"
                    strokeDasharray="164.93361431346415 56.97787143782138"
                >
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        repeatCount="indefinite"
                        dur="1s"
                        values="0 50 50;360 50 50"
                        keyTimes="0;1"
                    ></animateTransform>
                </circle>
            </svg> : null}
            <span className={loading ? `mt-1 ml-1` : ''}>{loading ? 'PROCESSING...' : children}</span>
        </button>
    );
};

export default LoadingButton;
