import React from 'react';

export const PaperFilter = ({ statusFilter, handleStatusFilterChange, gradeRangeFilter, handleGradeRangeFilterChange, commentsFilter, handleCommentsFilterChange, allGrades }) => {
    return (
        <div className="mb-4 fade-in-up" style={{ animationDelay: '0.6s' }}>
            <label className="block text-lg font-medium text-black">Filters:</label>
            <div className="flex flex-wrap justify-between gap-4 mt-1">
                <select value={statusFilter} onChange={handleStatusFilterChange} className="block dark:bg-violet-800 dark:text-white w-full md:w-[32%] p-2 border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option value="">All Statuses</option>
                    <option value="Graded">Graded</option>
                    <option value="Ungraded">Ungraded</option>
                    <option value="In-progress">In-progress</option>
                </select>
                <select value={gradeRangeFilter} onChange={handleGradeRangeFilterChange} className="block dark:bg-violet-800 dark:text-white w-full md:w-[32%] p-2 border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Any Grade Ranges</option>
                    {allGrades.map(item => <option value={item} key={item}>{item}</option>)}
                </select>
                <select value={commentsFilter} onChange={handleCommentsFilterChange} className="block dark:bg-violet-800 dark:text-white w-full md:w-[33%] p-2 border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option value="">With/Without Comments</option>
                    <option value="With Comments">With Comments</option>
                    <option value="Without Comments">Without Comments</option>
                </select>
            </div>
        </div>
    );
};