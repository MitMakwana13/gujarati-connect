const TOKEN_KEY = 'gg_access_token';

function getStoredToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export const fetcher = async (url: string, options?: RequestInit) => {
  const token = getStoredToken();

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
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    if (isJson && (data as any).errors?.[0]?.message) {
      throw new Error((data as any).errors[0].message);
    }
    throw new Error(typeof data === 'string' ? data : 'API Error');
  }

  return data;
};

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
