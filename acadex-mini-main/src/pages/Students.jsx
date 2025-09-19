import React, { useState } from 'react';
import MainLayout from './components/MainLayout';

const initialRoster = [
  { id: 1, name: 'Alex Johnson', email: 'alex.j@example.com', studentId: 'S001', status: 'active', lastActive: '2025-09-01' },
  { id: 2, name: 'Maria Garcia', email: 'maria.g@example.com', studentId: 'S002', status: 'inactive', lastActive: '2025-08-28' }
];

export default function Students() {
  const [roster, setRoster] = useState(initialRoster);
  const [editingId, setEditingId] = useState(null);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', studentId: '', status: 'active', lastActive: '' });

  function handleEdit(id, field, value) {
    setRoster(roster.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  function handleAdd() {
    setRoster([...roster, { ...newStudent, id: Date.now() }]);
    setNewStudent({ name: '', email: '', studentId: '', status: 'active', lastActive: '' });
  }

  function handleDelete(id) {
    setRoster(roster.filter(s => s.id !== id));
  }

  return (
    <MainLayout>
      <div data-testid="students-table">
        <h2>Students</h2>
        <table>
          <thead>
            <tr>
              <th></th><th>Name</th><th>Email</th><th>ID</th><th>Status</th><th>Last Active</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roster.map(s => (
              <tr key={s.id}>
                <td><input type="checkbox" data-testid="students-row-check" /></td>
                <td>
                  {editingId === s.id
                    ? <input value={s.name} onChange={e => handleEdit(s.id, 'name', e.target.value)} />
                    : s.name}
                </td>
                <td>
                  {editingId === s.id
                    ? <input value={s.email} onChange={e => handleEdit(s.id, 'email', e.target.value)} />
                    : s.email}
                </td>
                <td>
                  {editingId === s.id
                    ? <input value={s.studentId} onChange={e => handleEdit(s.id, 'studentId', e.target.value)} />
                    : s.studentId}
                </td>
                <td>
                  <select value={s.status} onChange={e => handleEdit(s.id, 'status', e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td>{s.lastActive}</td>
                <td>
                  {editingId === s.id
                    ? <button onClick={() => setEditingId(null)}>Save</button>
                    : <button onClick={() => setEditingId(s.id)}>Edit</button>}
                  <button onClick={() => handleDelete(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
            <tr>
              <td><input type="checkbox" disabled /></td>
              <td><input value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} placeholder="Name" /></td>
              <td><input value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} placeholder="Email" /></td>
              <td><input value={newStudent.studentId} onChange={e => setNewStudent({ ...newStudent, studentId: e.target.value })} placeholder="ID" /></td>
              <td>
                <select value={newStudent.status} onChange={e => setNewStudent({ ...newStudent, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </td>
              <td><input value={newStudent.lastActive} onChange={e => setNewStudent({ ...newStudent, lastActive: e.target.value })} placeholder="Last Active" /></td>
              <td><button onClick={handleAdd}>Add</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}
