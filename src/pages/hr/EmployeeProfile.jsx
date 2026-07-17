import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStore, setStore, STORAGE_KEYS, addLog } from '../../utils/store';
import { formatDate } from '../../utils/helpers';
import Avatar from '../../components/shared/Avatar';
import StatusBadge from '../../components/shared/StatusBadge';
import { Pencil, Camera, X, UserPlus } from 'lucide-react';
import { canAccessAllDocuments, getVisibleDocuments } from '../../utils/documents';
import DocumentTable from '../../components/shared/DocumentTable';
import { canManageAssets, getEmployeeAssets, getAllAssets } from '../../utils/assets';
import AssetTable from '../../components/shared/AssetTable';
import AssetEmployeeTable from '../../components/shared/AssetEmployeeTable';
import AssetAssignModal from '../../components/shared/AssetAssignModal';
import AssetReturnModal from '../../components/shared/AssetReturnModal';
import AssetHistoryModal from '../../components/shared/AssetHistoryModal';

const DEPARTMENTS = ['Human Resources', 'Engineering', 'Marketing', 'Sales', 'Finance', 'Operations', 'Design', 'Product'];
const DESIGNATIONS = ['Software Engineer', 'Senior Engineer', 'Team Lead', 'Manager', 'Director', 'Analyst', 'Designer', 'HR Executive', 'Intern'];

