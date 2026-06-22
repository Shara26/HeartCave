import axios from 'axios';

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

// Declared BEFORE it is used below. Production targets Render; dev uses '' so
// the Vite proxy handles "/api".
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://heartcave-1.onrender.com' : '');

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing = null;

const doRefresh = async () => {
  if (!refreshing) {
    refreshing = axios
      .post(`${API_BASE}/api/auth/refresh`, {}, { withCredentials: true })
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
      }
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || err?.message || fallback;

export default api;