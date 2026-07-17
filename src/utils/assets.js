import { STORAGE_KEYS, getStore, setStore, addLog } from './store';

export const ASSET_CATEGORIES = [
  'Laptop',
  'Desktop',
  'Mobile Phone',
  'SIM Card',
  'Monitor',
  'Keyboard',
  'Mouse',
  'Headset',
  'ID Card',
  'Access Card',
  'Software License',
  'Other',
];

export const ASSET_STATUSES = [
  'Available',
  'Assigned',
  'Returned',
  'Under Maintenance',
  'Lost',
  'Damaged',
];

export const ASSET_CONDITIONS = ['New', 'Good', 'Fair', 'Poor'];

export function canManageAssets(user) {
  return user?.role === 'hr';
}

export function getAllAssets() {
  return getStore(STORAGE_KEYS.ASSETS);
}

export function getVisibleAssets(user, employeeId = null) {
  const assets = getAllAssets();
  if (canManageAssets(user)) {
    return employeeId
      ? assets.filter(a => a.assignedEmployeeId === employeeId)
      : assets;
  }
  return assets.filter(a => a.assignedEmployeeId === user?.id);
}

export function getEmployeeAssets(employeeId) {
  return getAllAssets().filter(a => a.assignedEmployeeId === employeeId);
}

export function generateAssetId() {
  const assets = getAllAssets();
  const nums = assets.map(a => parseInt(a.id.replace('AST', ''), 10)).filter(Boolean);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `AST${String(next).padStart(3, '0')}`;
}

export function saveAsset({ asset, user, editId = null }) {
  const assets = getAllAssets();
  const now = new Date().toISOString();
  const userName = `${user.firstName} ${user.lastName}`;

  if (editId) {
    const updated = assets.map(a => a.id === editId
      ? {
          ...a,
          name: asset.name,
          category: asset.category,
          brand: asset.brand || '',
          model: asset.model || '',
          serialNumber: asset.serialNumber || '',
          purchaseDate: asset.purchaseDate || '',
          purchaseCost: asset.purchaseCost || 0,
          warrantyExpiry: asset.warrantyExpiry || '',
          condition: asset.condition || 'Good',
          updatedAt: now,
          updatedById: user.id,
          updatedByName: userName,
        }
      : a);
    setStore(STORAGE_KEYS.ASSETS, updated);
    addLog('Asset Updated', user.id, `${userName} updated asset ${asset.name} (${editId})`);
    return editId;
  }

  const id = generateAssetId();
  const newAsset = {
    id,
    name: asset.name,
    category: asset.category,
    brand: asset.brand || '',
    model: asset.model || '',
    serialNumber: asset.serialNumber || '',
    purchaseDate: asset.purchaseDate || '',
    purchaseCost: asset.purchaseCost || 0,
    warrantyExpiry: asset.warrantyExpiry || '',
    condition: asset.condition || 'Good',
    status: 'Available',
    assignedEmployeeId: null,
    assignedEmployeeName: null,
    assignedDate: null,
    expectedReturnDate: null,
    history: [],
    createdAt: now,
    updatedAt: now,
    updatedById: user.id,
    updatedByName: userName,
  };
  setStore(STORAGE_KEYS.ASSETS, [newAsset, ...assets]);
  addLog('Asset Created', user.id, `${userName} created asset ${asset.name} (${id})`);
  return id;
}

export function assignAsset({ assetId, employee, assignedDate, expectedReturnDate, notes, user }) {
  const assets = getAllAssets();
  const asset = assets.find(a => a.id === assetId);
  if (!asset) throw new Error('Asset not found.');
  if (asset.status === 'Assigned') throw new Error('Asset is already assigned.');

  const userName = `${user.firstName} ${user.lastName}`;
  const empName = `${employee.firstName} ${employee.lastName}`;
  const now = new Date().toISOString();

  const historyEntry = {
    id: `HIST${Date.now()}`,
    assignedEmployeeId: employee.id,
    assignedEmployeeName: empName,
    assignedById: user.id,
    assignedByName: userName,
    assignedDate,
    expectedReturnDate: expectedReturnDate || '',
    returnedDate: null,
    conditionOnReturn: null,
    notes: notes || '',
  };

  const updated = assets.map(a => a.id === assetId
    ? {
        ...a,
        status: 'Assigned',
        assignedEmployeeId: employee.id,
        assignedEmployeeName: empName,
        assignedDate,
        expectedReturnDate: expectedReturnDate || '',
        history: [historyEntry, ...(a.history || [])],
        updatedAt: now,
        updatedById: user.id,
        updatedByName: userName,
      }
    : a);
  setStore(STORAGE_KEYS.ASSETS, updated);
  addLog('Asset Assigned', user.id, `${userName} assigned ${asset.name} (${assetId}) to ${empName}`);
}

export function returnAsset({ assetId, returnedDate, conditionOnReturn, user }) {
  const assets = getAllAssets();
  const asset = assets.find(a => a.id === assetId);
  if (!asset) throw new Error('Asset not found.');
  if (asset.status !== 'Assigned') throw new Error('Asset is not currently assigned.');

  const userName = `${user.firstName} ${user.lastName}`;
  const now = new Date().toISOString();

  const updatedHistory = (asset.history || []).map((entry, idx) => {
    if (idx === 0 && !entry.returnedDate) {
      return { ...entry, returnedDate, conditionOnReturn: conditionOnReturn || asset.condition };
    }
    return entry;
  });

  const updated = assets.map(a => a.id === assetId
    ? {
        ...a,
        status: 'Available',
        condition: conditionOnReturn || a.condition,
        assignedEmployeeId: null,
        assignedEmployeeName: null,
        assignedDate: null,
        expectedReturnDate: null,
        history: updatedHistory,
        updatedAt: now,
        updatedById: user.id,
        updatedByName: userName,
      }
    : a);
  setStore(STORAGE_KEYS.ASSETS, updated);
  addLog('Asset Returned', user.id, `${userName} marked ${asset.name} (${assetId}) as returned`);
}

export function updateAssetStatus(assetId, status, user) {
  const assets = getAllAssets();
  const asset = assets.find(a => a.id === assetId);
  if (!asset) return;

  const userName = `${user.firstName} ${user.lastName}`;
  const now = new Date().toISOString();

  const updated = assets.map(a => a.id === assetId
    ? { ...a, status, updatedAt: now, updatedById: user.id, updatedByName: userName }
    : a);
  setStore(STORAGE_KEYS.ASSETS, updated);
  addLog('Asset Status Updated', user.id, `${userName} changed ${asset.name} (${assetId}) status to ${status}`);
}

export function deleteAsset(assetId, user) {
  const assets = getAllAssets();
  const target = assets.find(a => a.id === assetId);
  setStore(STORAGE_KEYS.ASSETS, assets.filter(a => a.id !== assetId));
  if (target && user) {
    addLog('Asset Deleted', user.id, `${user.firstName} ${user.lastName} deleted asset ${target.name} (${assetId})`);
  }
}
