import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogIn, LogOut, BookOpen, GraduationCap, Home } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  return (
    <nav className="navbar bg-gradient-to-r from-gray-900 to-red-900 border-b border-gray-700/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 px-8">
          {/* Logo and main navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center text-white">
              <GraduationCap className="w-6 h-6 mr-2" />
              <span className="text-xl font-bold">Nt3almou..!</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/" className="text-gray-400 hover:text-red-500">
                <Home className="w-4 h-4 mr-1" />
                Home
              </Link>
              <Link to="/exercises" className="text-gray-400 hover:text-red-500">
                <BookOpen className="w-4 h-4 mr-1" />
                Exercises
              </Link>
              <Link to="/lessons" className="text-gray-400 hover:text-red-500">
                <GraduationCap className="w-4 h-4 mr-1" />
                Lessons
              </Link>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-xl px-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search for exercises, lessons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-300"
              />
              <Search className="absolute right-3 top-3 text-gray-500" />
            </form>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="relative group">
                  <button className="text-gray-400 hover:text-red-500 flex items-center gap-2">
                    <img
                      src={user?.avatar || '/avatar-placeholder.jpg'}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                    <span>{user?.username}</span>
                    <i className="fas fa-chevron-down text-xs"></i>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                    <Link
                      to={`/profile/${user?.username}`}
                      className="block px-4 py-2 text-gray-800 hover:bg-red-50 hover:text-red-500"
                    >
                      <User className="w-4 h-4 mr-1" />
                      Profile
                    </Link>
                    <Link
                      to="/saved"
                      className="block px-4 py-2 text-gray-800 hover:bg-red-50 hover:text-red-500"
                    >
                      <i className="far fa-bookmark mr-2"></i>Saved
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-gray-800 hover:bg-red-50 hover:text-red-500"
                    >
                      <i className="fas fa-cog mr-2"></i>Settings
                    </Link>
                    <hr className="my-2" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-800 hover:bg-red-50 hover:text-red-500"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Logout
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="flex items-center space-x-1">
                    <LogIn className="w-5 h-5" />
                    <span>Login</span>
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="button-primary flex items-center space-x-1">
                    <User className="w-5 h-5" />
                    <span>Sign Up</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
