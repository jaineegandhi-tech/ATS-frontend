import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStore, setStore, STORAGE_KEYS, generateEmpId, addLog } from '../../utils/store';

const DEPARTMENTS = ['Human Resources', 'Engineering', 'Marketing', 'Sales', 'Finance', 'Operations', 'Design', 'Product'];
const DESIGNATIONS = ['Software Engineer', 'Senior Engineer', 'Team Lead', 'Manager', 'Director', 'Analyst', 'Designer', 'HR Executive', 'Intern'];

const INIT = {
  firstName: '', lastName: '', username: '', email: '',
  department: '', designation: '', joiningDate: '', employmentType: 'Full Time', role: 'employee', status: 'active',
};

export default function AddEmployee() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  function validate() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.username.trim()) e.username = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    if (!form.department) e.department = 'Required';
    if (!form.designation) e.designation = 'Required';
    if (!form.joiningDate) e.joiningDate = 'Required';
    const employees = getStore(STORAGE_KEYS.EMPLOYEES);
    if (employees.find(e => e.username === form.username)) e.username = 'Username already taken';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    const employees = getStore(STORAGE_KEYS.EMPLOYEES);
    const newEmp = {
      ...INIT,
      ...form,
      id: generateEmpId(),
      password: 'password123',
      profileCompleted: false,
      profilePicture: null,
      middleName: '', gender: '', dob: '', bloodGroup: '', maritalStatus: '', nationality: '',
      mobile: '', alternateMobile: '', personalEmail: '', currentAddress: '', permanentAddress: '',
      city: '', state: '', country: '', postalCode: '', reportingManager: '',
      emergencyContact: { name: '', relationship: '', mobile: '', address: '' },
    };
    setStore(STORAGE_KEYS.EMPLOYEES, [...employees, newEmp]);
    addLog('Employee Created', newEmp.id, `${newEmp.firstName} ${newEmp.lastName} created by HR`);
    setSuccess(true);
  }

  const set = (field, val) => { setForm(f => ({ ...f, [field]: val })); setErrors(e => ({ ...e, [field]: '' })); };
  const err = (field) => errors[field] ? <p className="text-xs text-red-500 mt-1">{errors[field]}</p> : null;

  if (success) return (
    <div className="max-w-lg mx-auto">
      <div className="card text-center py-10">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Employee Created Successfully!</h2>
        <p className="text-sm text-gray-500 mb-6">
          {form.firstName} {form.lastName} has been added. They can login with username <strong>{form.username}</strong> and password <strong>password123</strong>.
        </p>
        <div className="flex justify-center gap-3">
          <button className="btn-secondary btn" onClick={() => navigate('/employees')}>Back to Employees</button>
          <button className="btn-primary btn" onClick={() => { setForm(INIT); setSuccess(false); }}>Add Another</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button className="text-gray-400 hover:text-gray-600 text-sm" onClick={() => navigate('/employees')}>← Back</button>
        <h1 className="page-title">Add Employee</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card space-y-4">
          <h2 className="section-title">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">First Name *</label><input className="input" value={form.firstName} onChange={e => set('firstName', e.target.value)} />{err('firstName')}</div>
            <div><label className="label">Last Name *</label><input className="input" value={form.lastName} onChange={e => set('lastName', e.target.value)} />{err('lastName')}</div>
            <div><label className="label">Username *</label><input className="input" value={form.username} onChange={e => set('username', e.target.value)} />{err('username')}</div>
            <div><label className="label">Email Address *</label><input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} />{err('email')}</div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="section-title">Employment Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Department *</label>
              <select className="input" value={form.department} onChange={e => set('department', e.target.value)}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
              {err('department')}
            </div>
            <div>
              <label className="label">Designation *</label>
              <select className="input" value={form.designation} onChange={e => set('designation', e.target.value)}>
                <option value="">Select Designation</option>
                {DESIGNATIONS.map(d => <option key={d}>{d}</option>)}
              </select>
              {err('designation')}
            </div>
            <div><label className="label">Joining Date *</label><input type="date" className="input" value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} />{err('joiningDate')}</div>
            <div>
              <label className="label">Employment Type</label>
              <select className="input" value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
                {['Full Time', 'Part Time', 'Contract', 'Intern'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="employee">Employee</option>
                <option value="management">Management</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary btn" onClick={() => navigate('/employees')}>Cancel</button>
          <button type="submit" className="btn-primary btn">Create Employee</button>
        </div>
      </form>
    </div>
  );
}
