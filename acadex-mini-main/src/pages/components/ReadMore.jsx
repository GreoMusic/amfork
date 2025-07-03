import React, { useState } from 'react';

const ReadMore = ({ label = '', text, maxLength = 100 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const truncatedText = text?.slice(0, maxLength);

    const toggleReadMore = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className='text-lg'>
            <span className='text-white'>{label}</span> <span className='text-white'>{isExpanded ? text : truncatedText}</span>
            {text?.length > maxLength ? <button
                className="text-white underline focus:outline-none ml-4"
                onClick={toggleReadMore}
            >
                {isExpanded ? ' Read Less' : ' Read More'}
            </button> : null}
        </div>
    );
};

export default ReadMore;
