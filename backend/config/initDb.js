const { poolPromise } = require('./db');
const bcrypt = require('bcryptjs');

async function initDb() {
  try {
    const pool = await poolPromise;
    if (!pool) {
      console.error('Database connection not established.');
      return;
    }

    console.log('Initializing PostgreSQL database schema and seed data...');

    // 1. Roles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
      );
    `);

    // Ensure all 7 roles exist
    const roles = [
      'Admin',
      'Doctor',
      'Nurse',
      'Receptionist',
      'Pharmacist',
      'Accountant',
      'Laboratory Staff'
    ];

    for (const roleName of roles) {
      await pool.request()
        .input('name', roleName)
        .query(`
          INSERT INTO roles (name) VALUES (@name)
          ON CONFLICT (name) DO NOTHING;
        `);
    }

    // 2. Departments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description VARCHAR(255) NULL
      );
      ALTER TABLE departments ADD COLUMN IF NOT EXISTS description VARCHAR(255) NULL;
    `);

    const departments = [
      { name: 'Cardiology', description: 'Heart and cardiovascular system care' },
      { name: 'General Medicine', description: 'Primary care and internal medicine' },
      { name: 'Pediatrics', description: 'Infant, child, and adolescent healthcare' },
      { name: 'Orthopedics', description: 'Musculoskeletal system surgery and therapy' },
      { name: 'Neurology', description: 'Brain, spinal cord, and nerve disorders' },
      { name: 'Radiology & Imaging', description: 'Diagnostic imaging and scans' }
    ];

    for (const dept of departments) {
      await pool.request()
        .input('name', dept.name)
        .input('desc', dept.description)
        .query(`
          INSERT INTO departments (name, description) VALUES (@name, @desc)
          ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;
        `);
    }

    // 3. Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role_id INT REFERENCES roles(id),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed or update demo accounts for quick testing
    const defaultPasswordHash = await bcrypt.hash('admin123', 10);
    const demoAccounts = [
      { name: 'Admin User', email: 'admin@hms.com', role: 'Admin', password: 'admin123' },
      { name: 'Dr. Sarah Perera', email: 'sarah@hms.com', role: 'Doctor', password: 'admin123' },
      { name: 'Dr. David Silva', email: 'david@hms.com', role: 'Doctor', password: 'admin123' },
      { name: 'Nurse Emily Rose', email: 'emily@hms.com', role: 'Nurse', password: 'admin123' },
      { name: 'Receptionist John', email: 'reception@hms.com', role: 'Receptionist', password: 'admin123' },
      { name: 'Pharmacist Liam', email: 'pharmacy@hms.com', role: 'Pharmacist', password: 'admin123' },
      { name: 'Accountant Maya', email: 'billing@hms.com', role: 'Accountant', password: 'admin123' },
      { name: 'Lab Tech Alex', email: 'lab@hms.com', role: 'Laboratory Staff', password: 'admin123' }
    ];

    for (const demo of demoAccounts) {
      const roleRes = await pool.request()
        .input('rName', demo.role)
        .query('SELECT id FROM roles WHERE name = @rName');
      const roleId = roleRes.recordset[0]?.id;

      if (roleId) {
        const hash = await bcrypt.hash(demo.password, 10);
        await pool.request()
          .input('name', demo.name)
          .input('email', demo.email)
          .input('hash', hash)
          .input('roleId', roleId)
          .query(`
            INSERT INTO users (full_name, email, password_hash, role_id)
            VALUES (@name, @email, @hash, @roleId)
            ON CONFLICT (email) DO UPDATE
            SET full_name = EXCLUDED.full_name, password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id;
          `);
      }
    }

    // Also update existing admin@test.com if present
    await pool.request()
      .input('hash', defaultPasswordHash)
      .query(`
        UPDATE users SET password_hash = @hash WHERE email = 'admin@test.com';
      `);

    // 4. Patients table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        dob DATE NULL,
        gender VARCHAR(10) NULL,
        phone VARCHAR(20) NULL,
        address VARCHAR(255) NULL,
        blood_group VARCHAR(10) NULL,
        emergency_contact VARCHAR(50) NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10) NULL;
      ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(50) NULL;
    `);

    // Seed sample patients if less than 3
    const patCount = await pool.query('SELECT COUNT(*) AS count FROM patients');
    if (parseInt(patCount.recordset[0].count, 10) < 3) {
      await pool.query(`
        INSERT INTO patients (full_name, dob, gender, phone, address, blood_group, emergency_contact) VALUES
        ('Amara Wickrama', '1985-11-20', 'F', '0718882233', '45 Galle Rd, Colombo', 'A+', '0714445552'),
        ('Michael Chang', '1978-03-10', 'M', '0765551122', '88 Hill St, Nuwara Eliya', 'B+', '0763332211');
      `);
    }

    // 5. Doctors table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        department_id INT REFERENCES departments(id),
        specialization VARCHAR(100) NULL,
        schedule TEXT NULL
      );
    `);

    // Seed doctors linking to Dr. Sarah and Dr. David
    const docUsers = await pool.query(`
      SELECT u.id, u.email FROM users u WHERE u.email IN ('sarah@hms.com', 'david@hms.com')
    `);

    for (const dUser of docUsers.recordset) {
      const isCardio = dUser.email === 'sarah@hms.com';
      const spec = isCardio ? 'Chief Cardiologist' : 'Lead Pediatrician';
      const sched = isCardio ? 'Mon-Fri 09:00 AM - 04:00 PM' : 'Mon-Sat 10:00 AM - 05:00 PM';
      const deptId = isCardio ? 1 : 3;

      await pool.request()
        .input('userId', dUser.id)
        .input('deptId', deptId)
        .input('spec', spec)
        .input('sched', sched)
        .query(`
          INSERT INTO doctors (user_id, department_id, specialization, schedule)
          VALUES (@userId, @deptId, @spec, @sched)
          ON CONFLICT DO NOTHING;
        `);
    }

    // 6. Appointments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES patients(id),
        doctor_id INT REFERENCES doctors(id),
        appointment_date TIMESTAMPTZ NOT NULL,
        status VARCHAR(20) DEFAULT 'Scheduled',
        notes VARCHAR(255) NULL
      );
      ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes VARCHAR(255) NULL;
    `);

    // 7. Medical Records (EMR) table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medical_records (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES patients(id),
        doctor_id INT REFERENCES doctors(id),
        diagnosis TEXT NULL,
        prescription TEXT NULL,
        treatment_history TEXT NULL,
        visit_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS treatment_history TEXT NULL;
    `);

    // Seed sample medical record if empty
    const mrCount = await pool.query('SELECT COUNT(*) AS count FROM medical_records');
    if (parseInt(mrCount.recordset[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO medical_records (patient_id, doctor_id, diagnosis, prescription, treatment_history, visit_date)
        VALUES (
          1, 1,
          'Hypertension Stage 1, mild arrhythmia detected.',
          'Amlodipine 5mg once daily; Aspirin 75mg daily after food.',
          'Follow-up scheduled in 4 weeks. Advised low-sodium diet and daily walking.',
          CURRENT_TIMESTAMP
        );
      `);
    }

    // 8. Laboratory Tests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS laboratory_tests (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES patients(id),
        doctor_id INT NULL,
        test_name VARCHAR(150) NOT NULL,
        category VARCHAR(100) DEFAULT 'Biochemistry',
        sample_status VARCHAR(50) DEFAULT 'Pending',
        result TEXT NULL,
        status VARCHAR(30) DEFAULT 'Requested',
        cost DECIMAL(10,2) DEFAULT 1500.00,
        requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMPTZ NULL
      );
    `);

    // Seed sample lab tests if empty
    const labCount = await pool.query('SELECT COUNT(*) AS count FROM laboratory_tests');
    if (parseInt(labCount.recordset[0].count, 10) === 0) {
      const pats = await pool.query('SELECT id FROM patients ORDER BY id ASC LIMIT 3');
      const p1 = pats.recordset[0]?.id || 1;
      const p2 = pats.recordset[1]?.id || p1;
      const p3 = pats.recordset[2]?.id || p1;

      await pool.request()
        .input('p1', p1)
        .input('p2', p2)
        .input('p3', p3)
        .query(`
          INSERT INTO laboratory_tests (patient_id, doctor_id, test_name, category, sample_status, result, status, cost, requested_at)
          VALUES
          (@p1, 1, 'Full Blood Count (FBC)', 'Hematology', 'Collected', 'Hemoglobin 14.2 g/dL, WBC 6,800 /uL, Platelets 260,000 /uL. All normal.', 'Completed', 1200.00, CURRENT_TIMESTAMP - INTERVAL '5 hours'),
          (@p2, 1, 'Lipid Profile', 'Biochemistry', 'Pending', NULL, 'In Progress', 2500.00, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
          (@p3, 2, 'Chest X-Ray Digital', 'Radiology', 'Completed', 'Clear lung fields, cardiac contour within normal limits.', 'Completed', 3500.00, CURRENT_TIMESTAMP - INTERVAL '1 day');
        `);
    }

    // 9. Pharmacy Inventory table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pharmacy_inventory (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        generic_name VARCHAR(150) NULL,
        category VARCHAR(100) NULL,
        dosage VARCHAR(50) NULL,
        stock_quantity INT DEFAULT 0,
        unit_price DECIMAL(10,2) DEFAULT 0.00,
        expiry_date DATE NOT NULL,
        reorder_level INT DEFAULT 20,
        supplier VARCHAR(100) NULL
      );
    `);

    // Seed sample pharmacy drugs if empty
    const pharmCount = await pool.query('SELECT COUNT(*) AS count FROM pharmacy_inventory');
    if (parseInt(pharmCount.recordset[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO pharmacy_inventory (name, generic_name, category, dosage, stock_quantity, unit_price, expiry_date, reorder_level, supplier)
        VALUES
        ('Amoxil 500mg', 'Amoxicillin', 'Antibiotics', '500mg Capsule', 150, 45.00, '2027-08-30', 30, 'PharmaCare Ltd'),
        ('Panadol Actifast', 'Paracetamol', 'Analgesic', '500mg Tablet', 320, 15.00, '2028-01-15', 50, 'GlaxoSmithKline'),
        ('Lipitor 20mg', 'Atorvastatin', 'Cardiovascular', '20mg Tablet', 18, 85.00, '2026-11-20', 25, 'Pfizer Labs'),
        ('Ventolin Inhaler', 'Salbutamol', 'Respiratory', '100mcg Evohaler', 8, 950.00, '2026-10-10', 15, 'Cipla'),
        ('Glucophage 500mg', 'Metformin HCl', 'Antidiabetic', '500mg Tablet', 240, 22.50, '2027-12-05', 40, 'Merck');
      `);
    }

    // 10. Billing table & Payment tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS billing (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES patients(id),
        invoice_number VARCHAR(50) NULL,
        amount DECIMAL(10,2) NOT NULL,
        description VARCHAR(255) NULL,
        charge_type VARCHAR(50) DEFAULT 'Consultation',
        status VARCHAR(20) DEFAULT 'Pending',
        payment_method VARCHAR(50) DEFAULT 'Cash',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMPTZ NULL
      );
      ALTER TABLE billing ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50) NULL;
      ALTER TABLE billing ADD COLUMN IF NOT EXISTS charge_type VARCHAR(50) DEFAULT 'Consultation';
      ALTER TABLE billing ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'Cash';
      ALTER TABLE billing ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ NULL;
    `);

    // 11. Staff Management table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        department_id INT REFERENCES departments(id),
        email VARCHAR(100) NULL,
        phone VARCHAR(20) NULL,
        join_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(20) DEFAULT 'Active'
      );
    `);

    // 12. Staff Attendance table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_attendance (
        id SERIAL PRIMARY KEY,
        staff_id INT REFERENCES staff(id),
        date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(20) DEFAULT 'Present',
        check_in VARCHAR(10) NULL,
        check_out VARCHAR(10) NULL
      );
    `);

    // 13. Staff Leaves table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_leaves (
        id SERIAL PRIMARY KEY,
        staff_id INT REFERENCES staff(id),
        leave_type VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason VARCHAR(255) NULL,
        status VARCHAR(20) DEFAULT 'Pending'
      );
    `);

    // Seed staff if empty
    const staffCount = await pool.query('SELECT COUNT(*) AS count FROM staff');
    if (parseInt(staffCount.recordset[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO staff (full_name, role, department_id, email, phone, join_date, status)
        VALUES
        ('Dr. Sarah Perera', 'Chief Doctor', 1, 'sarah@hms.com', '0771122334', '2023-01-15', 'Active'),
        ('Nurse Emily Rose', 'Head Nurse', 2, 'emily@hms.com', '0772233445', '2023-03-01', 'Active'),
        ('Liam Fernando', 'Senior Pharmacist', 2, 'pharmacy@hms.com', '0773344556', '2023-06-10', 'Active'),
        ('Maya Senanayake', 'Chief Accountant', 2, 'billing@hms.com', '0774455667', '2023-04-20', 'Active'),
        ('Alex Perera', 'Senior Lab Technologist', 6, 'lab@hms.com', '0775566778', '2023-08-15', 'Active');
      `);
    }

    console.log('PostgreSQL database initialization and seeding completed successfully!');
  } catch (err) {
    console.error('Error during PostgreSQL database initialization:', err);
  }
}

module.exports = { initDb };
