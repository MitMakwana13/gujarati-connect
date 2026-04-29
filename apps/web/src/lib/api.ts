import { getAccessToken, setAccessToken, clearAccessToken } from './auth-token';

let refreshPromise: Promise<string | null> | null = null;

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
    credentials: 'include', // Forward cookies to proxy
  });

  if (res.status === 401 && !isRetry) {
    if (!refreshPromise) {
      refreshPromise = fetch(`/api/backend/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
        .then(async (refreshRes) => {
          if (!refreshRes.ok) throw new Error('Refresh failed');
          const data = await refreshRes.json();
          const newToken = data.data.tokens.accessToken;
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

    const newToken = await refreshPromise;
    if (newToken) {
      return executeFetch(url, options, true);
    } else {
      throw new Error('Session expired');
    }
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    if (isJson && (data as any).errors?.[0]?.message) {
      throw new Error((data as any).errors[0].message);
    }
    throw new Error(typeof data === 'string' ? data : 'API Error');
  }

  return data;
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

  // ── Comments ─────────────────────────────────────────────────
  getPostComments: (postId: string) => fetcher(`/posts/${postId}/comments`),
  createComment: (postId: string, body: string) =>
    fetcher(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),

  // ── Media ───────────────────────────────────────────────────
  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAccessToken();
    return fetch(`/api/backend/media/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.errors?.[0]?.message ?? 'Upload failed');
      }
      return res.json();
    });
  },

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
