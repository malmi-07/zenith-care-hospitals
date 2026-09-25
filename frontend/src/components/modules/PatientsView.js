import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Users, UserPlus, Search, Edit2, Trash2, FileText, 
  X, Check, AlertCircle, Phone, MapPin, Calendar, Heart, ShieldAlert
} from 'lucide-react';

function PatientsView({ initialOpenAdd = false }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(initialOpenAdd);
  const [editPatient, setEditPatient] = useState(null);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    gender: 'M',
    phone: '',
    address: '',
    bloodGroup: 'O+',
    emergencyContact: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchPatients = () => {
    setLoading(true);
    api.get(`/patients?search=${encodeURIComponent(search)}`)
      .then(res => setPatients(res.data))
      .catch(err => console.error('fetchPatients error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const handleOpenAdd = () => {
    setFormData({
      fullName: '',
      dob: '',
      gender: 'M',
      phone: '',
      address: '',
      bloodGroup: 'O+',
      emergencyContact: ''
    });
    setError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (p) => {
    setFormData({
      fullName: p.full_name,
      dob: p.dob ? p.dob.split('T')[0] : '',
      gender: p.gender || 'M',
      phone: p.phone || '',
      address: p.address || '',
      bloodGroup: p.blood_group || 'O+',
      emergencyContact: p.emergency_contact || ''
    });
    setError('');
    setEditPatient(p);
  };

  const handleViewHistory = async (patientId) => {
    setHistoryLoading(true);
    setSelectedHistory(null);
    try {
      const res = await api.get(`/patients/${patientId}/history`);
      setSelectedHistory(res.data);
    } catch (err) {
      console.error('Fetch history error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSavePatient = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('Patient full name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editPatient) {
        await api.put(`/patients/${editPatient.id}`, formData);
      } else {
        await api.post('/patients', formData);
      }
      setShowAddModal(false);
      setEditPatient(null);
      fetchPatients();
    } catch (err) {
      console.error('Save patient error:', err);
      setError(err.response?.data?.message || 'Error saving patient');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePatient = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove patient "${name}"?`)) {
      try {
        await api.delete(`/patients/${id}`);
        fetchPatients();
      } catch (err) {
        console.error('Delete error:', err);
        alert('Could not delete patient: they may have linked records.');
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="content-card">
        <div className="card-header">
          <div className="card-title">
            <Users size={20} color="var(--primary)" />
            <span>Registered Patients Directory</span>
            <span className="badge badge-info" style={{ marginLeft: 8 }}>{patients.length} Total</span>
          </div>

          <div className="card-actions">
            <div className="search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search patient name, phone, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
              <UserPlus size={15} />
              <span>Register Patient</span>
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Full Name</th>
                <th>Gender / Blood Group</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Registered Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.length > 0 ? (
                patients.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: 'var(--slate-500)', fontSize: '0.8rem' }}>
                      #PT-{String(p.id).padStart(4, '0')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{p.full_name}</div>
                      {p.dob && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                          DOB: {new Date(p.dob).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ marginRight: 6 }}>
                        {p.gender === 'F' ? 'Female' : p.gender === 'M' ? 'Male' : p.gender || 'Other'}
                      </span>
                      {p.blood_group && (
                        <span className="badge badge-danger">
                          <Heart size={11} style={{ fill: '#ef4444' }} />
                          <span>{p.blood_group}</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem' }}>
                        <Phone size={12} color="var(--slate-400)" />
                        <span>{p.phone || 'No phone'}</span>
                      </div>
                      {p.emergency_contact && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                          ICE: {p.emergency_contact}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem' }}>
                        <MapPin size={12} color="var(--slate-400)" />
                        <span>{p.address || 'Not specified'}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => handleViewHistory(p.id)}
                          title="View complete medical history"
                        >
                          <FileText size={13} />
                          <span>History</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-icon btn-sm"
                          onClick={() => handleOpenEdit(p)}
                          title="Edit patient details"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-outline-danger btn-icon btn-sm"
                          onClick={() => handleDeletePatient(p.id, p.full_name)}
                          title="Delete patient"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>
                    {loading ? 'Searching patient records...' : 'No patient records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Patient Modal */}
      {(showAddModal || editPatient) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setEditPatient(null); }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editPatient ? 'Edit Patient Information' : 'Register New Patient'}
              </h3>
              <button 
                className="btn btn-secondary btn-icon btn-sm" 
                onClick={() => { setShowAddModal(false); setEditPatient(null); }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePatient}>
              <div className="modal-body">
                {error && (
                  <div className="alert-box alert-danger">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Johnathan Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-select"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 0771234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select
                      className="form-select"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Residential Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 123 Colombo Road, Kandy"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Emergency Contact (ICE Phone / Name)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 0779998881 (Wife - Mary)"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowAddModal(false); setEditPatient(null); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (
                    <>
                      <Check size={16} />
                      <span>{editPatient ? 'Save Changes' : 'Register Patient'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Complete Medical History Modal */}
      {(selectedHistory || historyLoading) && (
        <div className="modal-overlay" onClick={() => setSelectedHistory(null)}>
          <div className="modal-dialog" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={20} color="var(--primary)" />
                <h3 className="modal-title">
                  Patient Medical Dossier: {selectedHistory?.patient?.full_name}
                </h3>
              </div>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setSelectedHistory(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {historyLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Loading medical history...</div>
              ) : selectedHistory ? (
                <div>
                  {/* Summary Ribbon */}
                  <div style={{ 
                    background: 'var(--slate-100)', 
                    padding: '14px 16px', 
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 20,
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div><strong>ID:</strong> #PT-{String(selectedHistory.patient.id).padStart(4, '0')}</div>
                    <div><strong>Gender:</strong> {selectedHistory.patient.gender}</div>
                    <div><strong>Blood Group:</strong> <span className="badge badge-danger">{selectedHistory.patient.blood_group}</span></div>
                    <div><strong>Phone:</strong> {selectedHistory.patient.phone || 'N/A'}</div>
                  </div>

                  {/* Section 1: Diagnoses & Medical Records */}
                  <div style={{ marginBottom: 22 }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 8, color: 'var(--slate-900)' }}>
                      🩺 Medical Diagnoses & EMR Notes ({selectedHistory.records?.length || 0})
                    </h4>
                    {selectedHistory.records?.length > 0 ? (
                      selectedHistory.records.map(r => (
                        <div key={r.id} style={{ border: '1px solid var(--slate-200)', borderRadius: 8, padding: 12, marginBottom: 8, background: '#fff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--slate-500)', marginBottom: 4 }}>
                            <span>Doctor: {r.doctor_name || 'Attending Physician'}</span>
                            <span>{new Date(r.visit_date).toLocaleDateString()}</span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--slate-900)' }}>{r.diagnosis}</div>
                          {r.prescription && (
                            <div style={{ marginTop: 4, fontSize: '0.82rem', color: 'var(--secondary)' }}>
                              <strong>Rx:</strong> {r.prescription}
                            </div>
                          )}
                          {r.treatment_history && (
                            <div style={{ marginTop: 4, fontSize: '0.78rem', color: 'var(--slate-600)' }}>
                              <strong>Treatment Notes:</strong> {r.treatment_history}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: '0.82rem', color: 'var(--slate-400)' }}>No past diagnosis records.</p>
                    )}
                  </div>

                  {/* Section 2: Laboratory Tests */}
                  <div style={{ marginBottom: 22 }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 8, color: 'var(--slate-900)' }}>
                      🔬 Laboratory Investigations ({selectedHistory.labs?.length || 0})
                    </h4>
                    {selectedHistory.labs?.length > 0 ? (
                      <div className="table-container">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Test Name</th>
                              <th>Status</th>
                              <th>Result</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedHistory.labs.map(l => (
                              <tr key={l.id}>
                                <td style={{ fontWeight: 600 }}>{l.test_name}</td>
                                <td><span className="badge badge-info">{l.status}</span></td>
                                <td style={{ fontSize: '0.82rem' }}>{l.result || 'Pending Result'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.82rem', color: 'var(--slate-400)' }}>No laboratory tests recorded.</p>
                    )}
                  </div>

                  {/* Section 3: Billing & Invoices */}
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 8, color: 'var(--slate-900)' }}>
                      💳 Invoices & Billing History ({selectedHistory.bills?.length || 0})
                    </h4>
                    {selectedHistory.bills?.length > 0 ? (
                      <div className="table-container">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Invoice</th>
                              <th>Description</th>
                              <th>Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedHistory.bills.map(b => (
                              <tr key={b.id}>
                                <td style={{ fontWeight: 600 }}>{b.invoice_number || `#${b.id}`}</td>
                                <td>{b.description}</td>
                                <td style={{ fontWeight: 700 }}>Rs. {Number(b.amount).toLocaleString()}</td>
                                <td>
                                  <span className={`badge ${b.status?.toLowerCase() === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                                    {b.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.82rem', color: 'var(--slate-400)' }}>No invoice records for this patient.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedHistory(null)}>Close Dossier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientsView;
