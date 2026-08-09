const API_BASE = '/api';

export interface AuthUser {
  user_id: string;
  role: 'admin' | 'dho' | 'phc' | 'asha';
  full_name: string;
  access_token: string;
}

export function saveAuth(auth: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('swastai_auth', JSON.stringify(auth));
}

export function getAuth(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('swastai_auth');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return getAuth()?.access_token ?? null;
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('swastai_auth');
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export function getDashboardRoute(role: string): string {
  switch (role) {
    case 'asha': return '/dashboard/asha';
    case 'phc': return '/dashboard/phc';
    case 'dho': return '/dashboard/dho';
    case 'admin': return '/dashboard/admin';
    default: return '/';
  }
}

// Sign up
export async function apiSignup(payload: {
  email: string;
  password: string;
  full_name: string;
  role: string;
  sub_district?: string;
  village?: string;
  facility_name?: string;
  district?: string;
}) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Signup failed');
  }
  return res.json();
}

// Login
export async function apiLogin(email: string, password: string) {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}
