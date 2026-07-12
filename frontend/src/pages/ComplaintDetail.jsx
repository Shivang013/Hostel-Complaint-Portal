import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const ComplaintDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState('');
  const [wardens, setWardens] = useState([]);
  const [selectedWarden, setSelectedWarden] = useState('');
  const [note, setNote] = useState('');

  const isAdmin = user?.role === 'admin';
  const isWarden = user?.role === 'warden';
  const isStaff = isAdmin || isWarden;

  const fetchComplaint = async () => {
    try {
      const { data } = await api.get(`/complaints/${id}`);
      setComplaint(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaint');
    }
  };

  const fetchWardens = async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get('/users/wardens');
      setWardens(data);
    } catch (err) {
      console.error('Failed to fetch wardens', err);
    }
  };

  useEffect(() => {
    fetchComplaint();
    fetchWardens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const { data } = await api.patch(`/complaints/${id}/status`, { status: newStatus, note });
      setComplaint(data);
      setNote('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAssign = async () => {
    if (!selectedWarden) return;
    try {
      const { data } = await api.patch(`/complaints/${id}/assign`, { wardenId: selectedWarden });
      setComplaint((prev) => ({ ...prev, assignedTo: data.assignedTo }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign complaint');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this complaint?')) return;
    try {
      await api.delete(`/complaints/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete complaint');
    }
  };

  if (error) return <div className="page-container"><p className="error-text">{error}</p></div>;
  if (!complaint) return <div className="page-container"><p>Loading...</p></div>;

  return (
    <div className="page-container">
      <div className="complaint-detail-header">
        <h2>{complaint.title}</h2>
        <StatusBadge status={complaint.status} />
      </div>
      <p className="mono" style={{ color: 'var(--muted)', fontSize: '12.5px', marginTop: '6px' }}>
        TICKET #{complaint._id.slice(-6).toUpperCase()}
      </p>

      <p><strong>Category:</strong> {complaint.category}</p>
      <p><strong>Priority:</strong> {complaint.priority}</p>
      <p><strong>Filed by:</strong> {complaint.filedBy?.name} ({complaint.filedBy?.email})</p>
      <p>
        <strong>Assigned to:</strong>{' '}
        {complaint.assignedTo ? complaint.assignedTo.name : 'Not yet assigned'}
      </p>
      {complaint.resolutionNote && (
        <p><strong>Resolution note:</strong> {complaint.resolutionNote}</p>
      )}
      <p className="complaint-description">{complaint.description}</p>

      {complaint.image && (
        <img
          src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${complaint.image}`}
          alt="Complaint attachment"
          className="complaint-image"
        />
      )}

      {/* Admin-only: assign this complaint to a warden. Once assigned, only that warden can see or act on it. */}
      {isAdmin && (
        <div className="assign-section">
          <h4>Assign to Warden</h4>
          <select value={selectedWarden} onChange={(e) => setSelectedWarden(e.target.value)}>
            <option value="">Select a warden...</option>
            {wardens.map((w) => (
              <option key={w._id} value={w._id}>{w.name} ({w.email})</option>
            ))}
          </select>
          <button onClick={handleAssign} disabled={!selectedWarden} className="assign-btn">
            Assign
          </button>
        </div>
      )}

      {/* Warden: only reachable at all if this complaint was assigned to them (backend enforces this on GET /:id). */}
      {isStaff && (
        <div className="status-actions">
          <h4>Update Status</h4>
          <textarea
            placeholder="Optional resolution remarks..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="note-input"
          />
          {['pending', 'in_progress', 'resolved', 'closed'].map((s) => (
            <button
              key={s}
              disabled={complaint.status === s}
              onClick={() => handleStatusChange(s)}
              className="status-btn"
            >
              Mark as {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {(user.role === 'admin' || (complaint.filedBy._id === user.id && complaint.status === 'pending')) && (
        <button onClick={handleDelete} className="delete-btn">Delete Complaint</button>
      )}

      <div className="status-history">
        <h4>Status History</h4>
        <ul>
          {complaint.statusHistory.map((h, idx) => (
            <li key={idx}>
              {h.status.replace('_', ' ')} — {new Date(h.changedAt).toLocaleString()}
              {h.note ? ` — "${h.note}"` : ''}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ComplaintDetail;
