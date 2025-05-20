const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  summary: (userId: string) => `${API_BASE_URL}/api/email/${userId}/summary`,
  reply: (userId: string) => `${API_BASE_URL}/api/email/${userId}/reply`,
  threads: {
    summarize: (userId: string) => `${API_BASE_URL}/api/email/${userId}/threads/summarize`,
    summaries: (userId: string) => `${API_BASE_URL}/api/email/${userId}/threads/summaries`,
  },
};

export const fetchApi = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data as T;
}; 