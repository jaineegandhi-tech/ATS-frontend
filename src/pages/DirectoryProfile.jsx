import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, addLog } from '../utils/store';
import { formatDate } from '../utils/helpers';
import Avatar from '../components/shared/Avatar';
import { Mail, Phone, MapPin, Briefcase, Calendar } from 'lucide-react';
import { useEffect } from 'react';

export default function DirectoryProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  const emp = employees.find(e => e.id === id);

  useEffect(() => {
    if (emp && user?.id !== emp.id) {
      const views = getStore(STORAGE_KEYS.PROFILE_VIEWS);
      views.unshift({ id: Date.now(), viewerId: user.id, viewerName: `${user.firstName} ${user.lastName}`, viewedId: emp.id, viewedName: `${emp.firstName} ${emp.lastName}`, department: emp.department, timestamp: new Date().toISOString() });
      setStore(STORAGE_KEYS.PROFILE_VIEWS, views);
      addLog('Profile View', user.id, `${user.firstName} viewed ${emp.firstName} ${emp.lastName}'s profile`);
    }
  }, []);

  if (!emp) return <div className="card text-center py-10 text-gray-400">Employee not found.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button className="text-gray-400 hover:text-gray-600 text-sm" onClick={() => navigate('/directory')}>← Back to Directory</button>

      <div className="card flex flex-col items-center text-center gap-4 py-8">
        <Avatar employee={emp} size="xl" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{emp.firstName} {emp.middleName} {emp.lastName}</h1>
          <p className="text-gray-500">{emp.designation}</p>
          <p className="text-primary font-medium">{emp.department}</p>
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="section-title">Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Briefcase, label: 'Employment Type', value: emp.employmentType },
            { icon: Calendar, label: 'Joining Date', value: formatDate(emp.joiningDate) },
            { icon: Mail, label: 'Official Email', value: emp.email },
            { icon: Phone, label: 'Contact', value: emp.mobile },
            { icon: MapPin, label: 'Location', value: [emp.city, emp.state, emp.country].filter(Boolean).join(', ') },
          ].map(({ icon: Icon, label, value }) => value ? (
            <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Icon size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            </div>
          ) : null)}
        </div>
      </div>
    </div>
  );
}
