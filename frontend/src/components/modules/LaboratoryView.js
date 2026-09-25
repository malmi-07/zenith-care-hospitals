import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  TestTube, Plus, Search, CheckCircle2, Clock, 
  FileText, X, Check, AlertCircle, Printer
} from 'lucide-react';

function LaboratoryView({ initialOpenAdd = false }) {
  const [tests, setTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(initialOpenAdd);
  const [resultModalTest, setResultModalTest] = useState(null);
  const [resultText, setResultText] = useState('');
  const [reportModalTest, setReportModalTest] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    testName: '',
    category: 'Biochemistry',
    cost: 1500
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchTests = () => {
    setLoading(true);
    api.get('/laboratory')
      .then(res => setTests(res.data))
      .catch(err => console.error('fetchTests error:', err))
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
    fetchTests();
    fetchDependencies();
  }, []);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.testName.trim()) {
      setError('Patient and Test Name are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/laboratory', formData);
      setShowRequestModal(false);
      fetchTests();
    } catch (err) {
      console.error('Request lab test error:', err);
      setError(err.response?.data?.message || 'Error requesting test');
    } finally {
      setSaving(false);
    }
  };

  const handleSampleStatusUpdate = async (id, sampleStatus) => {
    try {
      await api.put(`/laboratory/${id}/sample`, { sampleStatus });
      fetchTests();
    } catch (err) {
      console.error('Update sample status error:', err);
    }
  };

  const handleSaveResult = async (e) => {
    e.preventDefault();
    if (!resultText.trim()) return;
    try {
      await api.put(`/laboratory/${resultModalTest.id}/result`, { result: resultText, status: 'Completed' });
      setResultModalTest(null);
      setResultText('');
      fetchTests();
    } catch (err) {
      console.error('Save result error:', err);
    }
  };

  const filteredTests = tests.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.test_name?.toLowerCase().includes(s) ||
      t.patient_name?.toLowerCase().includes(s) ||
      t.category?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="animate-fade-in">
      <div className="content-card">
        <div className="card-header">
          <div className="card-title">
            <TestTube size={20} color="var(--primary)" />
            <span>Pathology & Laboratory Diagnostic Services</span>
            <span className="badge badge-info" style={{ marginLeft: 8 }}>{tests.length} Requests</span>
          </div>

          <div className="card-actions">
            <div className="search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search test, patient, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="btn btn-primary btn-sm" onClick={() => setShowRequestModal(true)}>
              <Plus size={15} />
              <span>Order Lab Test</span>
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Test ID</th>
                <th>Patient Details</th>
                <th>Investigation Name</th>
                <th>Category</th>
                <th>Sample Status</th>
                <th>Charge</th>
                <th>Test Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTests.length > 0 ? (
                filteredTests.map(t => {
                  const isDone = t.status?.toLowerCase() === 'completed';
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 700, color: 'var(--slate-500)', fontSize: '0.8rem' }}>
                        #LAB-{String(t.id).padStart(4, '0')}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{t.patient_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>{t.patient_phone || 'Ref doc: ' + (t.doctor_name || 'OPD')}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.test_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                          Requested: {new Date(t.requested_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{t.category || 'Clinical'}</span>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding: '4px 8px', fontSize: '0.78rem', width: 120 }}
                          value={t.sample_status || 'Pending'}
                          onChange={(e) => handleSampleStatusUpdate(t.id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Collected">Collected</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Processed">Processed</option>
                        </select>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        Rs. {Number(t.cost || 0).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${isDone ? 'badge-success' : 'badge-warning'}`}>
                          {t.status || 'Requested'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {!isDone ? (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ padding: '4px 9px', fontSize: '0.76rem' }}
                              onClick={() => {
                                setResultModalTest(t);
                                setResultText(t.result || '');
                              }}
                            >
                              <span>Enter Result</span>
                            </button>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 9px', fontSize: '0.76rem' }}
                              onClick={() => setReportModalTest(t)}
                            >
                              <FileText size={13} />
                              <span>View Report</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>
                    {loading ? 'Fetching laboratory records...' : 'No lab test records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Lab Test Modal */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Order Pathology / Lab Investigation</h3>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowRequestModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert-box alert-danger">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Patient *</label>
                  <select
                    className="form-select"
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name} (#{p.id})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Referring Doctor</label>
                  <select
                    className="form-select"
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.full_name} ({d.specialization})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Test Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Full Blood Count, Serum Creatinine, HbA1c"
                    value={formData.testName}
                    onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Lab Category</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Hematology">Hematology</option>
                      <option value="Biochemistry">Biochemistry</option>
                      <option value="Microbiology">Microbiology</option>
                      <option value="Radiology">Radiology & Imaging</option>
                      <option value="Pathology">Pathology</option>
                      <option value="Immunology">Immunology</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fee / Cost (Rs.)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRequestModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Processing...' : (
                    <>
                      <Check size={16} />
                      <span>Submit Lab Order</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enter Result Modal */}
      {resultModalTest && (
        <div className="modal-overlay" onClick={() => setResultModalTest(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Enter Clinical Result: {resultModalTest.test_name}</h3>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setResultModalTest(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveResult}>
              <div className="modal-body">
                <div style={{ marginBottom: 14, fontSize: '0.86rem', color: 'var(--slate-600)' }}>
                  Patient: <strong>{resultModalTest.patient_name}</strong> | Category: <strong>{resultModalTest.category}</strong>
                </div>

                <div className="form-group">
                  <label className="form-label">Diagnostic Findings & Quantitative Values</label>
                  <textarea
                    className="form-textarea"
                    rows="5"
                    placeholder="e.g. Hemoglobin: 14.5 g/dL (Normal: 13.5-17.5)&#10;Platelets: 280,000 /uL&#10;WBC: 7,200 /uL. No atypical cells observed."
                    value={resultText}
                    onChange={(e) => setResultText(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setResultModalTest(null)}>Cancel</button>
                <button type="submit" className="btn btn-success">
                  <Check size={16} />
                  <span>Certify & Save Result</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Printable Report Modal */}
      {reportModalTest && (
        <div className="modal-overlay" onClick={() => setReportModalTest(null)}>
          <div className="modal-dialog" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Diagnostic Test Certificate</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                  <Printer size={14} />
                  <span>Print Report</span>
                </button>
                <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setReportModalTest(null)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="modal-body printable-receipt">
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--slate-800)', paddingBottom: 14, marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--slate-900)' }}>MEDICARE CENTRAL LABORATORY</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>Accredited Clinical Pathology & Diagnostic Center</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Reference ID: #LAB-{reportModalTest.id} | Date: {new Date(reportModalTest.requested_at).toLocaleDateString()}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: '0.85rem', marginBottom: 20, background: 'var(--slate-50)', padding: 12, borderRadius: 8 }}>
                <div><strong>Patient:</strong> {reportModalTest.patient_name}</div>
                <div><strong>Test Category:</strong> {reportModalTest.category}</div>
                <div><strong>Investigation:</strong> {reportModalTest.test_name}</div>
                <div><strong>Status:</strong> <span className="badge badge-success">{reportModalTest.status}</span></div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 8 }}>DIAGNOSTIC TEST FINDINGS:</h4>
                <div style={{ 
                  background: '#ffffff', 
                  border: '1px solid var(--slate-200)', 
                  borderRadius: 8, 
                  padding: 16, 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'monospace',
                  fontSize: '0.88rem',
                  lineHeight: 1.6
                }}>
                  {reportModalTest.result || 'No detailed result notes attached.'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--slate-300)', paddingTop: 20, marginTop: 30, fontSize: '0.8rem' }}>
                <div>Verified by Laboratory Technologist</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ borderBottom: '1px solid var(--slate-800)', width: 140, marginBottom: 4 }}></div>
                  <span>Authorized Signature</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setReportModalTest(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LaboratoryView;
