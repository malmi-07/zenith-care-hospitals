import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Calendar, CalendarPlus, Clock, CheckCircle2, 
  XCircle, RotateCcw, Search, Trash2, X, AlertCircle, Check, User
} from 'lucide-react';

function AppointmentsView({ initialOpenBook = false }) {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showBookModal, setShowBookModal] = useState(initialOpenBook);
  const [rescheduleAppt, setRescheduleAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    notes: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAppointments = () => {
    setLoading(true);
    api.get('/appointments')
      .then(res => setAppointments(res.data))
      .catch(err => console.error('fetchAppointments error:', err))
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
    fetchAppointments();
    fetchDependencies();
  }, []);

  const handleOpenBook = () => {
    // Default appointment time: tomorrow 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const dateStr = tomorrow.toISOString().slice(0, 16);

    setFormData({
      patientId: patients[0]?.id || '',
      doctorId: doctors[0]?.id || '',
      appointmentDate: dateStr,
      notes: ''
    });
    setError('');
    setShowBookModal(true);
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.doctorId || !formData.appointmentDate) {
      setError('Patient, Doctor, and Appointment Date/Time are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/appointments', formData);
      setShowBookModal(false);
      fetchAppointments();
    } catch (err) {
      console.error('Book appointment error:', err);
      setError(err.response?.data?.message || 'Error booking appointment');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/appointments/${id}/status`, { status: newStatus });
      fetchAppointments();
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDate) return;
    try {
      await api.put(`/appointments/${rescheduleAppt.id}/reschedule`, { appointmentDate: rescheduleDate });
      setRescheduleAppt(null);
      fetchAppointments();
    } catch (err) {
      console.error('Reschedule error:', err);
      alert('Failed to reschedule appointment.');
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (window.confirm('Are you sure you want to remove this appointment record?')) {
      try {
        await api.delete(`/appointments/${id}`);
        fetchAppointments();
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (statusFilter === 'All') return true;
    return a.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="animate-fade-in">
      <div className="content-card">
        <div className="card-header">
          <div className="card-title">
            <Calendar size={20} color="var(--primary)" />
            <span>Outpatient & Clinical Appointment Schedule</span>
            <span className="badge badge-info" style={{ marginLeft: 8 }}>{appointments.length} Total</span>
          </div>

          <div className="card-actions">
            {/* Status Filter */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'Scheduled', 'Completed', 'Cancelled'].map(st => (
                <button
                  key={st}
                  type="button"
                  className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStatusFilter(st)}
                  style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                >
                  {st}
                </button>
              ))}
            </div>

            <button className="btn btn-primary btn-sm" onClick={handleOpenBook}>
              <CalendarPlus size={15} />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Patient Details</th>
                <th>Assigned Doctor</th>
                <th>Date & Time</th>
                <th>Clinical Notes</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map(a => {
                  const isCompleted = a.status?.toLowerCase() === 'completed';
                  const isCancelled = a.status?.toLowerCase() === 'cancelled';
                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 700, color: 'var(--slate-500)', fontSize: '0.8rem' }}>
                        #APT-{String(a.id).padStart(4, '0')}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{a.patient_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>{a.patient_phone || 'No phone'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.doctor_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>{a.specialization}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {new Date(a.appointment_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                          {new Date(a.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--slate-600)', maxWidth: 200 }}>
                        {a.notes || '—'}
                      </td>
                      <td>
                        <span className={`badge ${
                          isCompleted ? 'badge-success' :
                          isCancelled ? 'badge-danger' :
                          'badge-info'
                        }`}>
                          {a.status || 'Scheduled'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {!isCompleted && !isCancelled && (
                            <>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', color: '#15803d', fontSize: '0.75rem' }}
                                onClick={() => handleStatusChange(a.id, 'Completed')}
                                title="Mark as Completed"
                              >
                                <CheckCircle2 size={13} />
                                <span>Complete</span>
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                onClick={() => {
                                  setRescheduleAppt(a);
                                  setRescheduleDate(new Date(a.appointment_date).toISOString().slice(0, 16));
                                }}
                                title="Reschedule Appointment"
                              >
                                <RotateCcw size={12} />
                                <span>Reschedule</span>
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                onClick={() => handleStatusChange(a.id, 'Cancelled')}
                                title="Cancel Appointment"
                              >
                                <XCircle size={12} />
                                <span>Cancel</span>
                              </button>
                            </>
                          )}
                          <button
                            className="btn btn-secondary btn-icon btn-sm"
                            onClick={() => handleDeleteAppointment(a.id)}
                            title="Remove Record"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>
                    {loading ? 'Fetching appointments...' : 'No appointments found in this view.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="modal-overlay" onClick={() => setShowBookModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Book Patient Appointment</h3>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowBookModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBookSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert-box alert-danger">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Select Patient *</label>
                  <select
                    className="form-select"
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name} ({p.phone || 'No phone'})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Consulting Specialist *</label>
                  <select
                    className="form-select"
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.full_name} - {d.specialization} ({d.department})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Appointment Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason / Clinical Notes</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="e.g. Routine follow-up for chest tightness, fasting required"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Scheduling...' : (
                    <>
                      <Check size={16} />
                      <span>Confirm Booking</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleAppt && (
        <div className="modal-overlay" onClick={() => setRescheduleAppt(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Reschedule Appointment #APT-{rescheduleAppt.id}</h3>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setRescheduleAppt(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: 16, fontSize: '0.9rem' }}>
                  Rescheduling consultation for <strong>{rescheduleAppt.patient_name}</strong> with <strong>{rescheduleAppt.doctor_name}</strong>.
                </div>

                <div className="form-group">
                  <label className="form-label">Select New Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRescheduleAppt(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save New Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentsView;
