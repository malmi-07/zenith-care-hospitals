const Billing = require('../models/Billing');

async function getBills(req, res) {
  try {
    const bills = await Billing.getAllBills();
    res.json(bills);
  } catch (err) {
    console.error('getBills error:', err);
    res.status(500).json({ message: 'Server error fetching bills' });
  }
}

async function getBill(req, res) {
  try {
    const bill = await Billing.getBillById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    console.error('getBill error:', err);
    res.status(500).json({ message: 'Server error fetching bill' });
  }
}

async function getPatientBills(req, res) {
  try {
    const bills = await Billing.getBillsByPatient(req.params.patientId);
    res.json(bills);
  } catch (err) {
    console.error('getPatientBills error:', err);
    res.status(500).json({ message: 'Server error fetching patient bills' });
  }
}

async function generateBill(req, res) {
  try {
    const { patientId, amount, description, chargeType, paymentMethod } = req.body;
    if (!patientId || !amount) {
      return res.status(400).json({ message: 'Patient and Amount are required' });
    }
    const id = await Billing.createBill(patientId, amount, description, chargeType, paymentMethod);
    res.status(201).json({ message: 'Invoice generated successfully', id });
  } catch (err) {
    console.error('generateBill error:', err);
    res.status(500).json({ message: 'Server error generating bill' });
  }
}

async function payBill(req, res) {
  try {
    const { paymentMethod } = req.body;
    await Billing.markAsPaid(req.params.id, paymentMethod || 'Cash');
    res.json({ message: 'Payment recorded successfully' });
  } catch (err) {
    console.error('payBill error:', err);
    res.status(500).json({ message: 'Server error recording payment' });
  }
}

async function removeBill(req, res) {
  try {
    await Billing.deleteBill(req.params.id);
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    console.error('removeBill error:', err);
    res.status(500).json({ message: 'Server error deleting invoice' });
  }
}

async function revenueSummary(req, res) {
  try {
    const summary = await Billing.getRevenueSummary();
    res.json(summary);
  } catch (err) {
    console.error('revenueSummary error:', err);
    res.status(500).json({ message: 'Server error fetching revenue summary' });
  }
}

module.exports = { getBills, getBill, getPatientBills, generateBill, payBill, removeBill, revenueSummary };