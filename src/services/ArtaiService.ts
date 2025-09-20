// src/services/ArtaiService.ts
// Client for Artai Image/Category/Tags/Likes/Reference/Sessions/AI endpoints
// Uses the token from AuthService for Authorization

import AuthService from './AuthService';

const API_BASE = 'https://crm.actium.ro/api/artai';

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type ImageItem = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  file_path: string;
  status?: string | null;
  is_public?: boolean;
  category_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type ImageHistoryItem = {
  id: number;
  image_id: number;
  user_id: number;
  action: string;
  file_path: string | null;
  created_at?: string;
};

export type Category = {
  id: number;
  name: string;
  description?: string | null;
};

export type Tag = {
  id: number;
  name: string;
};

export type LikeInfo = {
  count: number;
  users: { id: number | null; username: string | null }[];
};

export type ReferenceImage = {
  id: number;
  user_id: number;
  file_path: string;
  description?: string | null;
  created_at?: string;
};

export type ArtaiSession = {
  id: number;
  user_id: number;
  started_at?: string | null;
  ended_at?: string | null;
  created_at?: string;
};

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = AuthService.getToken();
  const headers: Record<string, string> = {
    ...(extra as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function httpJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(init?.headers),
    },
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const message = (isJson && (data as any)?.message) || res.statusText || 'Request error';
    throw new Error(message);
  }
  return data as T;
}

async function httpForm<T>(path: string, form: FormData, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: form,
    ...init,
    headers: authHeaders(init?.headers), // Do NOT set content-type explicitly for FormData
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const message = (isJson && (data as any)?.message) || res.statusText || 'Request error';
    throw new Error(message);
  }
  return data as T;
}

