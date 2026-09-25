import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Module Views
import DashboardView from '../components/modules/DashboardView';
import PatientsView from '../components/modules/PatientsView';
import DoctorsView from '../components/modules/DoctorsView';
import AppointmentsView from '../components/modules/AppointmentsView';
import MedicalRecordsView from '../components/modules/MedicalRecordsView';
import LaboratoryView from '../components/modules/LaboratoryView';
import PharmacyView from '../components/modules/PharmacyView';
import BillingView from '../components/modules/BillingView';
import StaffView from '../components/modules/StaffView';
import ReportsView from '../components/modules/ReportsView';

// Icons
import {
  Activity, LayoutDashboard, Users, Stethoscope,
  Calendar, FileText, TestTube, Pill, CreditCard,
  UserCheck, BarChart3, LogOut, Menu, ShieldOff,
  Shield, BadgeDollarSign, Microscope, Headset
} from 'lucide-react';

// ─────────────────────────────────────────────
// ROLE → ALLOWED TABS
// roleName values must match what the backend returns in the JWT / user object
// ─────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  Admin:             ['dashboard', 'patients', 'doctors', 'appointments', 'emr', 'laboratory', 'pharmacy', 'billing', 'staff', 'reports'],
  Doctor:            ['dashboard', 'patients', 'doctors', 'appointments', 'emr', 'laboratory'],
  Nurse:             ['dashboard', 'patients', 'doctors', 'appointments', 'emr', 'laboratory'],
  Receptionist:      ['dashboard', 'patients', 'appointments'],
  Pharmacist:        ['dashboard', 'pharmacy'],
  Accountant:        ['dashboard', 'billing'],
  'Lab Staff':       ['dashboard', 'laboratory'],
  'Laboratory Staff':['dashboard', 'laboratory'],
};

// Role metadata: icon, colour accent, and a short welcome tagline
const ROLE_META = {
  Admin:             { color: '#0284c7', icon: Shield,         tagline: 'Full system access — all modules available.' },
  Doctor:            { color: '#0d9488', icon: Stethoscope,    tagline: 'Your clinical workspace: patients, appointments & records.' },
  Nurse:             { color: '#0891b2', icon: UserCheck,      tagline: 'Patient care, appointments, and medical records.' },
  Receptionist:      { color: '#4f46e5', icon: Headset,        tagline: 'Manage patient registrations and appointment scheduling.' },
  Pharmacist:        { color: '#d97706', icon: Pill,           tagline: 'Pharmacy inventory, dispensing, and stock management.' },
  Accountant:        { color: '#059669', icon: BadgeDollarSign,tagline: 'Billing, invoicing, and financial settlements.' },
  'Lab Staff':       { color: '#7c3aed', icon: Microscope,     tagline: 'Laboratory test management and diagnostic reports.' },
  'Laboratory Staff':{ color: '#7c3aed', icon: Microscope,     tagline: 'Laboratory test management and diagnostic reports.' },
};

