import React, { useState, useEffect } from 'react';
import { ContentList } from '../components/ContentList';
import { Filters } from '../components/Filters';
import { SortDropdown } from '../components/SortDropdown';
import { getContents, voteExercise } from '../lib/api';
import { Content, SortOption, VoteValue } from '../types';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LessonList = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<{
    type?: string;
    subject?: string;
    difficulty?: string;
    chapter?: string;
  }>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchContents = async () => {
    try {
      setError(null);
      setLoading(true);

      const params = {
        ...filters,
        sort: sortBy,
        page,
        type: 'course'
      };

      const data = await getContents(params);
      
      if (Array.isArray(data)) {
        setContents(prevContents => 
          page === 1 ? data : [...prevContents, ...data]
        );
        setHasMore(data.length === 10);
      } else {
        console.error('Invalid data format received:', data);
        setError('Failed to load lessons: Invalid data format');
      }
    } catch (err) {
      console.error('Error fetching contents:', err);
      setError('Failed to load lessons. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [page, sortBy, filters.type, filters.subject, filters.difficulty, filters.chapter]);

  const handleVote = async (id: string, type: VoteValue) => {
    try {
      await voteExercise(id, type);
      fetchContents();
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleFilterChange = (newFilters: {
    classLevels: string[];
    subjects: string[];
    chapters: string[];
    difficulties: Difficulty[];
  }) => {
    setPage(1);
    setContents([]);
    setFilters(newFilters);
  };

  const handleSortChange = (newSort: SortOption) => {
    setPage(1);
    setContents([]);
    setSortBy(newSort);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Lessons</h1>
        <Link to="/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Lesson
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-8">
        <div className="col-span-1">
          <Filters onFilterChange={handleFilterChange} />
        </div>
        
        <div className="col-span-3">
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Sort by:</span>
              <SortDropdown value={sortBy} onChange={handleSortChange} />
            </div>
            <div className="text-gray-600">
              {contents.length} lessons found
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {loading && page === 1 ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {contents.length > 0 ? (
                  <ContentList contents={contents} onVote={handleVote} />
                ) : !loading && (
                  <div className="text-center py-12 text-gray-500">
                    No lessons found matching your criteria
                  </div>
                )}
                
                {hasMore && (
                  <div className="mt-8 text-center">
                    <Button
                      variant="secondary"
                      onClick={handleLoadMore}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          Loading...
                        </div>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};