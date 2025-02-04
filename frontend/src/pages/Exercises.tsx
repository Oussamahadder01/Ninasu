import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ContentCard } from '../components/ContentCard';
import { Filters } from '../components/Filters';
import { getContents } from '../lib/api';
import { Content } from '@/types';

export const Exercises = () => {
  const [exercises, setExercises] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    difficulty: '',
    type: 'exercise', // Filtre par défaut pour les exercices
  });

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const data = await getContents(filters);
        setExercises(data);
      } catch (err) {
        setError('Failed to fetch exercises. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Exercises</h1>
        <Link to="/new">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Add Exercise
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-8">
        <div className="col-span-1">
          <Filters onFilterChange={handleFilterChange} />
        </div>
        <div className="col-span-3">
          <div className="grid grid-cols-1 gap-6">
            {exercises.map((exercise) => (
              <ContentCard key={exercise.id} content={exercise} onVote={(id, type) => console.log('Vote:', id, type)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};