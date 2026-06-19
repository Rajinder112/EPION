// API utility for SGPGI Nursing Prep PWA

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

const BASE_URL = getBaseUrl();

// Helper for making authenticated requests
async function request(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set up AbortController for a 8-second timeout to prevent infinite hangs
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  const config = {
    ...options,
    headers,
    signal: controller.signal,
  };

  if (config.body && typeof config.body !== 'string') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 402 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('trial-expired'));
      }
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    // Handle empty responses
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Connection timed out. Please verify that the backend API server is running and accessible.');
    }
    throw error;
  }
}

export const api = {
  // Auth
  register: (name, email, password, phone, country, address, securityQuestion, securityAnswer) => 
    request('/auth/register', { method: 'POST', body: { name, email, password, phone, country, address, securityQuestion, securityAnswer } }),
  
  login: (email, password) => 
    request('/auth/login', { method: 'POST', body: { email, password } }),
  
  googleMock: (name, email, googleId) => 
    request('/auth/google-mock', { method: 'POST', body: { name, email, googleId } }),
  
  getCandidates: () => 
    request('/auth/candidates'),
  
  assignBatch: (userId, batchId) => 
    request('/auth/assign-batch', { method: 'POST', body: { userId, batchId } }),
  
  getBatches: () => 
    request('/auth/batches'),
  
  createBatch: (name) => 
    request('/auth/batches', { method: 'POST', body: { name } }),
  
  getProfile: () => 
    request('/auth/me'),

  makeAdmin: (email) =>
    request('/auth/make-admin', { method: 'PUT', body: { email } }),

  unlockAccount: () =>
    request('/auth/unlock', { method: 'PUT' }),

  updateProfile: (name, profile_pic) =>
    request('/auth/profile', { method: 'PUT', body: { name, profile_pic } }),

  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', { method: 'PUT', body: { currentPassword, newPassword } }),

  // Questions
  getQuestions: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    return request(`/questions?${params.toString()}`);
  },
  
  getQuestion: (id) => 
    request(`/questions/${id}`),
  
  createQuestion: (questionData) => 
    request('/questions', { method: 'POST', body: questionData }),
  
  updateQuestion: (id, questionData) => 
    request(`/questions/${id}`, { method: 'PUT', body: questionData }),
  
  importQuestionsCsv: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/questions/import`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'CSV Import failed');
    }

    return response.json();
  },

  // Practice
  getSubjectTopics: () => 
    request('/practice/subject-topics'),
  
  getRandomQuestions: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    return request(`/practice/random?${params.toString()}`);
  },
  
  submitAttempt: (questionId, chosenOption, confidenceRating, isDailyChallengeComplete = false) => 
    request('/practice/submit-attempt', { method: 'POST', body: { questionId, chosenOption, confidenceRating, isDailyChallengeComplete } }),
  
  toggleBookmark: (questionId) => 
    request('/practice/bookmark', { method: 'POST', body: { questionId } }),
  
  getBookmarks: () => 
    request('/practice/bookmarks'),
  
  getRevisionList: () => 
    request('/practice/revision'),

  // Mocks
  getMockTests: () => 
    request('/mocks'),
  
  getMockTestDetails: (id) => 
    request(`/mocks/${id}`),
  
  submitMockTest: (mockTestId, answers, timeTakenSeconds) => 
    request('/mocks/submit', { method: 'POST', body: { mockTestId, answers, timeTakenSeconds } }),
  
  getMockResult: (attemptId) => 
    request(`/mocks/results/${attemptId}`),
  
  createMockTest: (mockData) => 
    request('/mocks', { method: 'POST', body: mockData }),
  
  updateMockTest: (id, mockData) => 
    request(`/mocks/${id}`, { method: 'PUT', body: mockData }),
  
  deleteMockTest: (id) => 
    request(`/mocks/${id}`, { method: 'DELETE' }),

  // Analytics
  getAnalyticsSummary: () => 
    request('/analytics/summary'),
  
  getSubjectPerformance: () => 
    request('/analytics/subject-performance'),
  
  getProgressHistory: () => 
    request('/analytics/progress'),
  
  getLeaderboard: () => 
    request('/analytics/leaderboard'),
  
  getAiRecommendations: () => 
    request('/analytics/ai-recommendations'),
};
