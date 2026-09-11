/**
 * SKILL BADLU - Client HTTP API Connector
 * Seamless async interface communicating with the Express backend (/api/*)
 */

(function () {
  const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? ''
    : 'http://localhost:5000';

  const TOKEN_KEY = 'skillbadlu_jwt_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      // Re-throw with status if present
      throw err;
    }
  }

  const SkillBadluAPI = {
    auth: {
      async register(payload) {
        return request('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      },

      async login(credentials) {
        const res = await request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials)
        });
        if (res.token) {
          setToken(res.token);
        }
        return res;
      },

      async checkEligibility(identifier) {
        return request(`/api/auth/eligibility/${encodeURIComponent(identifier)}`, {
          method: 'GET'
        });
      },

      async getMe() {
        return request('/api/auth/me', {
          method: 'GET'
        });
      },

      logout() {
        setToken(null);
      },

      getToken,
      setToken
    },

    payments: {
      async createOrder(userId, amount = 99) {
        return request('/api/payments/create-order', {
          method: 'POST',
          body: JSON.stringify({ userId, amount })
        });
      },

      async verifyAndPay(payload) {
        const res = await request('/api/payments/verify-and-pay', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.token) {
          setToken(res.token);
        }
        return res;
      },

      async getReceipt(paymentId) {
        return request(`/api/payments/receipt/${encodeURIComponent(paymentId)}`, {
          method: 'GET'
        });
      },

      async getHistory(userId) {
        const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        return request(`/api/payments/history${query}`, {
          method: 'GET'
        });
      }
    },

    admin: {
      async getPendingUsers() {
        return request('/api/admin/pending-users', {
          method: 'GET'
        });
      },

      async approveUser(userId) {
        return request(`/api/admin/approve-user/${encodeURIComponent(userId)}`, {
          method: 'POST'
        });
      },

      async rejectUser(userId, reason) {
        return request(`/api/admin/reject-user/${encodeURIComponent(userId)}`, {
          method: 'POST',
          body: JSON.stringify({ reason })
        });
      },

      async getRevenueMetrics() {
        return request('/api/admin/revenue-metrics', {
          method: 'GET'
        });
      },

      async getOnboardingPayments() {
        return request('/api/admin/onboarding-payments', {
          method: 'GET'
        });
      },

      async getLedger() {
        return request('/api/admin/ledger', {
          method: 'GET'
        });
      }
    },

    async isOnline() {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        return res.ok;
      } catch {
        return false;
      }
    }
  };

  window.SkillBadluAPI = SkillBadluAPI;
})();
