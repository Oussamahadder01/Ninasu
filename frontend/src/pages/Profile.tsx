import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUserProfile, getUserContributions } from '../lib/api';
import { UserProfile, Content } from '../types';
import { ContentList } from '../components/ContentList';
import { Calendar, Award, BookOpen, MessageSquare } from 'lucide-react';

export const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'contributions' | 'activity'>('contributions');

  useEffect(() => {
    if (username) {
      loadProfile(username);
    }
  }, [username]);

  const loadProfile = async (username: string) => {
    try {
      const data = await getUserProfile(username);
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  if (!profile) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-start gap-8">
          <img
            src={profile.user.avatar || 'https://via.placeholder.com/150'}
            alt={profile.user.username}
            className="w-32 h-32 rounded-full"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{profile.user.username}</h1>
            <p className="text-gray-600 mb-4">{profile.user.bio || 'No bio provided'}</p>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span>Joined {new Date(profile.user.joinedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-gray-500" />
                <span>{profile.user.reputation} reputation</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-500" />
                <span>{profile.stats.totalContributions} contributions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('contributions')}
          className={`px-4 py-2 rounded-md ${
            activeTab === 'contributions'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Contributions
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 rounded-md ${
            activeTab === 'activity'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Recent Activity
        </button>
      </div>

      {/* Content */}
      {activeTab === 'contributions' ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Contributions</h2>
          <ContentList contents={profile.contributions} onVote={() => {}} />
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          {profile.recentActivity.map((activity, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                {activity.type === 'comment' && <MessageSquare className="w-4 h-4" />}
                {activity.type === 'post' && <BookOpen className="w-4 h-4" />}
                <span className="capitalize">{activity.type}</span>
                <span>•</span>
                <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
              </div>
              <a
                href={`/content/${activity.content.id}`}
                className="text-blue-600 hover:underline"
              >
                {activity.content.title}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};