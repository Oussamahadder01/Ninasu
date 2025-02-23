import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, CheckCircle, TrendingUp, Users, Send, Facebook, Twitter, Instagram, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HomeContentCard } from '@/components/HomeContentCard';
import { getContents, voteExercise } from '@/lib/api';
import { Content, VoteValue } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [popularExercises, setPopularExercises] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchPopularExercises();
  }, []);

  const fetchPopularExercises = async () => {
    try {
      setLoading(true);
      const data = await getContents({ 
        sort: 'most_upvoted', 
        type: 'exercise', 
        per_page: 3 
      });
      setPopularExercises(data.results);
    } catch (err) {
      console.error('Failed to fetch popular exercises:', err);
      setError('Failed to load popular exercises. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id: string, value: VoteValue) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const updatedExercise = await voteExercise(id, value);
      setPopularExercises(prevExercises =>
        prevExercises.map(exercise =>
          exercise.id === id ? updatedExercise : exercise
        )
      );
    } catch (err) {
      console.error('Failed to vote:', err);
      setError('Failed to register your vote. Please try again.');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Nt3almou..!
          </h1>
          <p className="text-xl text-gray-300 mb-12">
            Progressez en mathématiques avec des exercices adaptés à votre niveau
          </p>
          
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-8">
            <input
              type="text"
              placeholder="Rechercher un exercice..."
              className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="w-5 h-5" />
            </button>
          </form>

          <Link to="/exercises">
            <Button className="bg-white hover:bg-gray-100 text-white px-8 py-3 rounded-full text-lg font-medium transition-all duration-300 transform hover:scale-105">
              Commencer à pratiquer
            </Button>
          </Link>
        </div>
      </section>

      {/* Popular Exercises */}
      <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div className="flex items-center mb-4 md:mb-0">
              <Sparkles className="w-8 h-8 text-yellow-500 mr-3" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Exercices populaires
              </h2>
            </div>
            <Link 
              to="/exercises" 
              className="group flex items-center text-red-600 hover:text-red-700 transition-colors duration-300"
            >
              <span className="mr-2 font-semibold">Voir tous les exercices</span>
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4 mb-6">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {popularExercises.map(exercise => (
                <HomeContentCard 
                  key={exercise.id} 
                  content={exercise} 
                  onVote={handleVote}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Pourquoi nous choisir
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 text-center hover:transform hover:scale-105 transition-all duration-300 shadow-lg">
              <CheckCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Exercices vérifiés par des profs
              </h3>
              <p className="text-gray-600">
                Contenu de qualité validé par des enseignants expérimentés
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center hover:transform hover:scale-105 transition-all duration-300 shadow-lg">
              <TrendingUp className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Progression adaptée
              </h3>
              <p className="text-gray-600">
                Des exercices qui suivent votre rythme d'apprentissage
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center hover:transform hover:scale-105 transition-all duration-300 shadow-lg">
              <Users className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Communauté active
              </h3>
              <p className="text-gray-600">
                Échangez et progressez avec d'autres étudiants
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">1000+</div>
              <div className="text-gray-600">Exercices disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">5000+</div>
              <div className="text-gray-600">Étudiants actifs</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">3000+</div>
              <div className="text-gray-600">Solutions détaillées</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">85%</div>
              <div className="text-gray-600">Taux de réussite</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Nt3almou...!</h3>
            <p className="text-sm">
              Votre plateforme d'apprentissage des mathématiques
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Navigation</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-white transition-colors">Accueil</Link></li>
              <li><Link to="/exercises" className="hover:text-white transition-colors">Exercices</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">À propos</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Suivez-nous</h4>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Newsletter</h4>
            <div className="flex">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 px-4 py-2 bg-white/10 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <button className="px-4 py-2 bg-red-600 text-white rounded-r-lg hover:bg-red-700 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          © 2025 ExercicesMaths.ma. Tous droits réservés
        </div>
      </footer>
    </div>
  );
}