export default function EmployeeProfile({ editMode: editModeProp = false }) {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const isHR = user?.role === 'hr';
  const canViewAllDocs = canAccessAllDocuments(user);
  const fileRef = useRef();

  const employees = getStore(STORAGE_KEYS.EMPLOYEES);
  const targetId = id || user?.id;
  const [emp, setEmp] = useState(() => employees.find(e => e.id === targetId) || {});
  const [editing, setEditing] = useState(editModeProp);
  const [form, setForm] = useState(emp);
  const [saved, setSaved] = useState(false);
  const [assignAssetTarget, setAssignAssetTarget] = useState(null);
  const [returnAssetTarget, setReturnAssetTarget] = useState(null);
  const [historyAssetTarget, setHistoryAssetTarget] = useState(null);
  const [profileAssignOpen, setProfileAssignOpen] = useState(false);
  const [, forceAssetUpdate] = useState(0);

  if (!emp.id) return <div className="card text-center py-10 text-gray-400">Employee not found.</div>;

  const canEdit = isHR || user?.id === emp.id;
  const canViewDocuments = canViewAllDocs || user?.id === emp.id;
  const documents = canViewDocuments ? getVisibleDocuments(user, emp.id) : [];
  const canViewAssets = isHR || user?.id === emp.id;
  const canManageEmpAssets = canManageAssets(user);
  const employeeAssets = canViewAssets ? getEmployeeAssets(emp.id) : [];
  const allEmployees = getStore(STORAGE_KEYS.EMPLOYEES);

  function handleSave() {
    const all = getStore(STORAGE_KEYS.EMPLOYEES);
    const updated = all.map(e => e.id === emp.id ? { ...form, profileCompleted: true } : e);
    setStore(STORAGE_KEYS.EMPLOYEES, updated);
    addLog('Profile Update', emp.id, `${emp.firstName} ${emp.lastName} profile updated`);
    setEmp({ ...form, profileCompleted: true });
    if (user?.id === emp.id) refreshUser();
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, profilePicture: ev.target.result }));
    reader.readAsDataURL(file);
  }

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const setEC = (field, val) => setForm(f => ({ ...f, emergencyContact: { ...f.emergencyContact, [field]: val } }));

  const Field = ({ label, value, field, type = 'text', options }) => (
    <div>
      <label className="label">{label}</label>
      {editing ? (
        options ? (
          <select className="input" value={form[field] || ''} onChange={e => set(field, e.target.value)}>
            <option value="">Select</option>
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} className="input" value={form[field] || ''} onChange={e => set(field, e.target.value)} />
        )
      ) : (
        <p className="text-sm text-gray-800 py-2">{value || '—'}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {isHR && (
        <button className="text-gray-400 hover:text-gray-600 text-sm" onClick={() => navigate('/employees')}>← Back to Employees</button>
      )}

      {saved && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">Profile saved successfully!</div>}

      {/* Header Card */}
      <div className="card flex items-start gap-6">
        <div className="relative">
          <Avatar employee={editing ? form : emp} size="xl" />
          {editing && (
            <>
              <button onClick={() => fileRef.current.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white shadow">
                <Camera size={13} />
              </button>
              {form.profilePicture && (
                <button onClick={() => setForm(f => ({ ...f, profilePicture: null }))}
                  className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white">
                  <X size={10} />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{emp.firstName} {emp.middleName} {emp.lastName}</h1>
          <p className="text-gray-500 text-sm">{emp.designation} · {emp.department}</p>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={emp.status} />
            <span className="text-xs text-gray-400">{emp.id}</span>
            <span className="text-xs text-gray-400 capitalize">{emp.employmentType}</span>
          </div>
        </div>
        {canEdit && !editing && (
          <button className="btn-secondary btn btn-sm" onClick={() => { setForm(emp); setEditing(true); }}>
            <Pencil size={13} /> Edit Profile
          </button>
        )}
      </div>

      {/* Personal Information */}
      <div className="card space-y-4">
        <h2 className="section-title">Personal Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="First Name" value={emp.firstName} field="firstName" />
          <Field label="Middle Name" value={emp.middleName} field="middleName" />
          <Field label="Last Name" value={emp.lastName} field="lastName" />
          <Field label="Gender" value={emp.gender} field="gender" options={['Male', 'Female', 'Other', 'Prefer not to say']} />
          <Field label="Date of Birth" value={formatDate(emp.dob)} field="dob" type="date" />
          <Field label="Blood Group" value={emp.bloodGroup} field="bloodGroup" options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} />
          <Field label="Marital Status" value={emp.maritalStatus} field="maritalStatus" options={['Single', 'Married', 'Divorced', 'Widowed']} />
          <Field label="Nationality" value={emp.nationality} field="nationality" />
        </div>
      </div>

      {/* Employment Information */}
      <div className="card space-y-4">
        <h2 className="section-title">Employment Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><label className="label">Employee ID</label><p className="text-sm text-gray-800 py-2">{emp.id}</p></div>
          {isHR ? (
            <>
              <Field label="Department" value={emp.department} field="department" options={DEPARTMENTS} />
              <Field label="Designation" value={emp.designation} field="designation" options={DESIGNATIONS} />
              <Field label="Employment Type" value={emp.employmentType} field="employmentType" options={['Full Time', 'Part Time', 'Contract', 'Intern']} />
              <Field label="Role" value={emp.role} field="role" options={['employee', 'management', 'hr']} />
              <Field label="Status" value={emp.status} field="status" options={['active', 'inactive']} />
            </>
          ) : (
            <>
              <div><label className="label">Department</label><p className="text-sm text-gray-800 py-2">{emp.department || '—'}</p></div>
              <div><label className="label">Designation</label><p className="text-sm text-gray-800 py-2">{emp.designation || '—'}</p></div>
              <div><label className="label">Employment Type</label><p className="text-sm text-gray-800 py-2">{emp.employmentType || '—'}</p></div>
              <div><label className="label">Role</label><p className="text-sm text-gray-800 py-2 capitalize">{emp.role || '—'}</p></div>
            </>
          )}
          <div><label className="label">Joining Date</label><p className="text-sm text-gray-800 py-2">{formatDate(emp.joiningDate)}</p></div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="card space-y-4">
        <h2 className="section-title">Contact Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Mobile Number" value={emp.mobile} field="mobile" />
          <Field label="Alternate Mobile" value={emp.alternateMobile} field="alternateMobile" />
          <Field label="Official Email" value={emp.email} field="email" type="email" />
          <Field label="Personal Email" value={emp.personalEmail} field="personalEmail" type="email" />
          <div className="col-span-2 md:col-span-3">
            <Field label="Current Address" value={emp.currentAddress} field="currentAddress" />
          </div>
          <div className="col-span-2 md:col-span-3">
            <Field label="Permanent Address" value={emp.permanentAddress} field="permanentAddress" />
          </div>
          <Field label="City" value={emp.city} field="city" />
          <Field label="State" value={emp.state} field="state" />
          <Field label="Country" value={emp.country} field="country" />
          <Field label="Postal Code" value={emp.postalCode} field="postalCode" />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="card space-y-4">
        <h2 className="section-title">Emergency Contact</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[['Contact Person Name', 'name'], ['Relationship', 'relationship'], ['Mobile Number', 'mobile'], ['Address', 'address']].map(([label, field]) => (
            <div key={field}>
              <label className="label">{label}</label>
              {editing ? (
                <input className="input" value={form.emergencyContact?.[field] || ''} onChange={e => setEC(field, e.target.value)} />
              ) : (
                <p className="text-sm text-gray-800 py-2">{emp.emergencyContact?.[field] || '—'}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {canViewDocuments && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="section-title mb-0">Documents</h2>
              <p className="text-xs text-gray-400 mt-1">{documents.length} document(s) linked to this profile</p>
            </div>
          </div>
          <DocumentTable documents={documents} />
        </div>
      )}

      {canViewAssets && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="section-title mb-0">Assets</h2>
              <p className="text-xs text-gray-400 mt-1">{employeeAssets.length} asset(s) assigned to this employee</p>
            </div>
            {canManageEmpAssets && (
              <button className="btn-primary btn btn-sm" onClick={() => setProfileAssignOpen(true)}>
                <UserPlus size={13} /> Assign Asset
              </button>
            )}
          </div>
          {canManageEmpAssets ? (
            <AssetTable
              assets={employeeAssets}
              canManage
              onEdit={() => {}}
              onAssign={setAssignAssetTarget}
              onReturn={setReturnAssetTarget}
              onHistory={setHistoryAssetTarget}
            />
          ) : (
            <AssetEmployeeTable assets={employeeAssets} />
          )}
        </div>
      )}

      {profileAssignOpen && (
        <AssetAssignModal
          asset={{ id: '', name: 'Select below' }}
          employees={allEmployees}
          currentUser={user}
          onClose={() => setProfileAssignOpen(false)}
          onSaved={() => { setProfileAssignOpen(false); forceAssetUpdate(n => n + 1); }}
          preselectedEmployeeId={emp.id}
        />
      )}

      {assignAssetTarget && (
        <AssetAssignModal
          asset={assignAssetTarget}
          employees={allEmployees}
          currentUser={user}
          onClose={() => setAssignAssetTarget(null)}
          onSaved={() => { setAssignAssetTarget(null); forceAssetUpdate(n => n + 1); }}
        />
      )}

      {returnAssetTarget && (
        <AssetReturnModal
          asset={returnAssetTarget}
          currentUser={user}
          onClose={() => setReturnAssetTarget(null)}
          onSaved={() => { setReturnAssetTarget(null); forceAssetUpdate(n => n + 1); }}
        />
      )}

      {historyAssetTarget && (
        <AssetHistoryModal
          asset={historyAssetTarget}
          onClose={() => setHistoryAssetTarget(null)}
        />
      )}

      {editing && (
        <div className="flex justify-end gap-3">
          <button className="btn-secondary btn" onClick={() => { setEditing(false); setForm(emp); }}>Cancel</button>
          <button className="btn-primary btn" onClick={handleSave}>Save Changes</button>
        </div>
      )}
    </div>
  );
}
