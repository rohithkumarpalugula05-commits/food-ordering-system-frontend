/**
 * API Service for Food Ordering System
 * Handles communication with Spring Boot backend (defaults to /api proxy or VITE_API_BASE_URL)
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Authentication
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    getUsers: () => request('/auth/users'),
  },

  // Restaurants
  restaurants: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.all) query.append('all', 'true');
      if (params.search) query.append('search', params.search);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return request(`/restaurants${qs}`);
    },
    getById: (id) => request(`/restaurants/${id}`),
    create: (data) =>
      request('/restaurants', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/restaurants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/restaurants/${id}`, {
        method: 'DELETE',
      }),
  },

  // Menu Items
  menuItems: {
    getByRestaurant: (restaurantId, all = false) =>
      request(`/menu-items/restaurant/${restaurantId}${all ? '?all=true' : ''}`),
    create: (restaurantId, data) =>
      request(`/menu-items/restaurant/${restaurantId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/menu-items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/menu-items/${id}`, {
        method: 'DELETE',
      }),
  },

  // Orders
  orders: {
    place: (orderData) =>
      request('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      }),
    getAll: () => request('/orders'),
    getByUser: (userId) => request(`/orders/user/${userId}`),
    getById: (id) => request(`/orders/${id}`),
    track: (trackingNumber) => request(`/orders/track/${encodeURIComponent(trackingNumber)}`),
    updateStatus: (id, status) =>
      request(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // Admin Dashboard
  admin: {
    getStats: () => request('/admin/stats'),
  },
};
