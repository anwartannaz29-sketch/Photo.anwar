// ملف مساعد للاستدعاء السهل للـ API من الفرونتإند

class PhotoAPI {
  constructor(baseURL = 'https://europe-west1-anwar-2a290.cloudfunctions.net/api') {
    this.baseURL = baseURL;
  }

  // الحصول على التوكن من Firebase
  async getToken() {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error('المستخدم غير مسجل دخول');
    return await user.getIdToken();
  }

  // إضافة الـ Header المطلوب
  async getHeaders() {
    const token = await this.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // دالة عامة للطلب
  async request(endpoint, options = {}) {
    const headers = await this.getHeaders();
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'حدث خطأ');
    }

    return response.json();
  }

  // ====== الألبومات ======
  async getAlbums() {
    return this.request('/albums', { method: 'GET' });
  }

  async createAlbum(name, description = '', cover = '') {
    return this.request('/albums', {
      method: 'POST',
      body: JSON.stringify({ name, description, cover })
    });
  }

  async deleteAlbum(albumId) {
    return this.request(`/albums/${albumId}`, { method: 'DELETE' });
  }

  // ====== الصور ======
  async getPhotos(albumId) {
    return this.request(`/albums/${albumId}/photos`, { method: 'GET' });
  }

  async addPhoto(albumId, url, name, size = 0) {
    return this.request(`/albums/${albumId}/photos`, {
      method: 'POST',
      body: JSON.stringify({ url, name, size })
    });
  }

  async deletePhoto(albumId, photoId) {
    return this.request(`/albums/${albumId}/photos/${photoId}`, { 
      method: 'DELETE' 
    });
  }

  // ====== الإعجاب ======
  async toggleLike(albumId, photoId) {
    return this.request(`/albums/${albumId}/photos/${photoId}/like`, {
      method: 'POST'
    });
  }

  // ====== التعليقات ======
  async addComment(albumId, photoId, text) {
    return this.request(`/albums/${albumId}/photos/${photoId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  // ====== المستخدم ======
  async getProfile() {
    return this.request('/user/profile', { method: 'GET' });
  }

  async getStats() {
    return this.request('/user/stats', { method: 'GET' });
  }
}

// تصدير للاستخدام
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PhotoAPI;
}
