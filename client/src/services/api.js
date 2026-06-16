import axios from 'axios';

// In-memory access token. Refresh token lives in an httpOnly cookie set by the
// backend, so it is never readable from JS. We keep the short-lived access
// token in memory and attach it to every request.
let accessToken = null;
const subscribers = new Set();

export const setAccessToken = (token) => {
  accessToken = token;
  subscribers.forEach((fn) => fn(token));
};
export const getAccessToken = () => accessToken;
export const onTokenChange = (fn) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send refresh cookie
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// --- Refresh handling -------------------------------------------------------
// On a 401 we try the refresh endpoint exactly once, then replay the request.
// Concurrent 401s share a single in-flight refresh promise.
let refreshing = null;

const doRefresh = async () => {
  if (!refreshing) {
    refreshing = axios
      .post('/api/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        setAccessToken(res.data.accessToken);
        return res.data;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthCall = original?.url?.includes('/auth/');

    if (status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        await doRefresh();
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        setAccessToken(null);
        // Let the AuthContext observe the cleared token and redirect.
      }
    }
    return Promise.reject(error);
  }
);

// Convenience: pull a human-readable message out of an axios error.
export const errorMessage = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || err?.message || fallback;

export default api;
