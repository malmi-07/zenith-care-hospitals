import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Activity, Shield, Stethoscope, UserCheck, 
  FileText, Pill, CreditCard, TestTube, ArrowRight,
  AlertCircle, CheckCircle2, Lock, Mail, User
} from 'lucide-react';

function Login() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [roleId, setRoleId] = useState(2); // Default to Doctor
  const [roles, setRoles] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch available roles for registration
    api.get('/auth/roles')
      .then(res => setRoles(res.data))
      .catch(err => console.log('Roles fetch fallback:', err));
  }, []);

  const demoAccounts = [
    { role: 'Admin', name: 'System Admin', email: 'admin@hms.com', pass: 'admin123', icon: Shield, color: '#0284c7' },
    { role: 'Doctor', name: 'Dr. Sarah Perera', email: 'sarah@hms.com', pass: 'admin123', icon: Stethoscope, color: '#0d9488' },
    { role: 'Nurse', name: 'Nurse Emily', email: 'emily@hms.com', pass: 'admin123', icon: UserCheck, color: '#0891b2' },
    { role: 'Receptionist', name: 'Front Desk', email: 'reception@hms.com', pass: 'admin123', icon: FileText, color: '#4f46e5' },
    { role: 'Pharmacist', name: 'Pharmacy Liam', email: 'pharmacy@hms.com', pass: 'admin123', icon: Pill, color: '#d97706' },
    { role: 'Accountant', name: 'Billing Maya', email: 'billing@hms.com', pass: 'admin123', icon: CreditCard, color: '#059669' },
    { role: 'Lab Staff', name: 'Lab Tech Alex', email: 'lab@hms.com', pass: 'admin123', icon: TestTube, color: '#7c3aed' },
  ];

  const handleDemoFill = (acc, autoLogin = false) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setError('');
    if (autoLogin) {
      triggerLogin(acc.email, acc.pass);
    }
  };

  const triggerLogin = async (eMail, pwd) => {
    setError('');
    setLoading(true);
    try {
      await login(eMail, pwd);
      navigate('/dashboard');
    } catch (err) {
      console.error('LOGIN ERROR:', err);
      if (err.response) {
        setError(err.response.data?.message || 'Invalid credentials');
      } else if (err.request) {
        setError('Cannot connect to Zenith Care Hospitals server. Please ensure backend is running on port 5000.');
      } else {
        setError(err.message || 'Login error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    triggerLogin(email, password);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await register(fullName, regEmail, regPassword, parseInt(roleId));
      setSuccessMsg('Account registered successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 700);
    } catch (err) {
      console.error('REGISTER ERROR:', err);
      if (err.response) {
        setError(err.response.data?.message || 'Registration failed');
      } else if (err.request) {
        setError('Cannot connect to backend server. Please verify port 5000.');
      } else {
        setError(err.message || 'Registration error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo-badge">
            <Activity size={28} />
          </div>
          <h1 className="auth-title">Zenith Care Hospitals</h1>
          <p className="auth-subtitle">Hospital Management & Clinical Care System</p>
        </div>

        <div className="auth-tabs">
          <button 
            type="button" 
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => { setActiveTab('login'); setError(''); }}
          >
            Sign In
          </button>
          <button 
            type="button" 
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => { setActiveTab('register'); setError(''); }}
          >
            Create Account
          </button>
        </div>

        <div className="auth-body">
          {error && (
            <div className="alert-box alert-danger">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="alert-box alert-success">
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>{successMsg}</div>
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--slate-400)' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    placeholder="e.g. admin@hms.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--slate-400)' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: 8, padding: '11px' }}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <div className="demo-chips-section">
                <div className="demo-chips-title">
                  <span>1-Click Quick Demo Login</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--slate-400)' }}>Pass: admin123</span>
                </div>
                <div className="demo-chips-grid">
                  {demoAccounts.map((acc) => {
                    const Icon = acc.icon;
                    return (
                      <button
                        key={acc.role}
                        type="button"
                        className="demo-chip"
                        onClick={() => handleDemoFill(acc, true)}
                        title={`Click to login directly as ${acc.role}`}
                      >
                        <Icon size={14} color={acc.color} />
                        <span>{acc.role}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--slate-400)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    placeholder="Dr. John Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--slate-400)' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    placeholder="john@hms.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--slate-400)' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    placeholder="Create a strong password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">System Role</label>
                <select
                  className="form-select"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                >
                  {roles.length > 0 ? (
                    roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="1">Admin</option>
                      <option value="2">Doctor</option>
                      <option value="3">Nurse</option>
                      <option value="4">Receptionist</option>
                      <option value="5">Pharmacist</option>
                      <option value="6">Accountant</option>
                      <option value="7">Laboratory Staff</option>
                    </>
                  )}
                </select>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: 10, padding: '11px' }}
                disabled={loading}
              >
                {loading ? 'Creating Profile...' : (
                  <>
                    <span>Create Staff Account</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;