import React, { useState } from 'react';
import AssignmentDetail from './AssignmentDetail';

const initialAssignments = [
  { id: 1, title: 'Essay 1', completion: { completed: 18, total: 20 }, averageGrade: 'B+', },
  { id: 2, title: 'Project 2', completion: { completed: 20, total: 20 }, averageGrade: 'A', },
];

export default function ClassDetail({ classObj }) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  return (
    <div>
      <h2 data-testid="class-year-range">{classObj?.name} ({classObj?.yearStart}–{classObj?.yearEnd})</h2>
      <button data-testid="add-assignment">Create Assignment</button>
      <div>
        {selectedAssignment ? (
          <AssignmentDetail assignment={selectedAssignment} />
        ) : assignments.length === 0 ? (
          <div>No assignments yet. Create one.</div>
        ) : (
          <div>
            {assignments.map(a => (
              <div key={a.id} data-testid="assignment-card" onClick={() => setSelectedAssignment(a)}>
                <div data-testid="assignment-title">{a.title}</div>
                <div data-testid="assignment-completion-rate">{a.completion.completed}/{a.completion.total}</div>
                <div data-testid="assignment-avg-grade">{a.averageGrade}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
