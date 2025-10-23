import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import type { User } from '../types/index';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    dateOfBirth: '',
    identificationNumber: '',
    role: 'STUDENT',
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.put(`/users/${editingId}`, formData);
      } else {
        await apiClient.post('/users', formData);
      }
      setShowForm(false);
      setFormData({ email: '', name: '', dateOfBirth: '', identificationNumber: '', role: 'STUDENT' });
      setEditingId(null);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error saving user');
    }
  };

  const handleEdit = (user: User) => {
    setFormData({
      email: user.email,
      name: user.name,
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      identificationNumber: user.identificationNumber || '',
      role: user.role,
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiClient.delete(`/users/${id}`);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error deleting user');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>User Management</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ email: '', name: '', dateOfBirth: '', identificationNumber: '', role: 'STUDENT' });
          }}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h2>{editingId ? 'Edit User' : 'Add New User'}</h2>
          {!editingId && (
            <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
              New users will receive the default password: <strong>Ulacit123</strong> and must change it on first login.
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Full Name: *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Email: *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Date of Birth: *</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Identification Number: *</label>
              <input
                type="text"
                value={formData.identificationNumber}
                onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })}
                required
                placeholder="e.g., 1-2345-6789"
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Role: *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="STUDENT">Student</option>
                <option value="ADMINISTRATIVE_STAFF">Administrative Staff</option>
                <option value="SECURITY_OFFICER">Security Officer</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
          </div>
          <button type="submit" style={{ marginTop: '15px', padding: '10px 20px', fontSize: '16px' }}>
            {editingId ? 'Update' : 'Create'}
          </button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Name</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>ID Number</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Role</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>First Login</th>
            <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.email}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{user.identificationNumber}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {user.role.replace(/_/g, ' ')}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {user.isFirstLogin ? (
                  <span style={{ color: 'orange' }}>Pending</span>
                ) : (
                  <span style={{ color: 'green' }}>Changed</span>
                )}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                <button onClick={() => handleEdit(user)} style={{ marginRight: '10px', padding: '5px 10px' }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(user.id)} style={{ padding: '5px 10px', backgroundColor: '#d32f2f', color: 'white' }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
