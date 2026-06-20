
import { User, SymptomRecord, Appointment } from '../types';

// Initial Mock Data (seeded if local storage is empty)
const INITIAL_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@medilens.com',
    role: 'admin'
  },
  {
    id: 'patient-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'patient',
    appointments: [],
    history: [
      {
        id: 'hist-1',
        date: '2025-11-15',
        summary: 'Mild headache and fatigue',
        guidance: 'Rest, hydration, and over-the-counter pain relief if needed. Monitor for worsening symptoms.',
        triageLevel: 'routine'
      }
    ]
  }
];

// Helper to get users from storage
const getUsers = (): User[] => {
  const stored = localStorage.getItem('medilens_users');
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize if empty
  localStorage.setItem('medilens_users', JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
};

// Helper to save users
const saveUsers = (users: User[]) => {
  localStorage.setItem('medilens_users', JSON.stringify(users));
};

export const login = async (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (user) {
        // Simple mock password check (In real app, hash passwords!)
        if (user.role === 'admin' && password === 'admin123') {
           resolve(user);
        } else if (user.role === 'patient') {
           // Accept any password for demo simplicity, or strictly 'password123'
           // Let's be permissive for the demo unless it's the specific mock user
           if (email === 'john@example.com' && password !== 'password123') {
             reject(new Error('Invalid credentials (try password123)'));
             return;
           }
           resolve(user);
        } else {
           reject(new Error('Invalid credentials'));
        }
      } else {
        reject(new Error('User not found. Please sign up.'));
      }
    }, 800);
  });
};

export const register = async (name: string, email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getUsers();
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        reject(new Error('Email already registered'));
        return;
      }
      
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        role: 'patient',
        appointments: [],
        history: []
      };
      
      users.push(newUser);
      saveUsers(users);
      resolve(newUser);
    }, 800);
  });
};

export const updateUser = async (updatedUser: User): Promise<void> => {
  return new Promise((resolve) => {
    const users = getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      saveUsers(users);
    }
    resolve();
  });
};

export const logout = async (): Promise<void> => {
  return Promise.resolve();
};
