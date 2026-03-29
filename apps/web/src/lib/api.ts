export const fetcher = async (url: string, options?: RequestInit) => {
  const res = await fetch(`/api/backend${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

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
