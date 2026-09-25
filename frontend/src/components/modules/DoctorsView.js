import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Stethoscope, UserPlus, Search, Clock, Mail, 
  Building2, Edit2, Trash2, X, Check, AlertCircle, Calendar
} from 'lucide-react';

function DoctorsView() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    departmentId: '',
    specialization: '',
    schedule: 'Mon-Fri 09:00 AM - 04:00 PM'
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchDoctors = () => {
    setLoading(true);
    api.get('/doctors')
      .then(res => setDoctors(res.data))
      .catch(err => console.error('fetchDoctors error:', err))
      .finally(() => setLoading(false));
  };

  const fetchDepartments = () => {
    api.get('/doctors/departments')
      .then(res => {
        setDepartments(res.data);
        if (res.data.length > 0 && !formData.departmentId) {
          setFormData(prev => ({ ...prev, departmentId: res.data[0].id }));
        }
      })
      .catch(err => console.error('fetchDepartments error:', err));
  };

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      fullName: '',
      email: '',
      departmentId: departments[0]?.id || 1,
      specialization: '',
      schedule: 'Mon-Fri 09:00 AM - 04:00 PM'
    });
    setError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (doc) => {
    setFormData({
      departmentId: departments.find(d => d.name === doc.department)?.id || 1,
      specialization: doc.specialization || '',
      schedule: doc.schedule || 'Mon-Fri 09:00 AM - 04:00 PM'
    });
    setError('');
    setEditDoctor(doc);
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editDoctor) {
        await api.put(`/doctors/${editDoctor.id}`, {
          departmentId: formData.departmentId,
          specialization: formData.specialization,
          schedule: formData.schedule
        });
      } else {
        await api.post('/doctors', formData);
      }
      setShowAddModal(false);
      setEditDoctor(null);
      fetchDoctors();
    } catch (err) {
      console.error('Save doctor error:', err);
      setError(err.response?.data?.message || 'Error saving doctor profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoctor = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove Dr. ${name}?`)) {
      try {
        await api.delete(`/doctors/${id}`);
        fetchDoctors();
      } catch (err) {
        console.error('Delete doctor error:', err);
        alert('Could not remove doctor: active appointments or records may exist.');
      }
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesDept = selectedDept === 'All' || doc.department === selectedDept;
    const matchesSearch = !search || 
      doc.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      doc.department?.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="animate-fade-in">
      <div className="content-card">
        <div className="card-header">
          <div className="card-title">
            <Stethoscope size={20} color="var(--primary)" />
            <span>Consultant & Specialist Medical Staff</span>
            <span className="badge badge-info" style={{ marginLeft: 8 }}>{doctors.length} Doctors</span>
          </div>

          <div className="card-actions">
            {/* Department Filter */}
            <select
              className="form-select"
              style={{ width: 170, padding: '7px 10px', fontSize: '0.84rem' }}
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="All">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>

            <div className="search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search doctor or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 220 }}
              />
            </div>

            <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
              <UserPlus size={15} />
              <span>Add Doctor</span>
            </button>
          </div>
        </div>

        {/* Doctor Cards Grid */}
        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map(doc => (
              <div 
                key={doc.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--slate-200)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.16s ease, box-shadow 0.16s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.1rem'
                      }}>
                        {doc.full_name?.replace('Dr. ', '')[0] || 'D'}
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--slate-900)' }}>{doc.full_name}</h4>
                        <span className="badge badge-info" style={{ marginTop: 2 }}>{doc.specialization}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14, fontSize: '0.82rem', color: 'var(--slate-600)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={14} color="var(--slate-400)" />
                      <span style={{ fontWeight: 600 }}>Department:</span>
                      <span>{doc.department || 'General Medicine'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Mail size={14} color="var(--slate-400)" />
                      <span>{doc.email || 'No email provided'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Clock size={14} color="var(--secondary)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <span style={{ fontWeight: 600 }}>Schedule:</span>
                        <div style={{ color: 'var(--slate-700)', fontSize: '0.8rem' }}>{doc.schedule || 'Consultation by appointment'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  marginTop: 18, 
                  paddingTop: 12, 
                  borderTop: '1px solid var(--slate-100)', 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  gap: 8
                }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenEdit(doc)}
                    style={{ fontSize: '0.78rem' }}
                  >
                    <Edit2 size={12} />
                    <span>Edit Profile</span>
                  </button>
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDeleteDoctor(doc.id, doc.full_name)}
                    style={{ fontSize: '0.78rem' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 20px', color: 'var(--slate-400)' }}>
              {loading ? 'Loading specialists list...' : 'No doctor records match the filter criteria.'}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Doctor Modal */}
      {(showAddModal || editDoctor) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setEditDoctor(null); }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editDoctor ? `Edit Profile: ${editDoctor.full_name}` : 'Register Medical Doctor'}
              </h3>
              <button 
                className="btn btn-secondary btn-icon btn-sm" 
                onClick={() => { setShowAddModal(false); setEditDoctor(null); }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveDoctor}>
              <div className="modal-body">
                {error && (
                  <div className="alert-box alert-danger">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {!editDoctor && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Full Doctor Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Dr. Robert Perera"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Work Email</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="e.g. robert@hms.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">Department Assignment *</label>
                  <select
                    className="form-select"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    required
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Clinical Specialization</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Interventional Cardiologist"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Weekly Schedule / Hours</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mon, Wed, Fri 09:00 AM - 02:00 PM"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowAddModal(false); setEditDoctor(null); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (
                    <>
                      <Check size={16} />
                      <span>{editDoctor ? 'Update Doctor' : 'Save Doctor'}</span>
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

export default DoctorsView;
