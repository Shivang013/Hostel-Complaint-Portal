const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const StatusBadge = ({ status }) => {
  return <span className={`status-badge status-${status}`}>{STATUS_LABELS[status] || status}</span>;
};

export default StatusBadge;
