const BASE_URL = 'http://localhost:3000/api';

export const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const firstArray = Object.values(payload).find((value) => Array.isArray(value));
    if (Array.isArray(firstArray)) {
      return firstArray;
    }
  }
  return [];
};

const withLeadingSlash = (path) => (path.startsWith('/') ? path : `/${path}`);

const request = async (path, options = {}) => {
  const finalPath = withLeadingSlash(path);
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };

  if (config.method === 'GET' || config.method === 'HEAD') {
    delete config.body;
  }

  const response = await fetch(`${BASE_URL}${finalPath}`, config);

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorMessage = payload?.error || response.statusText || 'Request failed';
    throw new Error(errorMessage);
  }

  return payload ?? {};
};

export const api = {
  list: (endpoint) => request(endpoint),
  retrieve: (endpoint, id) => request(`${endpoint}/${id}`),
  create: (endpoint, data) =>
    request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (endpoint, id, data) =>
    request(`${endpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: (endpoint, id) =>
    request(`${endpoint}/${id}`, {
      method: 'DELETE',
    }),
};
