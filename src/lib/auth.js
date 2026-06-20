const API_URL = "https://marso.sk/auth_api.php";

export const authApi = {
  async register(email, password) {
    const res = await fetch(`${API_URL}?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async verify(email, code) {
    const res = await fetch(`${API_URL}?action=verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem("mars_token", data.token);
      localStorage.setItem("mars_email", data.email);
    }
    return data;
  },

  async login(email, password) {
    const res = await fetch(`${API_URL}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem("mars_token", data.token);
      localStorage.setItem("mars_email", data.email);
    }
    return data;
  },

  logout() {
    localStorage.removeItem("mars_token");
    localStorage.removeItem("mars_email");
  },

  getUser() {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("mars_token");
    const email = localStorage.getItem("mars_email");
    if (token && email) {
      return { email };
    }
    return null;
  },

  async saveHistory(videoId, title, thumbnailUrl) {
    const token = localStorage.getItem("mars_token");
    if (!token) return { error: "Not logged in" };

    const res = await fetch(`${API_URL}?action=save_history`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ video_id: videoId, title, thumbnail_url: thumbnailUrl }),
    });
    return res.json();
  },

  async getHistory() {
    const token = localStorage.getItem("mars_token");
    if (!token) return { error: "Not logged in" };

    const res = await fetch(`${API_URL}?action=get_history`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}`
      }
    });
    return res.json();
  }
};
