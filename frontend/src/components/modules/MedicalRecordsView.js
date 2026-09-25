import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  FileText, Plus, Search, User, Stethoscope, 
  Pill, Calendar, Trash2, X, Check, AlertCircle
} from 'lucide-react';

function MedicalRecordsView() {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    diagnosis: '',
    prescription: '',
    treatmentHistory: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRecords = () => {
    setLoading(true);
    api.get('/medical-records')
      .then(res => setRecords(res.data))
      .catch(err => console.error('fetchRecords error:', err))
      .finally(() => setLoading(false));
  };

  const fetchDependencies = () => {
    api.get('/patients').then(res => {
      setPatients(res.data);
      if (res.data.length > 0 && !formData.patientId) {
        setFormData(prev => ({ ...prev, patientId: res.data[0].id }));
      }
    }).catch(e => console.error(e));

    api.get('/doctors').then(res => {
      setDoctors(res.data);
      if (res.data.length > 0 && !formData.doctorId) {
        setFormData(prev => ({ ...prev, doctorId: res.data[0].id }));
      }
    }).catch(e => console.error(e));
  };

  useEffect(() => {
    fetchRecords();
    fetchDependencies();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      patientId: patients[0]?.id || '',
      doctorId: doctors[0]?.id || '',
      diagnosis: '',
      prescription: '',
      treatmentHistory: ''
    });
    setError('');
    setShowAddModal(true);
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.diagnosis.trim()) {
      setError('Patient and Diagnosis are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/medical-records', formData);
      setShowAddModal(false);
      fetchRecords();
    } catch (err) {
      console.error('Save record error:', err);
      setError(err.response?.data?.message || 'Error saving medical record');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (window.confirm('Delete this medical record?')) {
      try {
        await api.delete(`/medical-records/${id}`);
        fetchRecords();
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const filteredRecords = records.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.patient_name?.toLowerCase().includes(s) ||
      r.diagnosis?.toLowerCase().includes(s) ||
      r.prescription?.toLowerCase().includes(s) ||
      r.doctor_name?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="animate-fade-in">
      <div className="content-card">
        <div className="card-header">
          <div className="card-title">
            <FileText size={20} color="var(--primary)" />
            <span>Electronic Medical Records (EMR) & Clinical Notes</span>
            <span className="badge badge-info" style={{ marginLeft: 8 }}>{records.length} Records</span>
          </div>

          <div className="card-actions">
            <div className="search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search diagnosis, patient, Rx..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
              <Plus size={15} />
              <span>New Medical Entry</span>
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Patient Details</th>
                <th>Attending Doctor</th>
                <th>Clinical Diagnosis</th>
                <th>Prescription (Rx)</th>
                <th>Treatment Plan & Notes</th>
                <th>Visit Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700, color: 'var(--slate-500)', fontSize: '0.8rem' }}>
                      #EMR-{String(r.id).padStart(4, '0')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{r.patient_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                        {r.gender === 'F' ? 'Female' : 'Male'} • Blood: {r.blood_group || 'O+'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.doctor_name || 'General Staff'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>{r.specialization || 'Clinical Care'}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--slate-800)', maxWidth: 220 }}>
                      {r.diagnosis}
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      {r.prescription ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--secondary)', fontSize: '0.84rem' }}>
                          <Pill size={14} style={{ flexShrink: 0 }} />
                          <span>{r.prescription}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>None recorded</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--slate-600)', maxWidth: 240 }}>
                      {r.treatment_history || '—'}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                      {new Date(r.visit_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-icon btn-sm"
                        onClick={() => handleDeleteRecord(r.id)}
                        title="Delete record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>
                    {loading ? 'Loading clinical records...' : 'No medical records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Medical Record Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Electronic Medical Record (EMR)</h3>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveRecord}>
              <div className="modal-body">
                {error && (
                  <div className="alert-box alert-danger">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Patient *</label>
                    <select
                      className="form-select"
                      value={formData.patientId}
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      required
                    >
                      <option value="">-- Select Patient --</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name} (#{p.id})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Attending Doctor</label>
                    <select
                      className="form-select"
                      value={formData.doctorId}
                      onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                    >
                      <option value="">-- Select Doctor --</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>{d.full_name} ({d.specialization})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Clinical Diagnosis *</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="e.g. Acute bronchitis with low grade pyrexia"
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Prescription (Rx) Details</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="e.g. Amoxicillin 500mg 1 TDS x 5 days; Paracetamol 500mg SOS"
                    value={formData.prescription}
                    onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Treatment History / Follow-up Plan</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="e.g. Patient advised bed rest and hydration. Review in 1 week if cough persists."
                    value={formData.treatmentHistory}
                    onChange={(e) => setFormData({ ...formData, treatmentHistory: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (
                    <>
                      <Check size={16} />
                      <span>Save Clinical Record</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicalRecordsView;
