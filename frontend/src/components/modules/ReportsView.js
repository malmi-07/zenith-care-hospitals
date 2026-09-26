import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  BarChart3, TrendingUp, Users, DollarSign, 
  Calendar, PieChart
} from 'lucide-react';

function ReportsView() {
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/analytics'),
      api.get('/reports/dashboard')
    ]).then(([aRes, sRes]) => {
      setAnalytics(aRes.data);
      setStats(sRes.data);
    }).catch(err => console.error('Reports fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Overview Stat Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Patient Admissions</span>
            <div className="kpi-icon-wrap kpi-icon-blue"><Users size={20} /></div>
          </div>
          <div className="kpi-value">{stats?.totalPatients || 0}</div>
          <div className="kpi-footer"><span>Registered Inpatients & Outpatients</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Gross Revenue</span>
            <div className="kpi-icon-wrap kpi-icon-emerald"><DollarSign size={20} /></div>
          </div>
          <div className="kpi-value">Rs. {Number(stats?.totalRevenue || 0).toLocaleString()}</div>
          <div className="kpi-footer"><span>Cumulative hospital collections</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Consultations</span>
            <div className="kpi-icon-wrap kpi-icon-teal"><Calendar size={20} /></div>
          </div>
          <div className="kpi-value">{stats?.totalAppointments || 0}</div>
          <div className="kpi-footer"><span>Total clinical appointments</span></div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Laboratory Volume</span>
            <div className="kpi-icon-wrap kpi-icon-purple"><BarChart3 size={20} /></div>
          </div>
          <div className="kpi-value">{stats?.labRequests || 0}</div>
          <div className="kpi-footer"><span>Diagnostic test orders</span></div>
        </div>
      </div>

      {/* Reports Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Department Volume Report */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={18} color="var(--primary)" />
              <span>Departmental Clinical Caseload</span>
            </div>
          </div>
          <div style={{ padding: '24px' }}>
            {analytics?.departmentBreakdown?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {analytics.departmentBreakdown.map((dept, idx) => {
                  const maxCount = Math.max(...analytics.departmentBreakdown.map(d => d.appointment_count), 1);
                  const pct = Math.round((dept.appointment_count / maxCount) * 100);
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 600 }}>{dept.department}</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          {dept.appointment_count} consultations
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 10, background: 'var(--slate-100)', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${Math.max(pct, 8)}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #0284c7 0%, #0d9488 100%)',
                          borderRadius: 6,
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--slate-400)', textAlign: 'center' }}>No department activity recorded.</p>
            )}
          </div>
        </div>

        {/* Patient Demographics */}
        <div className="content-card">
          <div className="card-header">
            <div className="card-title">
              <PieChart size={18} color="var(--secondary)" />
              <span>Patient Demographics & Patient Registry</span>
            </div>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--slate-50)', borderRadius: 8 }}>
                <span style={{ fontWeight: 600 }}>Male Inpatients / Outpatients:</span>
                <span style={{ fontWeight: 700 }}>
                  {analytics?.genderDistribution?.find(g => g.gender === 'M')?.count || 0}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--slate-50)', borderRadius: 8 }}>
                <span style={{ fontWeight: 600 }}>Female Inpatients / Outpatients:</span>
                <span style={{ fontWeight: 700 }}>
                  {analytics?.genderDistribution?.find(g => g.gender === 'F')?.count || 0}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--slate-50)', borderRadius: 8 }}>
                <span style={{ fontWeight: 600 }}>Pharmacy Inventory Monitored:</span>
                <span style={{ fontWeight: 700 }}>{stats?.totalMedicines || 0} SKUs</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--slate-50)', borderRadius: 8 }}>
                <span style={{ fontWeight: 600 }}>Hospital Personnel Active:</span>
                <span style={{ fontWeight: 700 }}>{stats?.totalStaff || 0} staff</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsView;
