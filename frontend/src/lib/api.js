// Small fetch wrapper for the Rootine API. Cookies carry the login session.
// Every non-GET request sends the CSRF token the server gave us.
let csrfToken = '';
export const setCsrfToken = (t) => { csrfToken = t || ''; };

export class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.status = status;
    this.fields = body?.fields || {};
    this.body = body;
  }
}

export async function api(method, path, body) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') headers['X-Rootine-CSRF'] = csrfToken || 'pending';
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach Rootine. Check your connection and try again.');
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty or not JSON */ }
  if (data?.csrfToken) setCsrfToken(data.csrfToken);
  if (!res.ok) throw new ApiError(res.status, data?.error || 'Something went wrong. Please try again.', data);
  return data;
}

// Send a file as the raw request body (used for the profile photo).
export async function upload(method, path, blob) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: { 'Content-Type': blob.type || 'application/octet-stream', 'X-Rootine-CSRF': csrfToken || 'pending' },
      credentials: 'same-origin',
      body: blob,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach Rootine. Check your connection and try again.');
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty or not JSON */ }
  if (data?.csrfToken) setCsrfToken(data.csrfToken);
  if (!res.ok) throw new ApiError(res.status, data?.error || 'Something went wrong. Please try again.', data);
  return data;
}

export const get = (p) => api('GET', p);
export const post = (p, b = {}) => api('POST', p, b);
export const put = (p, b) => api('PUT', p, b);
export const patch = (p, b) => api('PATCH', p, b);
export const del = (p, b) => api('DELETE', p, b);
