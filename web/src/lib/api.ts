const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

interface RequestOptions extends RequestInit {
  accessToken: string;
}

export async function apiRequest<T>(
  path: string,
  { accessToken, ...init }: RequestOptions
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API request failed (${response.status})`);
  }

  const json = await response.json();
  return (json.data ?? json) as T;
}

