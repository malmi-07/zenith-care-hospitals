import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  UserCheck, UserPlus, Clock, Calendar, Search, 
  X, AlertCircle, Building2
} from 'lucide-react';

function StaffView() {
  const [subTab, setSubTab] = useState('directory'); // 'directory' | 'attendance' | 'leaves'
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showLogAttendanceModal, setShowLogAttendanceModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Form States
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    role: 'Nurse',
    departmentId: '',
    email: '',
    phone: '',
    joinDate: new Date().toISOString().slice(0, 10),
    status: 'Active'
  });

  const [attendanceForm, setAttendanceForm] = useState({
    staffId: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'Present',
    checkIn: '08:30 AM',
    checkOut: '05:00 PM'
  });

  const [leaveForm, setLeaveForm] = useState({
    staffId: '',
    leaveType: 'Casual',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchStaffData = () => {
    setLoading(true);
    Promise.all([
      api.get('/staff'),
      api.get('/staff/attendance'),
      api.get('/staff/leaves'),
      api.get('/doctors/departments')
    ]).then(([sRes, aRes, lRes, dRes]) => {
      setStaff(sRes.data);
      setAttendance(aRes.data);
      setLeaves(lRes.data);
      setDepartments(dRes.data);
      if (sRes.data.length > 0) {
        setAttendanceForm(prev => ({ ...prev, staffId: sRes.data[0].id }));
        setLeaveForm(prev => ({ ...prev, staffId: sRes.data[0].id }));
      }
      if (dRes.data.length > 0) {
        setStaffForm(prev => ({ ...prev, departmentId: dRes.data[0].id }));
      }
    }).catch(err => console.error('Staff fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!staffForm.fullName.trim() || !staffForm.role) {
      setError('Full name and role are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/staff', staffForm);
      setShowAddStaffModal(false);
      fetchStaffData();
    } catch (err) {
      console.error('Add staff error:', err);
      setError(err.response?.data?.message || 'Error adding staff');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordAttendance = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/staff/attendance', attendanceForm);
      setShowLogAttendanceModal(false);
      fetchStaffData();
    } catch (err) {
      console.error('Attendance error:', err);
      setError(err.response?.data?.message || 'Error logging attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestLeave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/staff/leaves', leaveForm);
      setShowLeaveModal(false);
      fetchStaffData();
    } catch (err) {
      console.error('Leave request error:', err);
      setError(err.response?.data?.message || 'Error requesting leave');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLeaveStatus = async (id, status) => {
    try {
      await api.put(`/staff/leaves/${id}`, { status });
      fetchStaffData();
    } catch (err) {
      console.error('Update leave status error:', err);
    }
  };

  const filteredStaff = staff.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.full_name?.toLowerCase().includes(q) ||
           s.role?.toLowerCase().includes(q) ||
           s.department_name?.toLowerCase().includes(q);
  });

  return (
    <div className="animate-fade-in">
      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          className={`btn btn-sm ${subTab === 'directory' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('directory')}
        >
          <UserCheck size={15} />
          <span>Employee Directory</span>
        </button>

        <button
          className={`btn btn-sm ${subTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('attendance')}
        >
          <Clock size={15} />
          <span>Daily Attendance Log</span>
        </button>

        <button
          className={`btn btn-sm ${subTab === 'leaves' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('leaves')}
        >
          <Calendar size={15} />
          <span>Leave Management</span>
        </button>
      </div>

      {subTab === 'directory' && (
        <div className="content-card">
          <div className="card-header">
            <div className="card-title">
              <UserCheck size={20} color="var(--primary)" />
              <span>Hospital Staff & Clinical Workforce</span>
              <span className="badge badge-info" style={{ marginLeft: 8 }}>{staff.length} Personnel</span>
            </div>

            <div className="card-actions">
              <div className="search-wrapper">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search staff name or role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button className="btn btn-primary btn-sm" onClick={() => setShowAddStaffModal(true)}>
                <UserPlus size={15} />
                <span>Register Staff Member</span>
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Full Name</th>
                  <th>Staff Role / Title</th>
                  <th>Department</th>
                  <th>Contact Info</th>
                  <th>Join Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length > 0 ? (
                  filteredStaff.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700, color: 'var(--slate-500)', fontSize: '0.8rem' }}>
                        #EMP-{String(s.id).padStart(4, '0')}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
                        {s.full_name}
                      </td>
                      <td>
                        <span className="badge badge-neutral">{s.role}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem' }}>
                          <Building2 size={13} color="var(--slate-400)" />
                          <span>{s.department_name || 'General Operations'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                          <div>{s.email || 'No email'}</div>
                          <div style={{ color: 'var(--slate-400)', fontSize: '0.74rem' }}>{s.phone || 'No phone'}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                        {s.join_date ? new Date(s.join_date).toLocaleDateString() : 'Active'}
                      </td>
                      <td>
                        <span className="badge badge-success">{s.status || 'Active'}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>
                      No staff records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'attendance' && (
        <div className="content-card">
          <div className="card-header">
            <div className="card-title">
              <Clock size={20} color="var(--primary)" />
              <span>Shift Attendance & Time Tracking</span>
            </div>

            <button className="btn btn-primary btn-sm" onClick={() => setShowLogAttendanceModal(true)}>
              <Clock size={15} />
              <span>Record Shift Attendance</span>
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role / Dept</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length > 0 ? (
                  attendance.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{a.full_name}</td>
                      <td>{a.role} ({a.department || 'General'})</td>
                      <td>{new Date(a.date).toLocaleDateString()}</td>
                      <td>{a.check_in || '08:30 AM'}</td>
                      <td>{a.check_out || '05:00 PM'}</td>
                      <td>
                        <span className={`badge ${a.status === 'Present' ? 'badge-success' : 'badge-danger'}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>
                      No attendance logged for today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'leaves' && (
        <div className="content-card">
          <div className="card-header">
            <div className="card-title">
              <Calendar size={20} color="var(--primary)" />
              <span>Staff Leave Requests & Approvals</span>
            </div>

            <button className="btn btn-primary btn-sm" onClick={() => setShowLeaveModal(true)}>
              <Calendar size={15} />
              <span>Apply for Leave</span>
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Leave Category</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Review Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length > 0 ? (
                  leaves.map(l => {
                    const isPending = l.status?.toLowerCase() === 'pending';
                    return (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div>{l.full_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>{l.role}</div>
                        </td>
                        <td><span className="badge badge-neutral">{l.leave_type}</span></td>
                        <td>
                          {new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--slate-600)', maxWidth: 220 }}>
                          {l.reason || 'Medical / Personal'}
                        </td>
                        <td>
                          <span className={`badge ${
                            l.status?.toLowerCase() === 'approved' ? 'badge-success' :
                            l.status?.toLowerCase() === 'rejected' ? 'badge-danger' :
                            'badge-warning'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isPending && (
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button 
                                className="btn btn-secondary btn-sm" 
                                style={{ padding: '3px 8px', color: '#15803d' }}
                                onClick={() => handleUpdateLeaveStatus(l.id, 'Approved')}
                              >
                                Approve
                              </button>
                              <button 
                                className="btn btn-outline-danger btn-sm" 
                                style={{ padding: '3px 8px' }}
                                onClick={() => handleUpdateLeaveStatus(l.id, 'Rejected')}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>
                      No staff leave requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="modal-overlay" onClick={() => setShowAddStaffModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Register Staff Member</h3>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowAddStaffModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddStaff}>
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
                    placeholder="e.g. Kasun Jayawardena"
                    value={staffForm.fullName}
                    onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Hospital Role / Title</label>
                    <select
                      className="form-select"
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    >
                      <option value="Nurse">Staff Nurse</option>
                      <option value="Doctor">Attending Doctor</option>
                      <option value="Pharmacist">Pharmacist</option>
                      <option value="Laboratory Staff">Lab Technologist</option>
                      <option value="Receptionist">Front Desk Receptionist</option>
                      <option value="Accountant">Billing & Finance Officer</option>
                      <option value="Administrative Staff">Hospital Admin Staff</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-select"
                      value={staffForm.departmentId}
                      onChange={(e) => setStaffForm({ ...staffForm, departmentId: e.target.value })}
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="kasun@hms.com"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Contact</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="0771234567"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddStaffModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Adding...' : 'Register Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Attendance Modal */}
      {showLogAttendanceModal && (
        <div className="modal-overlay" onClick={() => setShowLogAttendanceModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Record Daily Attendance</h3>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowLogAttendanceModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordAttendance}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Staff Member</label>
                  <select
                    className="form-select"
                    value={attendanceForm.staffId}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, staffId: e.target.value })}
                  >
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Shift Status</label>
                    <select
                      className="form-select"
                      value={attendanceForm.status}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                    >
                      <option value="Present">Present (On Duty)</option>
                      <option value="Late">Late Arrival</option>
                      <option value="Half Day">Half Day</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={attendanceForm.date}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Clock In Time</label>
                    <input
                      type="text"
                      className="form-input"
                      value={attendanceForm.checkIn}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Clock Out Time</label>
                    <input
                      type="text"
                      className="form-input"
                      value={attendanceForm.checkOut}
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLogAttendanceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>Save Attendance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Application Modal */}
      {showLeaveModal && (
        <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Submit Staff Leave Request</h3>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowLeaveModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRequestLeave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Staff Member</label>
                  <select
                    className="form-select"
                    value={leaveForm.staffId}
                    onChange={(e) => setLeaveForm({ ...leaveForm, staffId: e.target.value })}
                  >
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select
                    className="form-select"
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  >
                    <option value="Casual">Casual Leave</option>
                    <option value="Medical">Medical / Sick Leave</option>
                    <option value="Annual">Annual Paid Vacation</option>
                    <option value="Emergency">Family Emergency</option>
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">From Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">To Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Brief explanation for leave"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLeaveModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffView;
