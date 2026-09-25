import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  CreditCard, Plus, Search, DollarSign, Printer, 
  CheckCircle2, Clock, Trash2, X, Check, AlertCircle, FileText
} from 'lucide-react';

function BillingView({ initialOpenAdd = false }) {
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(initialOpenAdd);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [payModalBill, setPayModalBill] = useState(null);
  const [payMethod, setPayMethod] = useState('Cash');

  // Form State
  const [formData, setFormData] = useState({
    patientId: '',
    amount: '',
    chargeType: 'Consultation',
    description: '',
    paymentMethod: 'Cash'
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchBills = () => {
    setLoading(true);
    api.get('/billing')
      .then(res => setBills(res.data))
      .catch(err => console.error('fetchBills error:', err))
      .finally(() => setLoading(false));

    api.get('/billing/summary')
      .then(res => setSummary(res.data))
      .catch(err => console.error('fetchSummary error:', err));
  };

  useEffect(() => {
    fetchBills();
    api.get('/patients').then(res => {
      setPatients(res.data);
      if (res.data.length > 0 && !formData.patientId) {
        setFormData(prev => ({ ...prev, patientId: res.data[0].id }));
      }
    }).catch(e => console.error(e));
  }, []);

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (!formData.patientId || !formData.amount) {
      setError('Patient and Amount are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/billing', formData);
      setShowAddModal(false);
      fetchBills();
    } catch (err) {
      console.error('Create bill error:', err);
      setError(err.response?.data?.message || 'Error generating invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/billing/${payModalBill.id}/pay`, { paymentMethod: payMethod });
      setPayModalBill(null);
      fetchBills();
    } catch (err) {
      console.error('Pay error:', err);
    }
  };

  const handleDeleteBill = async (id) => {
    if (window.confirm('Delete this invoice?')) {
      try {
        await api.delete(`/billing/${id}`);
        fetchBills();
      } catch (err) {
        console.error('Delete invoice error:', err);
      }
    }
  };

  const filteredBills = bills.filter(b => {
    const matchesStatus = statusFilter === 'All' || b.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch = !search ||
      b.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      (b.invoice_number && b.invoice_number.toLowerCase().includes(search.toLowerCase())) ||
      (b.description && b.description.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="animate-fade-in">
      {/* Revenue Mini KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 22 }}>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Total Collected</span>
            <div className="kpi-icon-wrap kpi-icon-emerald">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="kpi-value">Rs. {Number(summary?.total_collected || 0).toLocaleString()}</div>
          <div className="kpi-footer">
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>Settled Invoices</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Pending Receivables</span>
            <div className="kpi-icon-wrap kpi-icon-amber">
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#d97706' }}>
            Rs. {Number(summary?.total_pending || 0).toLocaleString()}
          </div>
          <div className="kpi-footer">
            <span>Awaiting patient checkout</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-title">Today's Settlements</span>
            <div className="kpi-icon-wrap kpi-icon-blue">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="kpi-value">Rs. {Number(summary?.today_revenue || 0).toLocaleString()}</div>
          <div className="kpi-footer">
            <span>Cash & card receipts today</span>
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <div className="card-title">
            <CreditCard size={20} color="var(--primary)" />
            <span>Billing, Invoicing & Patient Receipts</span>
            <span className="badge badge-info" style={{ marginLeft: 8 }}>{bills.length} Invoices</span>
          </div>

          <div className="card-actions">
            {/* Status Filter */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'Paid', 'Pending'].map(st => (
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

            <div className="search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search invoice #, patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
              <Plus size={15} />
              <span>Generate Bill</span>
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Patient Details</th>
                <th>Charge Type</th>
                <th>Service Description</th>
                <th>Billed Amount</th>
                <th>Payment Mode</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length > 0 ? (
                filteredBills.map(b => {
                  const isPaid = b.status?.toLowerCase() === 'paid';
                  return (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 700, color: 'var(--slate-800)', fontSize: '0.82rem' }}>
                        {b.invoice_number || `#INV-${b.id}`}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.patient_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>{b.patient_phone || 'N/A'}</div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{b.charge_type || 'Consultation'}</span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--slate-600)', maxWidth: 220 }}>
                        {b.description || 'Clinical care fee'}
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--slate-900)' }}>
                        Rs. {Number(b.amount).toLocaleString()}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {isPaid ? (b.payment_method || 'Cash') : '—'}
                      </td>
                      <td>
                        <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {!isPaid ? (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ padding: '4px 9px', fontSize: '0.76rem' }}
                              onClick={() => {
                                setPayModalBill(b);
                                setPayMethod('Cash');
                              }}
                            >
                              <span>Receive Payment</span>
                            </button>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 9px', fontSize: '0.76rem' }}
                              onClick={() => setSelectedReceipt(b)}
                              title="Print Receipt"
                            >
                              <Printer size={13} />
                              <span>Receipt</span>
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-icon btn-sm"
                            onClick={() => handleDeleteBill(b.id)}
                            title="Delete invoice"
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
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>
                    {loading ? 'Fetching invoice history...' : 'No bills found matching query.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Bill Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Generate Patient Invoice</h3>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBill}>
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
                    <option value="">-- Select Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name} (#{p.id})</option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Service / Charge Category *</label>
                    <select
                      className="form-select"
                      value={formData.chargeType}
                      onChange={(e) => setFormData({ ...formData, chargeType: e.target.value })}
                    >
                      <option value="Consultation">Consultation Charges</option>
                      <option value="Laboratory">Laboratory Charges</option>
                      <option value="Pharmacy">Pharmacy Medication</option>
                      <option value="Admission">Hospital Admission / Bed Fee</option>
                      <option value="Surgery">Procedure / Surgery</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total Amount (Rs.) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="e.g. 2500"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Itemized Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Specialist consultation fee - Dr. Sarah Perera"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {payModalBill && (
        <div className="modal-overlay" onClick={() => setPayModalBill(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Record Payment for {payModalBill.invoice_number}</h3>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setPayModalBill(null)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <div style={{ background: 'var(--slate-50)', padding: 14, borderRadius: 8, marginBottom: 16 }}>
                  <div>Patient: <strong>{payModalBill.patient_name}</strong></div>
                  <div>Description: <strong>{payModalBill.description}</strong></div>
                  <div style={{ marginTop: 6, fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                    Amount Due: Rs. {Number(payModalBill.amount).toLocaleString()}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Payment Method</label>
                  <select
                    className="form-select"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                  >
                    <option value="Cash">Cash at Counter</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                    <option value="Medical Insurance">Insurance Coverage</option>
                    <option value="Bank Wire Transfer">Online / Bank Wire</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPayModalBill(null)}>Cancel</button>
                <button type="submit" className="btn btn-success">
                  <Check size={16} />
                  <span>Confirm Receipt & Mark Paid</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice Receipt Modal (Section 7 Spec) */}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="modal-dialog" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header no-print">
              <h3 className="modal-title">Official Payment Receipt</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                  <Printer size={14} />
                  <span>Print Receipt</span>
                </button>
                <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setSelectedReceipt(null)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="modal-body printable-receipt">
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--slate-900)', paddingBottom: 12, marginBottom: 20 }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--slate-900)' }}>
                  MEDICARE GENERAL HOSPITAL
                </h1>
                <p style={{ fontSize: '0.82rem', color: 'var(--slate-600)' }}>
                  128 Health Avenue, Colombo 07 • Tel: +94 11 234 5678
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginTop: 2 }}>
                  Hospital Registration No: HMS-PV-99201
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: '0.85rem' }}>
                <div>
                  <div><strong>Billed To:</strong> {selectedReceipt.patient_name}</div>
                  <div><strong>Patient ID:</strong> #PT-{selectedReceipt.patient_id}</div>
                  <div><strong>Contact:</strong> {selectedReceipt.patient_phone || 'N/A'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div><strong>Receipt No:</strong> {selectedReceipt.invoice_number || `#INV-${selectedReceipt.id}`}</div>
                  <div><strong>Date:</strong> {new Date(selectedReceipt.created_at).toLocaleDateString()}</div>
                  <div><strong>Status:</strong> <span className="badge badge-success">PAID</span></div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--slate-300)', background: 'var(--slate-50)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 10px' }}>Item & Service Description</th>
                    <th style={{ textAlign: 'center', padding: '8px 10px' }}>Category</th>
                    <th style={{ textAlign: 'right', padding: '8px 10px' }}>Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--slate-200)' }}>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ fontWeight: 600 }}>{selectedReceipt.description || 'Clinical Care Services'}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 10px' }}>
                      {selectedReceipt.charge_type || 'Consultation'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px 10px', fontWeight: 600 }}>
                      Rs. {Number(selectedReceipt.amount).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'right', padding: '12px 10px', fontWeight: 700 }}>
                      TOTAL SETTLED:
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px 10px', fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
                      Rs. {Number(selectedReceipt.amount).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div style={{ fontSize: '0.8rem', color: 'var(--slate-600)', background: 'var(--slate-50)', padding: 10, borderRadius: 6, marginBottom: 20 }}>
                Payment Method: <strong>{selectedReceipt.payment_method || 'Cash'}</strong> • Payment processed and authenticated electronically.
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--slate-300)', paddingTop: 24, marginTop: 24, fontSize: '0.78rem' }}>
                <div>Computer-generated invoice. No physical signature required.</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ borderBottom: '1px solid var(--slate-800)', width: 140, marginBottom: 4 }}></div>
                  <span>Hospital Cashier</span>
                </div>
              </div>
            </div>

            <div className="modal-footer no-print">
              <button className="btn btn-secondary" onClick={() => setSelectedReceipt(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingView;
