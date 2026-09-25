const { sql, poolPromise } = require('../config/db');

async function getInventory(req, res) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM pharmacy_inventory ORDER BY name ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('getInventory error:', err);
    res.status(500).json({ message: 'Server error fetching pharmacy inventory' });
  }
}

async function addMedicine(req, res) {
  try {
    const { name, genericName, category, dosage, stockQuantity, unitPrice, expiryDate, reorderLevel, supplier } = req.body;
    if (!name || !expiryDate) {
      return res.status(400).json({ message: 'Medicine name and expiry date are required' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('name', sql.VarChar, name)
      .input('generic_name', sql.VarChar, genericName || '')
      .input('category', sql.VarChar, category || 'General')
      .input('dosage', sql.VarChar, dosage || '')
      .input('stock_quantity', sql.Int, parseInt(stockQuantity) || 0)
      .input('unit_price', sql.Decimal(10, 2), parseFloat(unitPrice) || 0)
      .input('expiry_date', sql.Date, expiryDate)
      .input('reorder_level', sql.Int, parseInt(reorderLevel) || 20)
      .input('supplier', sql.VarChar, supplier || '')
      .query(`
        INSERT INTO pharmacy_inventory (name, generic_name, category, dosage, stock_quantity, unit_price, expiry_date, reorder_level, supplier)
        OUTPUT INSERTED.id
        VALUES (@name, @generic_name, @category, @dosage, @stock_quantity, @unit_price, @expiry_date, @reorder_level, @supplier)
      `);

    res.status(201).json({ message: 'Medicine added to inventory', id: result.recordset[0].id });
  } catch (err) {
    console.error('addMedicine error:', err);
    res.status(500).json({ message: 'Server error adding medicine' });
  }
}

async function updateStock(req, res) {
  try {
    const { change, newStock } = req.body;
    const pool = await poolPromise;

    if (newStock !== undefined) {
      await pool.request()
        .input('id', sql.Int, req.params.id)
        .input('stock', sql.Int, newStock)
        .query('UPDATE pharmacy_inventory SET stock_quantity = @stock WHERE id = @id');
    } else if (change !== undefined) {
      await pool.request()
        .input('id', sql.Int, req.params.id)
        .input('change', sql.Int, change)
        .query('UPDATE pharmacy_inventory SET stock_quantity = CASE WHEN stock_quantity + @change < 0 THEN 0 ELSE stock_quantity + @change END WHERE id = @id');
    }

    res.json({ message: 'Stock updated' });
  } catch (err) {
    console.error('updateStock error:', err);
    res.status(500).json({ message: 'Server error updating stock' });
  }
}

async function dispenseMedicine(req, res) {
  try {
    const { medicineId, quantity, patientId, notes } = req.body;
    const pool = await poolPromise;

    const med = await pool.request()
      .input('id', sql.Int, medicineId)
      .query('SELECT stock_quantity, name, unit_price FROM pharmacy_inventory WHERE id = @id');

    if (!med.recordset[0]) return res.status(404).json({ message: 'Medicine not found' });
    if (med.recordset[0].stock_quantity < quantity) {
      return res.status(400).json({ message: `Insufficient stock. Current available: ${med.recordset[0].stock_quantity}` });
    }

    // Deduct stock
    await pool.request()
      .input('id', sql.Int, medicineId)
      .input('qty', sql.Int, quantity)
      .query('UPDATE pharmacy_inventory SET stock_quantity = stock_quantity - @qty WHERE id = @id');

    // Optionally auto-record bill if patientId provided
    if (patientId) {
      const totalAmount = med.recordset[0].unit_price * quantity;
      await pool.request()
        .input('patient_id', sql.Int, patientId)
        .input('amount', sql.Decimal(10, 2), totalAmount)
        .input('desc', sql.VarChar, `Pharmacy: ${quantity}x ${med.recordset[0].name}`)
        .input('type', sql.VarChar, 'Pharmacy')
        .input('inv', sql.VarChar, `INV-PHARM-${Date.now().toString().slice(-6)}`)
        .query(`
          INSERT INTO billing (patient_id, amount, description, charge_type, invoice_number, status)
          VALUES (@patient_id, @amount, @desc, @type, @inv, 'Pending')
        `);
    }

    res.json({ message: `Dispensed ${quantity} units of ${med.recordset[0].name}` });
  } catch (err) {
    console.error('dispenseMedicine error:', err);
    res.status(500).json({ message: 'Server error dispensing medicine' });
  }
}

async function getPharmacyAlerts(req, res) {
  try {
    const pool = await poolPromise;
    const lowStock = await pool.request().query(`
      SELECT * FROM pharmacy_inventory 
      WHERE stock_quantity <= reorder_level
      ORDER BY stock_quantity ASC
    `);

    const expiringSoon = await pool.request().query(`
      SELECT * FROM pharmacy_inventory 
      WHERE expiry_date <= DATEADD(month, 3, GETDATE())
      ORDER BY expiry_date ASC
    `);

    res.json({
      lowStock: lowStock.recordset,
      expiringSoon: expiringSoon.recordset
    });
  } catch (err) {
    console.error('getPharmacyAlerts error:', err);
    res.status(500).json({ message: 'Server error fetching pharmacy alerts' });
  }
}

module.exports = { getInventory, addMedicine, updateStock, dispenseMedicine, getPharmacyAlerts };
