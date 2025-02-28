
import axios from 'axios';
import Cookies from 'js-cookie';
import { SortOption, ClassLevelModel, SubjectModel, ChapterModel, Solution, Difficulty } from '../types';

const api = axios.create({
  baseURL: 'http://192.168.1.47:8000/api',
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


// Add these functions to your existing lib/api.ts file

import { User, Content } from "@/types";

/**
 * Get user profile by ID or username
 * @param userId - User ID or username
 * @returns User object
 */
// Add these functions to your existing lib/api.ts file


/**
 * Get user profile by ID or username
 * This works with your current backend but uses the current user endpoint
 * for now since there's no specific endpoint for getting other users
 * 
 * @param userId - User ID or username
 * @returns User object
 */
export async function getUserById(userId: string): Promise<User> {
  try {
    // Currently your backend doesn't have a specific endpoint to get user by ID
    // You should use your current user endpoint for the logged-in user
    // For other users, we'll need to add that endpoint
    const response = await fetch('/api/auth/user');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching user:", error);
    
    // Fallback for development - remove when backend is updated
    return {
      id: userId,
      username: "user_" + userId.substring(0, 5),
      email: `user${userId.substring(0, 5)}@example.com`,
      isAuthenticated: false,
      joinedAt: new Date().toISOString(),
      contributionsCount: 0,
      reputation: 0,
      bio: "This is a temporary user profile until the backend endpoint is implemented."
    };
  }
}

/**
 * Get exercises created by a specific user
 * @param userId - User ID or username
 * @returns Object containing results array of Content
 */
export async function getUserContributions(userId: string): Promise<{ results: Content[] }> {
  try {
    // You need to create this endpoint in your Django backend
    const response = await fetch(`/api/exercises?author=${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user contributions: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching user contributions:", error);
    
    // Return empty results array until backend is implemented
    return {
      results: []
    };
  }
}

/**
 * Get exercises saved by the current user
 * Note: This requires authentication
 * @returns Object containing results array of Content
 */
export async function getSavedContents(): Promise<{ results: Content[] }> {
  try {
    // This would use the user history endpoint for upvoted content
    // since you don't have a specific "saved" functionality yet
    const response = await fetch('/api/users/history');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch saved content: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Use the upvoted content from history as "saved" for now
    return {
      results: data.upvoted || []
    };
  } catch (error) {
    console.error("Error fetching saved content:", error);
    
    // Return empty results array until backend is implemented
    return {
      results: []
    };
  }
}

/**
 * Get user statistics (works with your current backend)
 * @returns User statistics
 */

type VoteValue = 1 | -1 | 0;  // Matches Vote.UP, Vote.DOWN, Vote.UNVOTE
type VoteTarget = 'exercise' | 'solution' | 'comment';

const voteContent = async (contentId: string, value: VoteValue, target: VoteTarget) => {
  const endpoints = {
    exercise: `/exercises/${contentId}/vote/`,
    solution: `/solutions/${contentId}/vote/`,
    comment: `/comments/${contentId}/vote/`,
  };

  const response = await api.post(endpoints[target], { value });
  return response.data;
};

export const voteExercise = async (id: string, value: VoteValue) => {
  return voteContent(id, value, 'exercise');
};

export const voteSolution = async (id: string, value: VoteValue) => {
  return voteContent(id, value, 'solution');
};

export const voteComment = async (id: string, value: VoteValue) => {
  return voteContent(id, value, 'comment');
};

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
  classLevels?: string[];
  subjects?: string[];
  chapters?: string[];
  difficulties?: Difficulty[];
  sort?: SortOption;
  page?: number;
  type?: string;
  per_page?: number;
}) => {
  const response = await api.get('/exercises/', { 
    params: {
      class_levels: params.classLevels,
      subjects: params.subjects,
      chapters: params.chapters,
      difficulties: params.difficulties,
    } 
  });
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
  class_level: string[];
  subject: string;
  chapters: string[];
  difficulty: string;
  solution_content?: string;
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
  class_levels: string;
  subject: string;
  chapters: string[];
  difficulty: string;
  solution_content?: string;
}) => {
  const response = await api.put(`/exercises/${id}/`, data);
  return response.data;
};

export const deleteContent = async (id: string) => {
  await api.delete(`/exercises/${id}/`);
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



export const addSolution = async (exerciseId: string, data: { content: string }): Promise<Solution> => {
  const response = await api.post(`/exercises/${exerciseId}/solution/`, data);
  return response.data;
};

// Comment API

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

export const getSubjects = async (classLevelId?: string | string[]): Promise<SubjectModel[]> => {
  const params = classLevelId ? { class_level: classLevelId } : {};  // Si pas de classLevelId, params est vide
  const response = await api.get('/subjects/', { params });
  return response.data.results || [];
};

export const getChapters = async (subjectIds?: string |string[], classLevelIds?: string | string[]): Promise<ChapterModel[]> => {
  const params = {
    ...(subjectIds && { subject: subjectIds }),
    ...(classLevelIds && { class_level:  classLevelIds }),
  };
  const response = await api.get('/chapters/', { params });

  console.log('Here u go')

  console.log(response.data.results)
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


