export type Difficulty = 'easy' | 'medium' | 'hard';
export type SortOption = 'newest' | 'oldest' | 'most_upvoted' | 'most_commented';
export type VoteType = 'up' | 'down' | 'none';
export type ClassLevel = 
  | 'tronc_commun'
  | 'bac_sm'
  | 'bac_sp'
  | 'mp'
  | 'mpsi'
  | 'psi'
  | 'pc';

export interface ClassLevelModel {
  id: string;
  name: string;
  order: number;
}

export interface SubjectModel {
  id: string;
  name: string;
  class_level: number[];
}

export interface ChapterModel {
  id: string;
  name: string;
  subject: number;
  class_level: number[];
  order: number;
}

export interface Solution {
  id: string;
  content: string;
  author: User;
  created_at: string;
  updated_at: string;
  upvotes_count: number;
  downvotes_count: number;
  user_vote: VoteType;
}

export interface Content {
  id: string;
  title: string;
  content: string;
  class_levels: ClassLevelModel[];
  subject: SubjectModel;
  chapters: ChapterModel[];
  difficulty: Difficulty;
  author: User;
  created_at: string;
  updated_at: string;
  upvotes_count: number;
  downvotes_count: number;
  user_vote: VoteType;
  solution?:  Solution[];  
  comments: Comment[];
  view_count: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  isAuthenticated: boolean;
  avatar?: string;
  bio?: string;
  joinedAt: string;
  contributionsCount: number;
  reputation: number;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  created_at: string;
  upvotes_count: number;
  downvotes_count: number;
  user_vote: VoteType;
  parent?: string;
  replies?: Comment[];
}

export interface UserProfile {
  user: User;
  contributions: Content[];
  favoriteSubjects: string[];
  recentActivity: {
    type: 'comment' | 'post' | 'vote';
    content: Content;
    timestamp: string;
  }[];
  stats: {
    totalContributions: number;
    totalUpvotes: number;
    totalComments: number;
  };
}