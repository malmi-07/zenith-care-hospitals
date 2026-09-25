const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser, getAllRoles, getDemoUsers } = require('../models/User');

async function register(req, res) {
  try {
    const { fullName, email, password, roleId } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required' });
    }

    const existing = await findUserByEmail(email);
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await createUser(fullName, email, passwordHash, roleId || 4);

    const user = await findUserByEmail(email);

    const token = jwt.sign(
      { id: user.id, roleId: user.role_id, roleName: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        roleId: user.role_id,
        roleName: user.role_name
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: 'No account found with this email address' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect password entered' });

    const token = jwt.sign(
      { id: user.id, roleId: user.role_id, roleName: user.role_name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        roleId: user.role_id,
        roleName: user.role_name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
}

async function getRoles(req, res) {
  try {
    const roles = await getAllRoles();
    res.json(roles);
  } catch (err) {
    console.error('Get roles error:', err);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
}

async function getDemoAccounts(req, res) {
  try {
    const demos = await getDemoUsers();
    res.json(demos);
  } catch (err) {
    console.error('Demo accounts error:', err);
    res.status(500).json({ message: 'Failed to fetch demo accounts' });
  }
}

module.exports = { register, login, getRoles, getDemoAccounts };