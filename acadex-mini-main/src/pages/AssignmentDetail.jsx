import React, { useState } from 'react';

const initialSubmissions = [
  { id: 1, title: 'Paper 1', origin: 'student', completed: true, grade: 'A', files: { paperUrl: '#', gradeOutputUrl: '#' }, createdAt: '2025-09-01', gradedAt: '2025-09-02' },
  { id: 2, title: 'Paper 2', origin: 'teacher', completed: false, grade: 'C+', files: { paperUrl: '#', gradeOutputUrl: '#' }, createdAt: '2025-09-01', gradedAt: null },
];

function gradeToColor(grade) {
  if (["A+","A","A-","B+","B","B-"] .includes(grade)) return 'green';
  if (["C+","C","C-","D+"].includes(grade)) return 'yellow';
  return 'red';
}

export default function AssignmentDetail({ assignment }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);

  return (
    <div>
      <div data-testid="assign-avg-grade">Avg Grade: {assignment?.averageGrade}</div>
      <div data-testid="assign-total-uploaded">Total Uploaded: {submissions.length}</div>
      <div data-testid="assign-total-graded">Total Graded: {submissions.filter(s => s.gradedAt).length}</div>
      <button data-testid="btn-grade-all">Grade All</button>
      <button data-testid="btn-grade-checked">Grade Checked</button>
      <button data-testid="btn-download-feedback">Download Feedback</button>
      <div>
        {submissions.length === 0 ? (
          <div>No submissions yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th></th><th>Origin</th><th>Status</th><th>Title</th><th>Grade</th><th>Menu</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(s => (
                <tr key={s.id} data-testid="submission-row">
                  <td><input type="checkbox" data-testid="submission-check" /></td>
                  <td>{s.origin === 'student' && <span data-testid="submission-origin-logo">👤</span>}</td>
                  <td data-testid="submission-completion">{s.completed ? '👍' : '👎'}</td>
                  <td data-testid="submission-title">{s.title}</td>
                  <td data-testid="submission-grade" style={{ color: gradeToColor(s.grade) }}>{s.grade}</td>
                  <td data-testid="submission-menu">
                    <button data-testid="menu-view">View</button>
                    <button data-testid="menu-evaluate">Evaluate</button>
                    <button data-testid="menu-edit">Edit Title</button>
                    <button data-testid="menu-download-paper">Download Paper</button>
                    <button data-testid="menu-download-grade">Download Grade Output</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
