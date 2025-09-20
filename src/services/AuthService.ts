// src/services/AuthService.ts
// Lightweight fetch-based auth client for the Actium CRM Artai API

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  role?: string;
};

export type LoginParams = { ident: string; password: string };
export type RegisterParams = { username: string; email: string; password: string };

const API_BASE = 'https://crm.actium.ro/api/artai';
const TOKEN_KEY = 'artai_token';

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : (await res.text());
  if (!res.ok) {
    const message = (isJson && (data as any)?.message) || res.statusText || 'Request error';
    throw new Error(message);
  }
  return data as T;
}

export const AuthService = {
  getToken,
  setToken,

  async register({ username, email, password }: RegisterParams): Promise<{ message: string; token: string; user: AuthUser }>
  {
    const result = await http<{ message: string; token: string; user: AuthUser }>(
      '/register',
      {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      }
    );
    if (result?.token) setToken(result.token);
    return result;
  },

  async login({ ident, password }: LoginParams): Promise<{ message: string; token: string; user: AuthUser }>
  {
    const result = await http<{ message: string; token: string; user: AuthUser }>(
      '/login',
      {
        method: 'POST',
        body: JSON.stringify({ ident, password }),
      }
    );
    if (result?.token) setToken(result.token);
    return result;
  },

  async logout(): Promise<{ message: string }>
  {
    const result = await http<{ message: string }>(
      '/logout',
      {
        method: 'POST',
      }
    );
    // Clear locally regardless of server response
    setToken(null);
    return result;
  },

  async getUser(): Promise<{ user: AuthUser }>
  {
    return http<{ user: AuthUser }>(
      '/user',
      {
        method: 'GET',
      }
    );
  },

  async updateUser(patch: Partial<{ username: string; email: string; password: string; role: string }>): Promise<{ message: string; user: AuthUser }>
  {
    return http<{ message: string; user: AuthUser }>(
      '/user',
      {
        method: 'POST',
        body: JSON.stringify(patch),
      }
    );
  },
};

export default AuthService;
