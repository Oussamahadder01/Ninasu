import {useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { getContents, voteExercise, deleteContent } from '../lib/api';
import { Content, SortOption, Difficulty, VoteValue } from '../types';
import { Filters } from '../components/Filters';
import { SortDropdown } from '../components/SortDropdown';
import { ContentList } from '../components/ContentList';
import { useNavigate } from 'react-router-dom';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const ITEMS_PER_PAGE = 20;

export const ExerciseList = () => {
  const navigate = useNavigate();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<{
    classLevels: string[];
    subjects: string[];
    chapters: string[];
    difficulties: Difficulty[];
  }>({
    classLevels: [],
    subjects: [],
    chapters: [],
    difficulties: [],
  });
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchContents = async (isLoadMore = false) => {
    const setLoadingState = isLoadMore ? setLoadingMore : setLoading;
    try {
      setLoadingState(true);
      setError(null);
  
      const params = {
        ...filters,
        sort: sortBy,
        page,
        type: 'exercise',
        per_page: ITEMS_PER_PAGE
      };
  
      console.log("Fetching contents with params:", params);
  
      const data = await getContents(params);
      
      console.log("Received data:", data);
  
      setContents(prev => isLoadMore ? [...prev, ...data.results] : data.results);
      setTotalCount(data.count);
      setHasMore(!!data.next);
    } catch (err) {
      console.error('Error fetching contents:', err);
      setError('Failed to load exercises. Please try again.');
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    console.log("Sort or filters changed. New sort:", sortBy);
    setPage(1);
    fetchContents();
  }, [sortBy, filters]);
  useEffect(() => {
    if (page > 1) {
      fetchContents(true);
    }
  }, [page]);

  const handleVote = async (id: string, type: VoteValue) => {
    try {
      const updatedExercise = await voteExercise(id, type);
      setContents(prevContents => 
        prevContents.map(content => 
          content.id === id ? updatedExercise : content
        )
      );
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await deleteContent(id);
        setContents(prev => prev.filter(content => content.id !== id));
      } catch (err) {
        console.error('Failed to delete content:', err);
      }
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Exercises</h1>
          <p className="text-gray-600">
            Discover and practice with our collection of {totalCount} exercises
          </p>
        </div>
        <Link to="/new">
        <button className="bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-900 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2 font-medium w-full md:w-auto justify-center">
            <FontAwesomeIcon icon={faPlusCircle} />
              Ajouter un exercice
            </button>
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-3">
          <Filters onFilterChange={handleFilterChange} />
        </div>

        <div className="col-span-9">
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Sort by:</span>
              <SortDropdown 
                value={sortBy} 
                onChange={(newSort) => {
                  console.log("Sort changed to:", newSort);
                  setSortBy(newSort);
                }} 
              />
            </div>
            <div className="text-gray-600">
              {totalCount} exercises found
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : contents.length > 0 ? (
            <div className="space-y-4">
              <ContentList 
                contents={contents} 
                onVote={handleVote}
                onDelete={handleDelete}
                onEdit={(id) => navigate(`/edit/${id}`)}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No exercises found matching your criteria
            </div>
          )}

          {hasMore && (
            <div className="mt-8 text-center">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-900 hover:to-gray-800 text-white px-8"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Exercises'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