export const ArtaiService = {
  // ===== Images =====
  listImages(params?: { public?: boolean; user_id?: number; category_id?: number; page?: number }): Promise<Paginated<ImageItem>> {
    const s = new URLSearchParams();
    if (params?.public !== undefined) s.set('public', String(params.public ? 1 : 0));
    if (params?.user_id !== undefined) s.set('user_id', String(params.user_id));
    if (params?.category_id !== undefined) s.set('category_id', String(params.category_id));
    if (params?.page !== undefined) s.set('page', String(params.page));
    const qs = s.toString();
    return httpJson<Paginated<ImageItem>>(`/images${qs ? `?${qs}` : ''}`);
  },

  getImage(id: number): Promise<ImageItem> {
    return httpJson<ImageItem>(`/images/${id}`);
  },

  createImage(input: {
    file: File;
    title?: string;
    description?: string;
    status?: string;
    is_public?: boolean;
    category_id?: number;
  }): Promise<{ message: string; image: ImageItem; url?: string }> {
    const fd = new FormData();
    fd.append('image', input.file);
    if (input.title) fd.append('title', input.title);
    if (input.description) fd.append('description', input.description);
    if (input.status) fd.append('status', input.status);
    if (input.is_public !== undefined) fd.append('is_public', String(input.is_public ? 1 : 0));
    if (input.category_id !== undefined) fd.append('category_id', String(input.category_id));
    return httpForm(`/images`, fd);
  },

  updateImage(id: number, input: {
    file?: File;
    title?: string;
    description?: string;
    status?: string;
    is_public?: boolean;
    category_id?: number | null;
  }): Promise<{ message: string; image: ImageItem }> {
    if (input.file) {
      const fd = new FormData();
      fd.append('image', input.file);
      if (input.title !== undefined) fd.append('title', String(input.title));
      if (input.description !== undefined) fd.append('description', String(input.description));
      if (input.status !== undefined) fd.append('status', String(input.status));
      if (input.is_public !== undefined) fd.append('is_public', String(input.is_public ? 1 : 0));
      if (input.category_id !== undefined && input.category_id !== null) fd.append('category_id', String(input.category_id));
      return httpForm(`/images/${id}`, fd);
    }
    // No file -> JSON
    const body: any = {};
    (['title','description','status'] as const).forEach((k) => {
      if (input[k] !== undefined) body[k] = input[k] as any;
    });
    if (input.is_public !== undefined) body.is_public = input.is_public;
    if (input.category_id !== undefined) body.category_id = input.category_id;
    return httpJson(`/images/${id}`, { method: 'POST', body: JSON.stringify(body) });
  },

  deleteImage(id: number): Promise<{ message: string }> {
    return httpJson(`/images-delete/${id}`, { method: 'POST' });
  },

  // ===== Image history =====
  getImageHistory(id: number): Promise<ImageHistoryItem[]> {
    return httpJson(`/images/${id}/history`);
  },

  addImageHistory(id: number, input: { action?: string; file?: File }): Promise<{ message: string; history: ImageHistoryItem; url?: string }> {
    const fd = new FormData();
    if (input.action) fd.append('action', input.action);
    if (input.file) fd.append('file', input.file);
    return httpForm(`/images/${id}/history`, fd);
  },

  // ===== Categories & Tags =====
  getCategories(): Promise<Category[]> {
    return httpJson(`/categories`);
  },

  createCategory(input: { name: string; description?: string }): Promise<{ message: string; category: Category }> {
    return httpJson(`/categories`, { method: 'POST', body: JSON.stringify(input) });
  },

  getTags(): Promise<Tag[]> {
    return httpJson(`/tags`);
  },

  createTag(input: { name: string }): Promise<{ message: string; tag: Tag }> {
    return httpJson(`/tags`, { method: 'POST', body: JSON.stringify(input) });
  },

  // ===== Image <-> Categories linking =====
  getImageCategories(imageId: number): Promise<{ image_id: number; categories: Category[] }> {
    return httpJson(`/images/${imageId}/categories`);
  },

  setImageCategories(imageId: number, categoryIds: number[] | string): Promise<{ message: string; image_id: number; categories: Category[]; count?: number }> {
    // Accept either an array of IDs or a comma-separated string
    const body = Array.isArray(categoryIds)
      ? { category_ids: categoryIds }
      : { categories: String(categoryIds) };
    return httpJson(`/images/${imageId}/categories`, { method: 'POST', body: JSON.stringify(body) });
  },

  // ===== Likes =====
  likeImage(id: number): Promise<{ message: string }> {
    return httpJson(`/images/${id}/like`, { method: 'POST' });
  },

  unlikeImage(id: number): Promise<{ message: string }> {
    return httpJson(`/images/${id}/unlike`, { method: 'POST' });
  },

  getImageLikes(id: number): Promise<LikeInfo> {
    return httpJson(`/images/${id}/likes`);
  },

  // ===== Reference images =====
  listReferenceImages(params?: { user_id?: number; page?: number }): Promise<Paginated<ReferenceImage>> {
    const s = new URLSearchParams();
    if (params?.user_id !== undefined) s.set('user_id', String(params.user_id));
    if (params?.page !== undefined) s.set('page', String(params.page));
    const qs = s.toString();
    return httpJson(`/reference-images${qs ? `?${qs}` : ''}`);
  },

  createReferenceImage(input: { file: File; description?: string }): Promise<{ message: string; reference: ReferenceImage; url?: string }> {
    const fd = new FormData();
    fd.append('image', input.file);
    if (input.description) fd.append('description', input.description);
    return httpForm(`/reference-images`, fd);
  },

  // ===== Sessions =====
  listSessions(params?: { user_id?: number; page?: number }): Promise<Paginated<ArtaiSession>> {
    const s = new URLSearchParams();
    if (params?.user_id !== undefined) s.set('user_id', String(params.user_id));
    if (params?.page !== undefined) s.set('page', String(params.page));
    const qs = s.toString();
    return httpJson(`/sessions${qs ? `?${qs}` : ''}`);
  },

  deleteSession(id: number): Promise<{ message: string }> {
    return httpJson(`/sessions/${id}`, { method: 'POST' });
  },

  // ===== AI Integration =====
  generate(input: {
    prompt?: string;
    reference?: File; // optional reference image
    image?: File; // optional source image
    title?: string;
    is_public?: boolean;
    category_id?: number;
  }): Promise<{ message: string; image: ImageItem; url?: string }> {
    const fd = new FormData();
    if (input.prompt) fd.append('prompt', input.prompt);
    if (input.reference) fd.append('reference', input.reference);
    if (input.image) fd.append('image', input.image);
    if (input.title) fd.append('title', input.title);
    if (input.is_public !== undefined) fd.append('is_public', String(input.is_public ? 1 : 0));
    if (input.category_id !== undefined) fd.append('category_id', String(input.category_id));
    return httpForm(`/generate`, fd);
  },

  editImage(id: number, input: { file: File }): Promise<{ message: string; image: ImageItem; url?: string }> {
    const fd = new FormData();
    fd.append('image', input.file);
    return httpForm(`/edit/${id}`, fd);
  },
};

export default ArtaiService;
