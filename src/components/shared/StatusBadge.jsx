export default function StatusBadge({ status }) {
  const map = {
    active:                 'badge-green',
    inactive:               'badge-red',
    approved:               'badge-green',
    rejected:               'badge-red',
    pending:                'badge-yellow',
    cancelled:              'badge-gray',
    present:                'badge-green',
    absent:                 'badge-red',
    late:                   'badge-yellow',
    'half-day':             'badge-blue',
    working:                'badge-green',
    'on break':             'badge-yellow',
    'checked out':          'badge-gray',
    // Recruitment
    'new candidate':        'badge-blue',
    'interview scheduled':  'badge-purple',
    'interview completed':  'badge-blue',
    passed:                 'badge-green',
    failed:                 'badge-red',
    'on hold':              'badge-yellow',
    selected:               'badge-green',
    offered:                'badge-blue',
    'next round scheduled': 'badge-purple',
    'offer sent':           'badge-blue',
    'offer accepted':       'badge-green',
    'offer declined':       'badge-red',
    joined:                 'badge-green',
    archived:               'badge-gray',
    scheduled:              'badge-blue',
    completed:              'badge-gray',
    // Assets
    available:              'badge-green',
    assigned:               'badge-blue',
    returned:               'badge-gray',
    'under maintenance':    'badge-yellow',
    lost:                   'badge-red',
    damaged:                'badge-red',
  };
  const dot = {
    'badge-green':  'bg-emerald-500',
    'badge-red':    'bg-red-500',
    'badge-yellow': 'bg-amber-500',
    'badge-blue':   'bg-blue-500',
    'badge-purple': 'bg-violet-500',
    'badge-gray':   'bg-gray-400',
  };
  const cls = map[status?.toLowerCase()] || 'badge-gray';
  return (
    <span className={`badge ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[cls]}`} />
      {status}
    </span>
  );
}
