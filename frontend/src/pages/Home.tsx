import React, { useEffect, useState } from 'react';
import { ContentList } from '../components/ContentList';
import { Button } from '../components/ui/button';
import { Plus, BookOpen, GraduationCap, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Content } from '../types';
import { getUserHistory, getUserStats, voteContent } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [recentContent, setRecentContent] = useState<Content[]>([]);
  const [upvotedContent, setUpvotedContent] = useState<Content[]>([]);
  
  const test = () => {
  };
  const [stats, setStats] = useState<{
    exercisesCompleted: number;
    lessonsCompleted: number;
    totalUpvotes: number;
    streak: number;
    level: number;
    progress: number;
  }>({
    exercisesCompleted: 0,
    lessonsCompleted: 0,
    totalUpvotes: 0,
    streak: 0,
    level: 1,
    progress: 0,
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isAuthenticated) {
      loadUserContent();
      loadUserStats();
    }
  }, [isAuthenticated]);

  const loadUserContent = async () => {
    try {
      const history = await getUserHistory();
      setRecentContent(history.recentlyViewed);
      setUpvotedContent(history.upvoted);
    } catch (error) {
      console.error('Failed to load user content:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const userStats = await getUserStats();
      setStats(userStats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id: string, type: 'up' | 'down' | 'none') => {
      try {
        const updatedExercise = await voteContent(id, type);
        setRecentContent(prevContents => 
          prevContents.map(content => 
            content.id === id ? updatedExercise : content
          )
        );
        setUpvotedContent(prevContents => 
          prevContents.map(content => 
            content.id === id ? updatedExercise : content
          )
        );
      } catch (err) {
        console.error('Failed to vote:', err);
      }
    };
  

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to EduShare</h1>
        <p className="text-xl text-gray-600 mb-8">
          Sign in to track your progress and access personalized content
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/login">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link to="/signup">
            <Button variant="secondary" size="lg">Create Account</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user?.username}!</h1>
        <Link to="/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        </Link>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-semibold">Exercises</h3>
          </div>
          <p className="text-2xl font-bold">{stats.exercisesCompleted}</p>
          <p className="text-sm text-gray-600">completed</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <GraduationCap className="w-5 h-5" />
            <h3 className="font-semibold">Lessons</h3>
          </div>
          <p className="text-2xl font-bold">{stats.lessonsCompleted}</p>
          <p className="text-sm text-gray-600">completed</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center gap-2 text-yellow-600 mb-2">
            <Trophy className="w-5 h-5" />
            <h3 className="font-semibold">Level {stats.level}</h3>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div 
              className="bg-yellow-600 h-2.5 rounded-full" 
              style={{ width: `${stats.progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">{stats.progress}% to next level</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Trophy className="w-5 h-5" />
            <h3 className="font-semibold">Streak</h3>
          </div>
          <p className="text-2xl font-bold">{stats.streak} days</p>
          <p className="text-sm text-gray-600">Keep it up!</p>
        </div>
      </div>

      {/* Recently Viewed */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recently Viewed</h2>
        {recentContent.length > 0 ? (
          <ContentList contents={recentContent} onVote={handleVote} />
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">No recently viewed content</p>
          </div>
        )}
      </div>

      {/* Upvoted Content */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Upvoted Content</h2>
        {upvotedContent.length > 0 ? (
          <ContentList contents={upvotedContent} onVote={handleVote} />
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">No upvoted content yet</p>
          </div>
        )}
      </div>
    </div>
  );
}