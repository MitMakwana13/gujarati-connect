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
  // Posts
  getPosts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetcher(`/posts${qs}`);
  },
  getPost: (id: string) => fetcher(`/posts/${id}`),
  createPost: (body: unknown) => fetcher('/posts', { method: 'POST', body: JSON.stringify(body) }),
  likePost: (id: string) => fetcher(`/posts/${id}/react`, { method: 'POST', body: JSON.stringify({ reaction: 'like' }) }),
  unlikePost: (id: string) => fetcher(`/posts/${id}/react`, { method: 'DELETE' }),

  // Groups
  getGroups: (params?: { tag?: string; communityId?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return fetcher(`/groups${qs}`);
  },
  getGroup: (slug: string) => fetcher(`/groups/${slug}`),
  createGroup: (body: unknown) => fetcher('/groups', { method: 'POST', body: JSON.stringify(body) }),
  joinGroup: (id: string) => fetcher(`/groups/${id}/join`, { method: 'POST', body: '{}' }),
  leaveGroup: (id: string) => fetcher(`/groups/${id}/leave`, { method: 'POST', body: '{}' }),

  // Events
  getEvents: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetcher(`/events${qs}`);
  },
  getEvent: (slug: string) => fetcher(`/events/${slug}`),
  createEvent: (body: unknown) => fetcher('/events', { method: 'POST', body: JSON.stringify(body) }),
  rsvpEvent: (id: string, status: string) =>
    fetcher(`/events/${id}/rsvp`, { method: 'POST', body: JSON.stringify({ status }) }),

  // Resources
  getResources: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetcher(`/resources${qs}`);
  },
  createResource: (body: unknown) => fetcher('/resources', { method: 'POST', body: JSON.stringify(body) }),

  // Restaurants
  getRestaurants: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetcher(`/restaurants${qs}`);
  },
  getRestaurant: (slug: string) => fetcher(`/restaurants/${slug}`),

  // Discover / Nearby
  getNearbyPeople: (params: Record<string, string | number>) => {
    const qs = '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return fetcher(`/discover/nearby/people${qs}`);
  },
  getNearbyGroups: (params: Record<string, string | number>) => {
    const qs = '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return fetcher(`/discover/nearby/groups${qs}`);
  },
  getNearbyEvents: (params: Record<string, string | number>) => {
    const qs = '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return fetcher(`/discover/nearby/events${qs}`);
  },

  // Messages
  getConversations: () => fetcher('/messages/conversations'),
  getMessages: (id: string) => fetcher(`/messages/conversations/${id}`),
};
