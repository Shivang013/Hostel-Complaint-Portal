import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const ComplaintCard = ({ complaint }) => {
  return (
    <Link to={`/complaints/${complaint._id}`} className="complaint-card">
      <div className="complaint-card-header">
        <h3>{complaint.title}</h3>
        <StatusBadge status={complaint.status} />
      </div>
      <p className="complaint-card-meta">
        #{complaint._id.slice(-6).toUpperCase()} · {complaint.category} · priority: {complaint.priority}
      </p>
      <p className="complaint-card-desc">{complaint.description.slice(0, 100)}{complaint.description.length > 100 ? '...' : ''}</p>
      {complaint.filedBy?.name && (
        <p className="complaint-card-footer">Filed by {complaint.filedBy.name}</p>
      )}
    </Link>
  );
};

export default ComplaintCard;
