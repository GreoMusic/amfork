import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

import { SubmissionCard } from './SubmissionCard';

export const SubmissionSection = ({ title, date, submissions, type, group, onEvaluate, onCheckboxChange, refetchFiles, openResponse }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [openDropdownId, setOpenDropdownId] = useState(null);

    const handleDropdownToggle = (submissionId) => {
        setOpenDropdownId(openDropdownId === submissionId ? null : submissionId);
    };

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-left text-2xl font-semibold mb-2 flex justify-between items-center"
            >
                <div className="flex items-center gap-2 text-black">
                    {title}
                    {isOpen ? <FiChevronUp className="w-6 h-6" /> : <FiChevronDown className="w-6 h-6" />}
                </div>
                <span className="text-sm text-gray-500 font-normal">{date}</span>
            </button>
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${!isOpen ? 'hidden' : ''}`}>
                {submissions?.map((sub, index) => (
                    <SubmissionCard
                        refetchFiles={refetchFiles}
                        key={sub.id}
                        submission={sub}
                        index={index}
                        group={group}
                        evaluatePaper={onEvaluate}
                        onCheckboxChange={onCheckboxChange}
                        isDropdownOpen={openDropdownId === sub.id}
                        onDropdownToggle={() => handleDropdownToggle(sub.id)}
                        openResponse={openResponse}
                    />
                ))}
            </div>
        </div>
    );
};