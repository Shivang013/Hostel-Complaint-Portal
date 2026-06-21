import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ComplaintCard from '../components/ComplaintCard';

const Dashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '' });
  const [loading, setLoading] = useState(true);

  const isStaff = user?.role === 'admin' || user?.role === 'warden';

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const { data } = await api.get('/complaints', { params });
      setComplaints(data);
    } catch (err) {
      console.error('Failed to fetch complaints', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!isStaff) return;
    try {
      const { data } = await api.get('/complaints/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <div className="page-container">
      <h2>{isStaff ? 'All Complaints' : 'My Complaints'}</h2>

      {isStaff && stats && (
        <div className="stats-row">
          <div className="stat-box"><strong>{stats.total}</strong><span>Total</span></div>
          {stats.byStatus.map((s) => (
            <div className="stat-box" key={s.status}>
              <strong>{s.count}</strong>
              <span>{s.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}

      {isStaff && (
        <div className="filters-row">
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All categories</option>
            <option value="electrical">Electrical</option>
            <option value="plumbing">Plumbing</option>
            <option value="wifi">Wifi</option>
            <option value="mess">Mess</option>
            <option value="cleanliness">Cleanliness</option>
            <option value="furniture">Furniture</option>
            <option value="other">Other</option>
          </select>
          <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      )}

      {loading ? (
        <p>Loading complaints...</p>
      ) : complaints.length === 0 ? (
        <p>No complaints found.</p>
      ) : (
        <div className="complaint-grid">
          {complaints.map((c) => (
            <ComplaintCard key={c._id} complaint={c} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
