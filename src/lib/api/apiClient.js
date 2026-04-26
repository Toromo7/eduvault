/**
 * A lightweight fetch wrapper for public and authenticated API calls.
 */
export async function apiClient(endpoint, { body, ...customConfig } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  // Remove Content-Type if explicitly set to undefined (e.g. for FormData)
  if (config.headers['Content-Type'] === undefined) {
    delete config.headers['Content-Type'];
  }

  if (body) {
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  let data;
  try {
    const response = await fetch(endpoint, config);
    if (response.ok) {
      data = await response.json();
      return data;
    }
    
    // Handle specific error statuses
    if (response.status === 401) {
       // Optional: Redirect to login or handle session expiry
    }

    const errorData = await response.json();
    const error = new Error(errorData.error || 'Something went wrong');
    error.status = response.status;
    error.data = errorData;
    throw error;
  } catch (err) {
    return Promise.reject(err.message || err);
  }
}
