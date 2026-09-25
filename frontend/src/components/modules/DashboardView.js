import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Users, Calendar, DollarSign, TestTube, AlertTriangle, 
  Clock, ArrowUpRight, UserPlus, CalendarPlus, Receipt,
  PlusCircle, RefreshCw, TrendingUp, Pill
} from 'lucide-react';

// ─────────────────────────────────────────────
// Which KPI cards each role can see
// ─────────────────────────────────────────────
const ROLE_KPI_ACCESS = {
  Admin:              ['patients', 'appointments', 'revenue', 'laboratory', 'pharmacy'],
  Doctor:             ['patients', 'appointments', 'laboratory'],
  Nurse:              ['patients', 'appointments', 'laboratory'],
  Receptionist:       ['patients', 'appointments'],
  Pharmacist:         ['pharmacy'],
  Accountant:         ['revenue'],
  'Lab Staff':        ['laboratory'],
  'Laboratory Staff': ['laboratory'],
};

// Which quick-action buttons each role can see
const ROLE_QUICK_ACTIONS = {
  Admin:              ['add-patient', 'book-appointment', 'create-bill', 'request-lab', 'add-medicine'],
  Doctor:             ['add-patient', 'book-appointment', 'request-lab'],
  Nurse:              ['add-patient', 'book-appointment', 'request-lab'],
  Receptionist:       ['add-patient', 'book-appointment'],
  Pharmacist:         ['add-medicine'],
  Accountant:         ['create-bill'],
  'Lab Staff':        ['request-lab'],
  'Laboratory Staff': ['request-lab'],
};

