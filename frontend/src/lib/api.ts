
import axios from 'axios';
import Cookies from 'js-cookie';
import { Content, SortOption, ClassLevelModel, SubjectModel, ChapterModel, Solution } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const csrfToken = Cookies.get('csrftoken');
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

// Auth API
export const login = async (identifier: string, password: string) => {
  const response = await api.post('/auth/login/', { identifier, password });
  return response.data;
};

export const register = async (username: string, email: string, password: string) => {
  const response = await api.post('/auth/register/', { username, email, password });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout/');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/user/');
  return response.data;
};

// Content API
export const getContents = async (params: {
  type?: string;
  class_level?: string;
  subject?: string;
  tags?: string[];
  difficulty?: string;
  sort?: SortOption;
  page?: number;
}) => {
  const response = await api.get('/exercises/', { params });
  return {
    results: response.data.results || [],
    count: response.data.count || 0,
    next: response.data.next,
    previous: response.data.previous,
  };
};

export const createContent = async (data: {
  title: string;
  content: string;
  type: string;
  class_level: string;
  subject: string;
  tags: string[];
  difficulty: string;
  exercise_solution?: string;
}) => {
  const response = await api.post('/exercises/', data);
  return response.data;
};

export const getContentById = async (id: string) => {
  const response = await api.get(`/exercises/${id}/`);
  return response.data;
};

export const updateContent = async (id: string, data: {
  title: string;
  content: string;
  type: string;
  class_level: string;
  subject: string;
  tags: string[];
  difficulty: string;
  solution_content?: string;
}) => {
  const response = await api.put(`/exercises/${id}/`, data);
  return response.data;
};

export const deleteContent = async (id: string) => {
  await api.delete(`/exercises/${id}/`);
};

export const voteContent = async (id: string, type: 'up' | 'down' | 'none', target: 'exercise' | 'solution' = 'exercise') => {
  const response = await api.post(`/exercises/${id}/vote/`, { type, target });
  return response.data;
};

// Solution API
export const getSolution = async (id: string) => {
  const response = await api.get(`/solutions/${id}/`);
  return response.data;
};

export const updateSolution = async (id: string, data: { content: string }) => {
  const response = await api.put(`/solutions/${id}/`, data);
  return response.data;
};

export const deleteSolution = async (id: string) => {
  await api.delete(`/solutions/${id}/`);
};

export const voteSolution = async (id: string, type: 'up' | 'down' | 'none') => {
  const response = await api.post(`/solutions/${id}/vote/`, { type });
  return response.data;
};

export const addSolution = async (exerciseId: string, data: { content: string }): Promise<Solution> => {
  const response = await api.post(`/exercises/${exerciseId}/solution/`, data);
  return response.data;
};

// Comment API
export const voteComment = async (commentId: string, voteType: 'up' | 'down' | 'none') => {
  const response = await api.post(`/comments/${commentId}/vote/`, { type: voteType });
  return response.data;
};

export const addComment = async (exerciseId: string, content: string, parentId?: string) => {
  const response = await api.post(`/exercises/${exerciseId}/comment/`, { 
    content,
    parent: parentId
  });
  return response.data;
};

export const updateComment = async (commentId: string, content: string) => {
  const response = await api.put(`/comments/${commentId}/`, { content });
  return response.data;
};

export const deleteComment = async (commentId: string) => {
  await api.delete(`/comments/${commentId}/`);
};

// Content Tracking
export const markContentViewed = async (contentId: string) => {
  const response = await api.post(`/content/${contentId}/view/`);
  return response.data;
};

export const markContentCompleted = async (contentId: string) => {
  const response = await api.post(`/content/${contentId}/complete/`);
  return response.data;
};

// Hierarchical Data API
export const getClassLevels = async (): Promise<ClassLevelModel[]> => {
  const response = await api.get('/class-levels/');
  return response.data.results || [];
};

export const getSubjects = async (classLevelId?: string): Promise<SubjectModel[]> => {
  const params = classLevelId ? { class_level: classLevelId } : {};
  const response = await api.get('/subjects/', { params });
  return response.data.results || [];
};

export const getChapters = async (subjectId?: string, classLevelId?: string): Promise<ChapterModel[]> => {
  const params = {
    ...(subjectId && { subject: subjectId }),
    ...(classLevelId && { class_level: classLevelId }),
  };
  const response = await api.get('/chapters/', { params });
  return response.data.results || [];
};

// User Profile API
export const getUserProfile = async (username: string) => {
  const response = await api.get(`/users/${username}/`);
  return response.data;
};

export const updateUserProfile = async (data: any) => {
  const response = await api.put('/users/profile/', data);
  return response.data;
};

export const getUserContributions = async (username: string) => {
  const response = await api.get(`/users/${username}/contributions/`);
  return response.data;
};

// User History and Stats
export const getUserHistory = async () => {
  const response = await api.get('/users/history/');
  return response.data;
};

export const getUserStats = async () => {
  const response = await api.get('/users/stats/');
  return response.data;
};

// Image Upload
export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/upload/image/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.url;
};
