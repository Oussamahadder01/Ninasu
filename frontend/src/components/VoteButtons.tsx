import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface VoteButtonsProps {
  initialVotes: number;
  onVote: (type: 'up' | 'down' | 'none') => void;
  vertical?: boolean;
  userVote?: 'up' | 'down' | 'none';
  onClick?: (e: React.MouseEvent) => void; // Add onClick prop
}

export function VoteButtons({ 
  initialVotes, 
  onVote, 
  vertical = true, 
  userVote: initialUserVote = 'none',
  onClick // Use onClick prop
}: VoteButtonsProps) {
  const [userVote, setUserVote] = useState<'up' | 'down' | 'none'>(initialUserVote);
  const [score, setScore] = useState(initialVotes);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setScore(initialVotes);
  }, [initialVotes]);

  useEffect(() => {
    setUserVote(initialUserVote);
  }, [initialUserVote]);

  const handleVote = (type: 'up' | 'down') => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    let newVote: 'up' | 'down' | 'none';
    let scoreDelta = 0;

    if (userVote === type) {
      // Clicking the same button - remove vote
      newVote = 'none';
      scoreDelta = type === 'up' ? -1 : 1;
    } else if (userVote === 'none') {
      // No previous vote
      newVote = type;
      scoreDelta = type === 'up' ? 1 : -1;
    } else {
      // Changing vote
      newVote = type;
      scoreDelta = type === 'up' ? 2 : -2;
    }

    setUserVote(newVote);
    setScore(prevScore => prevScore + scoreDelta);
    onVote(newVote);
  };

  const containerClasses = vertical
    ? 'flex flex-col items-center bg-white rounded-l-md py-2 px-2'
    : 'flex items-center gap-1 bg-white rounded-full py-1 px-2';

  return (
    <div className={containerClasses} onClick={onClick}> {/* Use onClick prop */}
      {/* Bouton Upvote */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleVote("up");
        }}
        className={`p-1 rounded-sm transition-colors ${
          userVote === "up" ? "text-orange-500" : "text-gray-400 hover:text-orange-500 hover:bg-orange-500/10"
        }`}
        aria-label="Upvote"
      >
        <svg
          fill="currentColor"
          height="16"
          width="16"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M10 2L2 12h6v6h4v-6h6L10 2z" />
        </svg>
      </button>

      {/* Score affiché */}
      <span
        className={`text-sm font-medium ${
          userVote === "up"
            ? "text-orange-500"
            : userVote === "down"
            ? "text-violet-500"
            : "text-gray-500"
        } ${vertical ? "my-1" : "mx-1"}`}
      >
        {score}
      </span>

      {/* Bouton Downvote */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleVote("down");
        }}
        className={`p-1 rounded-sm transition-colors ${
          userVote === "down" ? "text-violet-500" : "text-gray-400 hover:text-violet-500 hover:bg-violet-500/10"
        }`}
        aria-label="Downvote"
      >
        <svg
          fill="currentColor"
          height="16"
          width="16"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M10 18l8-10h-6V2H8v6H2l8 10z" />
        </svg>
      </button>
    </div>
  );
}
