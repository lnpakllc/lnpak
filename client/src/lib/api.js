import axios from 'axios';

export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || ''; // e.g. https://api.lnpak.com — empty when served from the same domain

export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
  timeout: 20000,
});

// Normalise errors to a readable message.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err.response?.data?.message || (err.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : 'Network error. Please check your connection.');
    err.message = msg;
    err.status = err.response?.status;
    err.details = err.response?.data?.details;
    return Promise.reject(err);
  },
);

// GET helper returning { data, meta }.
export async function get(url, params) {
  const r = await api.get(url, { params });
  return { data: r.data.data, meta: r.data.meta };
}
export const getData = async (url, params) => (await get(url, params)).data;

// Images uploaded through the admin live on the API server.
export const assetUrl = (src) => (!src ? '' : src.startsWith('/uploads/') ? `${API_ORIGIN}${src}` : src);

export async function download(url, params, filename) {
  const r = await api.get(url, { params, responseType: 'blob' });
  const href = URL.createObjectURL(r.data);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}
