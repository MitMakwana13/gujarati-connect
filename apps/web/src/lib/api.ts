import { getAccessToken, setAccessToken, clearAccessToken } from './auth-token';

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch('/api/backend/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then(async (refreshRes) => {
        if (!refreshRes.ok) throw new Error('Refresh failed');
        const data = await refreshRes.json();
        const newToken = data?.data?.tokens?.accessToken;
        if (!newToken) throw new Error('Refresh returned no access token');
        setAccessToken(newToken);
        return newToken;
      })
      .catch(() => {
        clearAccessToken();
        if (typeof window !== 'undefined') window.location.href = '/auth/login';
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function parseResponse(res: Response): Promise<unknown> {
  const isJson = res.headers.get('content-type')?.includes('application/json');
  return isJson ? res.json() : res.text();
}

async function executeFetch(url: string, options?: RequestInit, isRetry = false): Promise<any> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/backend${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) return executeFetch(url, options, true);
    throw new Error('Session expired');
  }

  const data = await parseResponse(res);

  if (!res.ok) {
    if (typeof data === 'object' && data !== null && (data as any).errors?.[0]?.message) {
      throw new Error((data as any).errors[0].message);
    }
    throw new Error(typeof data === 'string' ? data : 'API Error');
  }

  return data;
}

async function uploadMedia(file: File, isRetry = false): Promise<{ data: { urls: string[] } }> {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/backend/media/upload', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData,
  });

  if (res.status === 401 && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) return uploadMedia(file, true);
    throw new Error('Session expired');
  }

  const data = await parseResponse(res);

  if (!res.ok) {
    if (typeof data === 'object' && data !== null && (data as any).errors?.[0]?.message) {
      throw new Error((data as any).errors[0].message);
    }
    throw new Error(typeof data === 'string' ? data : 'Upload failed');
  }

  return data as { data: { urls: string[] } };
}

export const fetcher = executeFetch;

export const api = {
  // ── Posts ───────────────────────────────────────────────────
  getPosts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetcher(`/posts${qs}`);
  },
  getPost: (id: string) => fetcher(`/posts/${id}`),
  createPost: (body: unknown) => fetcher('/posts', { method: 'POST', body: JSON.stringify(body) }),
  likePost: (id: string) => fetcher(`/posts/${id}/react`, { method: 'POST', body: JSON.stringify({ reaction: 'like' }) }),
  unlikePost: (id: string) => fetcher(`/posts/${id}/react`, { method: 'DELETE' }),

  // ── Comments ────────────────────────────────────────────────
  getPostComments: (postId: string) => fetcher(`/posts/${postId}/comments`),
  createComment: (postId: string, body: string) =>
    fetcher(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),

  // ── Media ───────────────────────────────────────────────────
  uploadMedia,

  // ── Groups ──────────────────────────────────────────────────
  getGroups: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetcher(`/groups${qs}`);
  },
  getGroup: (slug: string) => fetcher(`/groups/${slug}`),
  createGroup: (body: unknown) => fetcher('/groups', { method: 'POST', body: JSON.stringify(body) }),
  joinGroup: (id: string) => fetcher(`/groups/${id}/join`, { method: 'POST', body: '{}' }),
  leaveGroup: (id: string) => fetcher(`/groups/${id}/leave`, { method: 'POST', body: '{}' }),

  // ── Events ──────────────────────────────────────────────────
  getEvents: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetcher(`/events${qs}`);
  },
  getEvent: (id: string) => fetcher(`/events/${id}`),
  createEvent: (body: unknown) => fetcher('/events', { method: 'POST', body: JSON.stringify(body) }),
  rsvpEvent: (id: string, status: string) =>
    fetcher(`/events/${id}/rsvp`, { method: 'POST', body: JSON.stringify({ status }) }),
  cancelRsvp: (id: string) => fetcher(`/events/${id}/rsvp`, { method: 'DELETE' }),

  // ── Resources ───────────────────────────────────────────────
  getResources: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetcher(`/resources${qs}`);
  },
  createResource: (body: unknown) => fetcher('/resources', { method: 'POST', body: JSON.stringify(body) }),

  // ── Users / Profile ─────────────────────────────────────────
  getMyProfile: () => fetcher('/users/me'),
  updateProfile: (body: unknown) => fetcher('/users/me/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  getDiscoverUsers: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetcher(`/users/discover${qs}`);
  },

  // ── Notifications ───────────────────────────────────────────
  getNotifications: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetcher(`/notifications${qs}`);
  },
  markNotificationRead: (id: string) => fetcher(`/notifications/${id}/read`, { method: 'PATCH', body: '{}' }),
  markAllNotificationsRead: () => fetcher('/notifications/read-all', { method: 'PATCH', body: '{}' }),

  // ── Messages ────────────────────────────────────────────────
  getConversations: () => fetcher('/messages/conversations'),
  getConversationMessages: (id: string) => fetcher(`/messages/conversations/${id}`),
  sendMessage: (conversationId: string, body: string) =>
    fetcher(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body, messageType: 'text' }),
    }),
};
