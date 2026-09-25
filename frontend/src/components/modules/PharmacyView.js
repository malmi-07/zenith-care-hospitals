import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Pill, Plus, Search, AlertTriangle, AlertCircle, 
  Package, ShoppingBag, X, Check, ArrowRight, ShieldAlert
} from 'lucide-react';

function PharmacyView({ initialOpenAdd = false }) {
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState({ lowStock: [], expiringSoon: [] });
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(initialOpenAdd);
  const [dispenseMed, setDispenseMed] = useState(null);
  const [dispenseQty, setDispenseQty] = useState(1);
  const [dispensePatientId, setDispensePatientId] = useState('');

  // Add Medicine Form
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: 'Antibiotics',
    dosage: '500mg Tablet',
    stockQuantity: 100,
    unitPrice: 25.00,
    expiryDate: '',
    reorderLevel: 20,
    supplier: 'PharmaDistributors Ltd'
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchInventory = () => {
    setLoading(true);
    api.get('/pharmacy')
      .then(res => setInventory(res.data))
      .catch(err => console.error('fetchInventory error:', err))
      .finally(() => setLoading(false));

    api.get('/pharmacy/alerts')
      .then(res => setAlerts(res.data))
      .catch(err => console.error('fetchAlerts error:', err));
  };

  useEffect(() => {
    fetchInventory();
    api.get('/patients').then(res => {
      setPatients(res.data);
      if (res.data.length > 0) setDispensePatientId(res.data[0].id);
    }).catch(e => console.error(e));

    // Default expiry 1 year ahead
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setFormData(prev => ({ ...prev, expiryDate: nextYear.toISOString().slice(0, 10) }));
  }, []);

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.expiryDate) {
      setError('Medicine name and Expiry Date are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/pharmacy', formData);
      setShowAddModal(false);
      fetchInventory();
    } catch (err) {
      console.error('Add medicine error:', err);
      setError(err.response?.data?.message || 'Error adding drug to inventory');
    } finally {
      setSaving(false);
    }
  };

  const handleDispenseSubmit = async (e) => {
    e.preventDefault();
    if (!dispenseMed || dispenseQty <= 0) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/pharmacy/dispense', {
        medicineId: dispenseMed.id,
        quantity: parseInt(dispenseQty),
        patientId: dispensePatientId ? parseInt(dispensePatientId) : null
      });
      setDispenseMed(null);
      fetchInventory();
    } catch (err) {
      console.error('Dispense error:', err);
      setError(err.response?.data?.message || 'Error dispensing drug');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStock = async (id, change) => {
    try {
      await api.put(`/pharmacy/${id}/stock`, { change });
      fetchInventory();
    } catch (err) {
      console.error('Quick stock error:', err);
    }
  };

  const filteredInventory = inventory.filter(m => {
    const matchesCat = categoryFilter === 'All' || m.category === categoryFilter;
    const matchesSearch = !search || 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.generic_name && m.generic_name.toLowerCase().includes(search.toLowerCase())) ||
      (m.category && m.category.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="animate-fade-in">
      {/* Alert Banners if any low stock or expiring soon */}
      {(alerts.lowStock.length > 0 || alerts.expiringSoon.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {alerts.lowStock.length > 0 && (
            <div className="alert-box alert-danger" style={{ marginBottom: 0 }}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong>Low Stock Alert:</strong> {alerts.lowStock.length} medicines below safe reorder threshold (e.g. {alerts.lowStock[0]?.name}).
              </div>
            </div>
          )}

          {alerts.expiringSoon.length > 0 && (
            <div className="alert-box alert-danger" style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e', marginBottom: 0 }}>
              <AlertTriangle size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong>Expiry Notice:</strong> {alerts.expiringSoon.length} medicines expiring within 90 days (e.g. {alerts.expiringSoon[0]?.name}).
              </div>
            </div>
          )}
        </div>
      )}

      <div className="content-card">
        <div className="card-header">
          <div className="card-title">
            <Pill size={20} color="var(--primary)" />
            <span>Pharmacy Drug Inventory & Dispensing System</span>
            <span className="badge badge-info" style={{ marginLeft: 8 }}>{inventory.length} SKUs</span>
          </div>

          <div className="card-actions">
            <select
              className="form-select"
              style={{ width: 160, padding: '7px 10px', fontSize: '0.84rem' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Antibiotics">Antibiotics</option>
              <option value="Analgesic">Analgesic / Pain</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Respiratory">Respiratory</option>
              <option value="Antidiabetic">Antidiabetic</option>
            </select>

            <div className="search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search brand, generic name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
              <Plus size={15} />
              <span>Add Medicine</span>
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Drug Name / Formulation</th>
                <th>Category</th>
                <th>Available Units</th>
                <th>Unit Price</th>
                <th>Expiry Date</th>
                <th>Supplier</th>
                <th style={{ textAlign: 'right' }}>Dispense & Stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length > 0 ? (
                filteredInventory.map(m => {
                  const isLow = m.stock_quantity <= m.reorder_level;
                  const isExpired = new Date(m.expiry_date) < new Date();
                  return (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{m.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                          Generic: {m.generic_name || 'N/A'} • {m.dosage}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{m.category || 'General'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isLow ? '#dc2626' : 'inherit' }}>
                            {m.stock_quantity}
                          </span>
                          {isLow && (
                            <span className="badge badge-danger" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        Rs. {Number(m.unit_price).toFixed(2)}
                      </td>
                      <td>
                        <div style={{ 
                          fontSize: '0.82rem', 
                          fontWeight: isExpired ? 700 : 500,
                          color: isExpired ? '#dc2626' : 'inherit' 
                        }}>
                          {new Date(m.expiry_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                        {m.supplier || 'Direct'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            onClick={() => {
                              setDispenseMed(m);
                              setDispenseQty(1);
                              setError('');
                            }}
                          >
                            <ShoppingBag size={13} />
                            <span>Dispense</span>
                          </button>
                          <button
                            className="btn btn-secondary btn-icon btn-sm"
                            onClick={() => handleQuickStock(m.id, 10)}
                            title="Add +10 stock"
                            style={{ width: 28, height: 28, fontSize: '0.8rem' }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>
                    {loading ? 'Accessing drug catalog...' : 'No pharmaceutical stock found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispense Medicine Modal */}
      {dispenseMed && (
        <div className="modal-overlay" onClick={() => setDispenseMed(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Dispense Medication: {dispenseMed.name}</h3>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setDispenseMed(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleDispenseSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert-box alert-danger">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div style={{ background: 'var(--slate-50)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.86rem' }}>
                  <div>Current In Stock: <strong>{dispenseMed.stock_quantity} units</strong></div>
                  <div>Unit Price: <strong>Rs. {Number(dispenseMed.unit_price).toFixed(2)}</strong></div>
                </div>

                <div className="form-group">
                  <label className="form-label">Patient (For billing and prescription history)</label>
                  <select
                    className="form-select"
                    value={dispensePatientId}
                    onChange={(e) => setDispensePatientId(e.target.value)}
                  >
                    <option value="">-- Over-The-Counter / Walk-in --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name} (#{p.id})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity to Dispense *</label>
                  <input
                    type="number"
                    min="1"
                    max={dispenseMed.stock_quantity}
                    className="form-input"
                    value={dispenseQty}
                    onChange={(e) => setDispenseQty(e.target.value)}
                    required
                  />
                </div>

                <div style={{ 
                  marginTop: 14, 
                  padding: 12, 
                  borderRadius: 8, 
                  background: 'var(--slate-100)', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontWeight: 700
                }}>
                  <span>Estimated Total:</span>
                  <span style={{ color: 'var(--primary)' }}>
                    Rs. {(dispenseQty * dispenseMed.unit_price).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDispenseMed(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Dispensing...' : 'Confirm & Dispense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Medication to Pharmacy Stock</h3>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddMedicine}>
              <div className="modal-body">
                {error && (
                  <div className="alert-box alert-danger">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Brand / Commercial Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Augmentin 625mg"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Generic Active Ingredient</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Co-amoxiclav"
                      value={formData.genericName}
                      onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Drug Category</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Analgesic">Analgesic / Pain</option>
                      <option value="Cardiovascular">Cardiovascular</option>
                      <option value="Respiratory">Respiratory</option>
                      <option value="Antidiabetic">Antidiabetic</option>
                      <option value="Antihistamine">Antihistamine</option>
                      <option value="Dermatological">Dermatological</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Dosage & Form</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 625mg Tablet"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Initial Stock Units</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Unit Retail Price (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Batch Expiry Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Wholesale Supplier</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. State Pharmaceuticals Mfg."
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Adding Drug...' : 'Save to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PharmacyView;
