const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  async fetchJson(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || `HTTP error! Status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`API Error on ${url}:`, error);
      throw error;
    }
  }

  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        return data.status === 'ok';
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  async getStats() {
    const res = await this.fetchJson('/api/stats');
    return res.data;
  }

  async getCategories() {
    const res = await this.fetchJson('/api/categories');
    return res.data;
  }

  async createCategory(name, description) {
    const res = await this.fetchJson('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    return res.data;
  }

  async ingestRawText(categoryName, content, metadata = {}) {
    return await this.fetchJson('/api/documents/ingest', {
      method: 'POST',
      body: JSON.stringify({
        category_name: categoryName,
        content,
        metadata,
      }),
    });
  }

  async uploadFile(categoryName, file, metadata = null) {
    const formData = new FormData();
    formData.append('category_name', categoryName);
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', typeof metadata === 'string' ? metadata : JSON.stringify(metadata));
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        body: formData, // Fetch automatically sets correct multipart headers when body is FormData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || `File upload error! Status: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error('API File Upload Error:', error);
      throw error;
    }
  }

  async searchSemantic(query, categoryName = null, matchThreshold = 0.4, matchCount = 5) {
    const res = await this.fetchJson('/api/documents/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        category_name: categoryName || null,
        match_threshold: parseFloat(matchThreshold),
        match_count: parseInt(matchCount, 10),
      }),
    });
    return res.results;
  }
}

export const api = new ApiService();