const DEFAULT_META = { color: '#64748b', icon: Activity, tagline: 'Welcome to Zenith Care Hospitals Management System.' };

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleName     = user?.roleName || '';
  const allowedTabs  = ROLE_PERMISSIONS[roleName] || ['dashboard'];
  const roleMeta     = ROLE_META[roleName] || DEFAULT_META;

  const [activeTab, setActiveTab]               = useState(() => allowedTabs[0] || 'dashboard');
  const [sidebarOpen, setSidebarOpen]           = useState(true);
  const [quickActionTrigger, setQuickActionTrigger] = useState(null);

  // If somehow the stored activeTab is no longer allowed (e.g., role changed), reset
  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0] || 'dashboard');
    }
  }, [roleName]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickAction = (actionType) => {
    if (actionType === 'add-patient'     && allowedTabs.includes('patients'))     { setActiveTab('patients');     setQuickActionTrigger('add-patient'); }
    else if (actionType === 'book-appointment' && allowedTabs.includes('appointments')) { setActiveTab('appointments'); setQuickActionTrigger('book-appointment'); }
    else if (actionType === 'create-bill'     && allowedTabs.includes('billing'))      { setActiveTab('billing');      setQuickActionTrigger('create-bill'); }
    else if (actionType === 'request-lab'     && allowedTabs.includes('laboratory'))   { setActiveTab('laboratory');   setQuickActionTrigger('request-lab'); }
    else if (actionType === 'add-medicine'    && allowedTabs.includes('pharmacy'))     { setActiveTab('pharmacy');     setQuickActionTrigger('add-medicine'); }
  };

  // ALL possible nav items — only ones in allowedTabs will be rendered
  const allNavItems = [
    { id: 'dashboard',    label: 'Dashboard',              icon: LayoutDashboard },
    { id: 'patients',     label: 'Patients',               icon: Users },
    { id: 'doctors',      label: 'Doctors',                icon: Stethoscope },
    { id: 'appointments', label: 'Appointments',           icon: Calendar },
    { id: 'emr',          label: 'Medical Records (EMR)',  icon: FileText },
    { id: 'laboratory',   label: 'Laboratory',             icon: TestTube },
    { id: 'pharmacy',     label: 'Pharmacy',               icon: Pill },
    { id: 'billing',      label: 'Billing & Invoices',     icon: CreditCard },
    { id: 'staff',        label: 'Staff Management',       icon: UserCheck },
    { id: 'reports',      label: 'Reports & Analytics',    icon: BarChart3 },
  ];

  const navItems = allNavItems.filter(item => allowedTabs.includes(item.id));

  const getPageInfo = () => {
    switch (activeTab) {
      case 'dashboard':    return { title: 'Hospital Operations Hub',            subtitle: 'Real-time overview of clinical care, patient flow, and hospital KPIs' };
      case 'patients':     return { title: 'Patient Registry',                   subtitle: 'Manage inpatient and outpatient admissions, demographics, and clinical history' };
      case 'doctors':      return { title: 'Specialist Directory',               subtitle: 'Medical consultants, department assignments, and clinical schedules' };
      case 'appointments': return { title: 'Appointment Scheduling',             subtitle: 'Outpatient booking, rescheduling, and status tracking' };
      case 'emr':          return { title: 'Electronic Medical Records (EMR)',   subtitle: 'Clinical diagnoses, prescriptions, treatment notes, and patient history' };
      case 'laboratory':   return { title: 'Laboratory & Diagnostics',           subtitle: 'Pathology test orders, sample tracking, and clinical reports' };
      case 'pharmacy':     return { title: 'Pharmacy & Stock Inventory',         subtitle: 'Medicine catalog, stock levels, dispensing, and expiry monitoring' };
      case 'billing':      return { title: 'Billing & Invoicing',               subtitle: 'Fee computation, itemized patient receipts, and payment settlements' };
      case 'staff':        return { title: 'Staff Administration',               subtitle: 'Workforce records, shift attendance, and leave management' };
      case 'reports':      return { title: 'Executive Analytics',                subtitle: 'Hospital revenue, department workload, and clinical metrics' };
      default:             return { title: 'Hospital Management System',         subtitle: 'Zenith Care Hospitals' };
    }
  };

  const pageInfo = getPageInfo();
  const RoleIcon = roleMeta.icon;

  return (
    <div className="app-container">
      {/* ── Sidebar Navigation ── */}
      <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar-collapsed'}`} style={{ width: sidebarOpen ? 260 : 78 }}>
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <Activity size={22} />
          </div>
          {sidebarOpen && (
            <div className="sidebar-brand-name">
              <span>Zenith Care</span>
              <span className="sidebar-brand-sub">Hospital System</span>
            </div>
          )}
        </div>

        {/* Role badge strip */}
        {sidebarOpen && (
          <div style={{
            margin: '0 12px 4px',
            padding: '8px 12px',
            borderRadius: 10,
            background: `${roleMeta.color}22`,
            border: `1px solid ${roleMeta.color}44`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <RoleIcon size={14} color={roleMeta.color} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: roleMeta.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {roleName || 'Staff'}
              </div>
              <div style={{ fontSize: '0.66rem', color: '#94a3b8', lineHeight: 1.3 }}>
                {navItems.length} module{navItems.length !== 1 ? 's' : ''} accessible
              </div>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {sidebarOpen && <div className="nav-section-title">My Modules</div>}
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setQuickActionTrigger(null);
                }}
                title={item.label}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                className="user-avatar"
                style={{
                  width: 32, height: 32, fontSize: '0.78rem',
                  background: `linear-gradient(135deg, ${roleMeta.color}, ${roleMeta.color}cc)`,
                }}
              >
                {user?.fullName?.[0] || 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                  {user?.fullName || 'User'}
                </span>
                <span style={{ fontSize: '0.7rem', color: roleMeta.color }}>
                  {roleName || 'Staff'}
                </span>
              </div>
            </div>
          ) : (
            <div
              className="user-avatar"
              style={{
                width: 32, height: 32, fontSize: '0.78rem', margin: '0 auto',
                background: `linear-gradient(135deg, ${roleMeta.color}, ${roleMeta.color}cc)`,
              }}
            >
              {user?.fullName?.[0] || 'U'}
            </div>
          )}

          <button
            className="btn btn-secondary btn-icon btn-sm"
            onClick={handleLogout}
            title="Sign Out"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#f8fafc', border: 'none' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button
              className="btn btn-secondary btn-icon btn-sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle Sidebar"
            >
              <Menu size={16} />
            </button>
            <div>
              <h2 className="page-title">{pageInfo.title}</h2>
              <p className="page-subtitle">{pageInfo.subtitle}</p>
            </div>
          </div>

          <div className="header-right">
            <div className="user-profile-pill" style={{ borderColor: `${roleMeta.color}44` }}>
              <div
                className="user-avatar"
                style={{ background: `linear-gradient(135deg, ${roleMeta.color}, ${roleMeta.color}bb)` }}
              >
                {user?.fullName?.[0] || 'U'}
              </div>
              <div className="user-info-text">
                <span className="user-name">{user?.fullName || 'Staff'}</span>
                <span className="user-role-badge" style={{ background: `${roleMeta.color}22`, color: roleMeta.color }}>
                  {roleName || 'Clinical Staff'}
                </span>
              </div>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
              style={{ fontSize: '0.82rem' }}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Views */}
        <main className="page-container">
          {/* DASHBOARD — always allowed */}
          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={setActiveTab}
              onQuickAction={handleQuickAction}
              userRole={roleName}
              allowedTabs={allowedTabs}
              roleMeta={roleMeta}
              userName={user?.fullName}
            />
          )}

          {/* PATIENTS */}
          {activeTab === 'patients' && (
            allowedTabs.includes('patients')
              ? <PatientsView initialOpenAdd={quickActionTrigger === 'add-patient'} />
              : <AccessDenied module="Patients" roleName={roleName} />
          )}

          {/* DOCTORS */}
          {activeTab === 'doctors' && (
            allowedTabs.includes('doctors')
              ? <DoctorsView />
              : <AccessDenied module="Doctors" roleName={roleName} />
          )}

          {/* APPOINTMENTS */}
          {activeTab === 'appointments' && (
            allowedTabs.includes('appointments')
              ? <AppointmentsView initialOpenBook={quickActionTrigger === 'book-appointment'} />
              : <AccessDenied module="Appointments" roleName={roleName} />
          )}

          {/* MEDICAL RECORDS */}
          {activeTab === 'emr' && (
            allowedTabs.includes('emr')
              ? <MedicalRecordsView />
              : <AccessDenied module="Medical Records" roleName={roleName} />
          )}

          {/* LABORATORY */}
          {activeTab === 'laboratory' && (
            allowedTabs.includes('laboratory')
              ? <LaboratoryView initialOpenAdd={quickActionTrigger === 'request-lab'} />
              : <AccessDenied module="Laboratory" roleName={roleName} />
          )}

          {/* PHARMACY */}
          {activeTab === 'pharmacy' && (
            allowedTabs.includes('pharmacy')
              ? <PharmacyView initialOpenAdd={quickActionTrigger === 'add-medicine'} />
              : <AccessDenied module="Pharmacy" roleName={roleName} />
          )}

          {/* BILLING */}
          {activeTab === 'billing' && (
            allowedTabs.includes('billing')
              ? <BillingView initialOpenAdd={quickActionTrigger === 'create-bill'} />
              : <AccessDenied module="Billing & Invoices" roleName={roleName} />
          )}

          {/* STAFF */}
          {activeTab === 'staff' && (
            allowedTabs.includes('staff')
              ? <StaffView />
              : <AccessDenied module="Staff Management" roleName={roleName} />
          )}

          {/* REPORTS */}
          {activeTab === 'reports' && (
            allowedTabs.includes('reports')
              ? <ReportsView />
              : <AccessDenied module="Reports & Analytics" roleName={roleName} />
          )}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Access Denied Fallback Component
// Shown when a user manually navigates to a forbidden tab
// ─────────────────────────────────────────────
function AccessDenied({ module, roleName }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 420, textAlign: 'center', gap: 16, animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(239,68,68,0.18)',
      }}>
        <ShieldOff size={36} color="#ef4444" />
      </div>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', margin: '0 0 6px' }}>
          Access Restricted
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          The <strong>{module}</strong> module is not available for your role.
        </p>
        <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: 4 }}>
          Current role: <span style={{ fontWeight: 600, color: '#475569' }}>{roleName || 'Unknown'}</span>
          {' '}— contact your system administrator if you need access.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;