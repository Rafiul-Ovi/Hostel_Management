const API = {
  baseUrl: "/api",

  async request(path, options = {}) {
    const { method = "GET", body, headers = {} } = options;
    const config = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (body !== undefined) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${path}`, config);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = payload?.message || "Request failed";
      throw new Error(message);
    }

    return payload;
  },

  async login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  },

  async register(payload) {
    return this.request("/auth/register", {
      method: "POST",
      body: payload,
    });
  },

  async resetPassword(email, password) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: { email, password },
    });
  },

  async list(collection) {
    return this.request(`/${collection}`);
  },

  async create(collection, payload) {
    return this.request(`/${collection}`, {
      method: "POST",
      body: payload,
    });
  },

  async update(collection, id, payload) {
    return this.request(`/${collection}/${id}`, {
      method: "PUT",
      body: payload,
    });
  },

  async remove(collection, id) {
    return this.request(`/${collection}/${id}`, { method: "DELETE" });
  },
};
