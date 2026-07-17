import { useId, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';

function displayName(employee) {
  return `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
}

export default function InterviewerPicker({ employees, selectedIds, onChange, label = 'Assign Interviewer(s)' }) {
  const datalistId = useId();
  const [dropdownValue, setDropdownValue] = useState('');
  const [lookup, setLookup] = useState('');
  const [error, setError] = useState('');

  const activeEmployees = useMemo(() => employees
    .filter(employee => employee.status !== 'inactive' && employee.role === 'interviewer')
    .sort((a, b) => displayName(a).localeCompare(displayName(b))), [employees]);

  const selected = activeEmployees.filter(employee => selectedIds.includes(employee.id));
  const available = activeEmployees.filter(employee => !selectedIds.includes(employee.id));

  function addInterviewer(employeeId) {
    if (!employeeId || selectedIds.includes(employeeId)) return;
    onChange([...selectedIds, employeeId]);
    setDropdownValue('');
    setLookup('');
    setError('');
  }

  function removeInterviewer(employeeId) {
    onChange(selectedIds.filter(id => id !== employeeId));
  }

  function addRegisteredEmployee() {
    const query = lookup.trim().toLowerCase();
    if (!query) return setError('Enter a registered employee name, email, username, or employee ID.');

    const match = activeEmployees.find(employee => {
      const name = displayName(employee).toLowerCase();
      return (
        employee.id?.toLowerCase() === query ||
        employee.email?.toLowerCase() === query ||
        employee.username?.toLowerCase() === query ||
        name === query
      );
    });

    if (!match) return setError('No registered employee found with that detail.');
    if (selectedIds.includes(match.id)) return setError(`${displayName(match)} is already assigned.`);
    addInterviewer(match.id);
  }

  return (
    <div className="col-span-2 space-y-3">
      <label className="label">{label}</label>

      <select className="input" value={dropdownValue} onChange={e => addInterviewer(e.target.value)}>
        <option value="">Select interviewer from registered employees</option>
        {available.map(employee => (
          <option key={employee.id} value={employee.id}>
            {displayName(employee)} - {employee.department || employee.designation || employee.role} ({employee.id})
          </option>
        ))}
      </select>

      <div className="flex flex-wrap gap-2">
        {selected.length === 0 ? (
          <span className="text-xs text-gray-400">No interviewers assigned yet.</span>
        ) : selected.map(employee => (
          <span key={employee.id} className="badge-blue">
            {displayName(employee)}
            <button type="button" className="ml-1 text-blue-500 hover:text-blue-700" onClick={() => removeInterviewer(employee.id)}>
              <X size={11} />
            </button>
          </span>
        ))}
      </div>

      <div>
        <div className="flex gap-2">
          <input
            className="input input-sm"
            list={datalistId}
            value={lookup}
            onChange={e => { setLookup(e.target.value); setError(''); }}
            placeholder="Not in dropdown? Enter registered employee name, email, username, or ID"
          />
          <button type="button" className="btn-secondary btn btn-sm" onClick={addRegisteredEmployee}>
            <Plus size={13} /> Add
          </button>
        </div>
        <datalist id={datalistId}>
          {available.map(employee => (
            <option key={employee.id} value={displayName(employee)} />
          ))}
        </datalist>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  );
}