function DashboardView({ setActiveTab, onQuickAction, userRole, allowedTabs, roleMeta, userName }) {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  const kpiAccess    = ROLE_KPI_ACCESS[userRole]    || ROLE_KPI_ACCESS['Admin'];
  const quickActions = ROLE_QUICK_ACTIONS[userRole] || ROLE_QUICK_ACTIONS['Admin'];

  const fetchStats = () => {
    setLoading(true);
    api.get('/reports/dashboard')
      .then(res => setStats(res.data))
      .catch(err => console.error('Dashboard stats fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--slate-500)' }}>
        <RefreshCw size={32} style={{ animation: 'pulseGlow 1.2s infinite' }} />
        <p style={{ marginTop: '14px', fontWeight: 500 }}>Loading live hospital operations data...</p>
      </div>
    );
  }

  const accentColor = roleMeta?.color || '#0284c7';

  // ─── Greeting Banner ───────────────────────────────────────────────
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="animate-fade-in">

      {/* ── Role Welcome Banner ─────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(120deg, ${accentColor}18 0%, ${accentColor}08 100%)`,
        border: `1px solid ${accentColor}30`,
        borderRadius: 16,
        padding: '20px 28px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: accentColor, marginBottom: 4 }}>
            {userRole || 'Staff'} Dashboard
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
            {greeting()}, {userName?.split(' ')[0] || 'there'} 👋
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 3 }}>
            {roleMeta?.tagline || 'Welcome to Zenith Care Hospitals Management System.'}
          </div>
        </div>
        <div style={{
          minWidth: 52, height: 52, borderRadius: 14,
          background: `${accentColor}22`,
          border: `2px solid ${accentColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {roleMeta?.icon && <roleMeta.icon size={24} color={accentColor} />}
        </div>
      </div>

      {/* ── KPI Stat Cards — filtered by role ──────────────────────── */}
      {kpiAccess.length > 0 && (
        <div className="kpi-grid" style={{ gridTemplateColumns: `repeat(${Math.min(kpiAccess.length, 5)}, 1fr)` }}>

          {/* 1. Total Patients */}
          {kpiAccess.includes('patients') && (
            <div className="kpi-card" onClick={() => setActiveTab('patients')} style={{ cursor: 'pointer' }}>
              <div className="kpi-top">
                <span className="kpi-title">Total Patients</span>
                <div className="kpi-icon-wrap kpi-icon-blue"><Users size={20} /></div>
              </div>
              <div className="kpi-value">{stats?.totalPatients || 0}</div>
              <div className="kpi-footer">
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Active registered</span>
                <span>in system</span>
              </div>
            </div>
          )}

          {/* 2. Today's Appointments */}
          {kpiAccess.includes('appointments') && (
            <div className="kpi-card" onClick={() => setActiveTab('appointments')} style={{ cursor: 'pointer' }}>
              <div className="kpi-top">
                <span className="kpi-title">Today's Appointments</span>
                <div className="kpi-icon-wrap kpi-icon-teal"><Calendar size={20} /></div>
              </div>
              <div className="kpi-value">{stats?.todayAppointments || 0}</div>
              <div className="kpi-footer">
                <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{stats?.totalAppointments || 0} total</span>
                <span>booked appointments</span>
              </div>
            </div>
          )}

          {/* 3. Revenue — Accountant / Admin only */}
          {kpiAccess.includes('revenue') && (
            <div className="kpi-card" onClick={() => setActiveTab('billing')} style={{ cursor: 'pointer' }}>
              <div className="kpi-top">
                <span className="kpi-title">Revenue Collected</span>
                <div className="kpi-icon-wrap kpi-icon-emerald"><DollarSign size={20} /></div>
              </div>
              <div className="kpi-value">Rs. {Number(stats?.totalRevenue || 0).toLocaleString()}</div>
              <div className="kpi-footer">
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Rs. {Number(stats?.pendingRevenue || 0).toLocaleString()}</span>
                <span>pending payments</span>
              </div>
            </div>
          )}

          {/* 4. Laboratory Requests */}
          {kpiAccess.includes('laboratory') && (
            <div className="kpi-card" onClick={() => setActiveTab('laboratory')} style={{ cursor: 'pointer' }}>
              <div className="kpi-top">
                <span className="kpi-title">Laboratory Requests</span>
                <div className="kpi-icon-wrap kpi-icon-purple"><TestTube size={20} /></div>
              </div>
              <div className="kpi-value">{stats?.labRequests || 0}</div>
              <div className="kpi-footer">
                <span style={{ color: '#7c3aed', fontWeight: 600 }}>{stats?.pendingLabRequests || 0} pending</span>
                <span>sample analyses</span>
              </div>
            </div>
          )}

          {/* 5. Pharmacy Alerts — Pharmacist / Admin only */}
          {kpiAccess.includes('pharmacy') && (
            <div className="kpi-card" onClick={() => setActiveTab('pharmacy')} style={{ cursor: 'pointer' }}>
              <div className="kpi-top">
                <span className="kpi-title">Pharmacy Alerts</span>
                <div className="kpi-icon-wrap kpi-icon-amber"><AlertTriangle size={20} /></div>
              </div>
              <div className="kpi-value" style={{ color: stats?.pharmacyAlerts > 0 ? '#d97706' : 'inherit' }}>
                {stats?.pharmacyAlerts || 0}
              </div>
              <div className="kpi-footer">
                <span>{stats?.lowStockAlerts || 0} low stock, {stats?.expiryAlerts || 0} expiring</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Quick Actions — filtered by role ───────────────────────── */}
      {quickActions.length > 0 && (
        <div className="content-card">
          <div className="card-header">
            <div className="card-title">
              <PlusCircle size={19} color="var(--primary)" />
              <span>Fast Action Shortcuts</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={fetchStats} title="Refresh Live Data">
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            {quickActions.includes('add-patient') && (
              <button className="btn btn-primary btn-sm" onClick={() => onQuickAction('add-patient')}>
                <UserPlus size={15} />
                <span>Register New Patient</span>
              </button>
            )}
            {quickActions.includes('book-appointment') && (
              <button className="btn btn-secondary btn-sm" onClick={() => onQuickAction('book-appointment')}>
                <CalendarPlus size={15} />
                <span>Book Appointment</span>
              </button>
            )}
            {quickActions.includes('create-bill') && (
              <button className="btn btn-secondary btn-sm" onClick={() => onQuickAction('create-bill')}>
                <Receipt size={15} />
                <span>Generate Patient Invoice</span>
              </button>
            )}
            {quickActions.includes('request-lab') && (
              <button className="btn btn-secondary btn-sm" onClick={() => onQuickAction('request-lab')}>
                <TestTube size={15} />
                <span>Order Lab Test</span>
              </button>
            )}
            {quickActions.includes('add-medicine') && (
              <button className="btn btn-secondary btn-sm" onClick={() => onQuickAction('add-medicine')}>
                <Pill size={15} />
                <span>Add Pharmacy Stock</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom Two-Column Layout ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1.1fr)', gap: '24px' }}>

        {/* Recent Appointments — visible to roles with appointment access */}
        {allowedTabs?.includes('appointments') && (
          <div className="content-card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <div className="card-title">
                <Clock size={18} color="var(--slate-700)" />
                <span>Upcoming & Recent Appointments</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('appointments')}
                style={{ fontSize: '0.78rem' }}
              >
                <span>View All</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentAppointments?.length > 0 ? (
                    stats.recentAppointments.map(appt => (
                      <tr key={appt.id}>
                        <td style={{ fontWeight: 600 }}>{appt.patient_name}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{appt.doctor_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>{appt.specialization}</div>
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>
                          {new Date(appt.appointment_date).toLocaleString([], {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td>
                          <span className={`badge ${
                            appt.status?.toLowerCase() === 'completed' ? 'badge-success' :
                            appt.status?.toLowerCase() === 'cancelled' ? 'badge-danger' :
                            'badge-info'
                          }`}>
                            {appt.status || 'Scheduled'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--slate-400)' }}>
                        No recent appointments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Role-Specific Summary Panel */}
        <div className="content-card" style={{ marginBottom: 0, gridColumn: allowedTabs?.includes('appointments') ? 'auto' : '1 / -1' }}>
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={18} color="var(--secondary)" />
              <span>
                {userRole === 'Pharmacist' ? 'Pharmacy Summary' :
                 userRole === 'Accountant' ? 'Financial Summary' :
                 userRole === 'Lab Staff' || userRole === 'Laboratory Staff' ? 'Lab Summary' :
                 userRole === 'Receptionist' ? 'Front Desk Summary' :
                 'Operations Overview'}
              </span>
            </div>
          </div>
          <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Admin / Doctor / Nurse */}
            {(userRole === 'Admin' || userRole === 'Doctor' || userRole === 'Nurse') && (
              <>
                <SummaryRow label="Active Medical Staff" sub="Doctors, Nurses, Pharmacists, Lab Techs" value={stats?.totalStaff || 5} color="var(--primary)" />
                <SummaryRow label="Pharmacy Drugs in Stock" sub="Inventory items tracked" value={stats?.totalMedicines || 0} color="var(--secondary)" />
                <SummaryRow label="Pending Lab Tests" sub="Awaiting sample or result entry" value={stats?.pendingLabRequests || 0} color="#7c3aed" />
                <SummaryRow label="System Health" sub="SQL Server DB Connected & Encrypted" value={<span className="badge badge-success">Online</span>} />
              </>
            )}

            {/* Receptionist */}
            {userRole === 'Receptionist' && (
              <>
                <SummaryRow label="Total Patients" sub="Registered in system" value={stats?.totalPatients || 0} color="var(--primary)" />
                <SummaryRow label="Today's Appointments" sub="Scheduled for today" value={stats?.todayAppointments || 0} color="var(--secondary)" />
                <SummaryRow label="Total Appointments" sub="All time bookings" value={stats?.totalAppointments || 0} color="#4f46e5" />
                <SummaryRow label="System Status" sub="Backend server operational" value={<span className="badge badge-success">Online</span>} />
              </>
            )}

            {/* Pharmacist */}
            {userRole === 'Pharmacist' && (
              <>
                <SummaryRow label="Medicines in Stock" sub="Total unique drug entries" value={stats?.totalMedicines || 0} color="#d97706" />
                <SummaryRow label="Low Stock Alerts" sub="Below minimum threshold" value={stats?.lowStockAlerts || 0} color="var(--danger)" />
                <SummaryRow label="Expiry Alerts" sub="Items expiring within 30 days" value={stats?.expiryAlerts || 0} color="#f59e0b" />
                <SummaryRow label="System Status" sub="Pharmacy module operational" value={<span className="badge badge-success">Online</span>} />
              </>
            )}

            {/* Accountant */}
            {userRole === 'Accountant' && (
              <>
                <SummaryRow label="Revenue Collected" sub="Total payments received" value={`Rs. ${Number(stats?.totalRevenue || 0).toLocaleString()}`} color="#059669" />
                <SummaryRow label="Pending Payments" sub="Awaiting settlement" value={`Rs. ${Number(stats?.pendingRevenue || 0).toLocaleString()}`} color="var(--danger)" />
                <SummaryRow label="Total Patients Billed" sub="Invoices generated" value={stats?.totalPatients || 0} color="var(--primary)" />
                <SummaryRow label="System Status" sub="Billing module operational" value={<span className="badge badge-success">Online</span>} />
              </>
            )}

            {/* Lab Staff */}
            {(userRole === 'Lab Staff' || userRole === 'Laboratory Staff') && (
              <>
                <SummaryRow label="Total Lab Requests" sub="All test orders in system" value={stats?.labRequests || 0} color="#7c3aed" />
                <SummaryRow label="Pending Tests" sub="Awaiting sample or processing" value={stats?.pendingLabRequests || 0} color="#d97706" />
                <SummaryRow label="Completed Tests" sub="Results entered" value={(stats?.labRequests || 0) - (stats?.pendingLabRequests || 0)} color="#059669" />
                <SummaryRow label="System Status" sub="Laboratory module operational" value={<span className="badge badge-success">Online</span>} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helper: single summary row ─────────────────────────────────────────────
function SummaryRow({ label, sub, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--slate-100)' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{sub}</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: '1.25rem', color: color || '#1e293b' }}>{value}</div>
    </div>
  );
}

export default DashboardView;
