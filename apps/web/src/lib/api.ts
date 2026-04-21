let cachedCsrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;
  const res = await fetch('/api/backend/csrf-token', { credentials: 'include' });
  const data = await res.json();
  cachedCsrfToken = data.csrfToken;
  return data.csrfToken;
}

export const fetcher = async (url: string, options?: RequestInit) => {
  const method = options?.method?.toUpperCase() || 'GET';
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...options?.headers,
  });

  if (isMutating) {
    const token = await getCsrfToken();
    headers.set('x-csrf-token', token);
  }

  let res = await fetch(`/api/backend${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 403 && isMutating) {
    // Retry once with a fresh token
    cachedCsrfToken = null;
    const freshToken = await getCsrfToken();
    headers.set('x-csrf-token', freshToken);
    res = await fetch(`/api/backend${url}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    if (isJson && data.errors?.[0]?.message) {
      throw new Error(data.errors[0].message);
    }
    throw new Error(typeof data === 'string' ? data : 'API Error');
  }

  return data;
};

export const api = {
  // Posts
  getPosts: () => fetcher('/posts'),
  getPost: (id: string) => fetcher(`/posts/${id}`),
  createPost: (body: any) => fetcher('/posts', { method: 'POST', body: JSON.stringify(body) }),
  likePost: (id: string) => fetcher(`/posts/${id}/react`, { method: 'POST', body: JSON.stringify({ reaction: 'like' }) }),
  unlikePost: (id: string) => fetcher(`/posts/${id}/react`, { method: 'DELETE' }),
  
  // Groups
  getGroups: () => fetcher('/groups'),
  joinGroup: (id: string) => fetcher(`/groups/${id}/join`, { method: 'POST' }),

  // Messages
  getConversations: () => fetcher('/messages/conversations'),
  getMessages: (id: string) => fetcher(`/messages/conversations/${id}`),
};
