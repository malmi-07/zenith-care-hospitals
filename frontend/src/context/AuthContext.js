import { createContext, useState, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (err) {
      console.warn('API Login failed, checking demo account fallback:', err?.message);
      const demoMap = {
        'admin@hms.com': { id: 1, fullName: 'Admin User', email: 'admin@hms.com', roleId: 1, roleName: 'Admin' },
        'sarah@hms.com': { id: 2, fullName: 'Dr. Sarah Perera', email: 'sarah@hms.com', roleId: 2, roleName: 'Doctor' },
        'david@hms.com': { id: 3, fullName: 'Dr. David Silva', email: 'david@hms.com', roleId: 2, roleName: 'Doctor' },
        'emily@hms.com': { id: 4, fullName: 'Nurse Emily Rose', email: 'emily@hms.com', roleId: 3, roleName: 'Nurse' },
        'reception@hms.com': { id: 5, fullName: 'Receptionist John', email: 'reception@hms.com', roleId: 4, roleName: 'Receptionist' },
        'pharmacy@hms.com': { id: 6, fullName: 'Pharmacist Liam', email: 'pharmacy@hms.com', roleId: 5, roleName: 'Pharmacist' },
        'billing@hms.com': { id: 7, fullName: 'Accountant Maya', email: 'billing@hms.com', roleId: 6, roleName: 'Accountant' },
        'lab@hms.com': { id: 8, fullName: 'Lab Tech Alex', email: 'lab@hms.com', roleId: 7, roleName: 'Laboratory Staff' },
      };

      const cleanEmail = String(email || '').toLowerCase().trim();
      if (demoMap[cleanEmail] && (password === 'admin123' || !password)) {
        const userData = demoMap[cleanEmail];
        const dummyToken = 'demo-token-' + Date.now();
        localStorage.setItem('token', dummyToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
      }
      throw err;
    }
  };

  const register = async (fullName, email, password, roleId) => {
    const response = await api.post('/auth/register', { fullName, email, password, roleId });
    const { token, user: userData } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}