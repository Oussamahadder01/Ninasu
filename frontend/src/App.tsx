import { BrowserRouter as Router } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { NewContent } from './pages/NewContent';
import { EditExercise } from './pages/EditExercise';
import { EditSolution } from './pages/EditSolution';
import { Profile } from './pages/Profile';
import { ExerciseList } from './pages/ExerciseList';
import { ExerciseDetail } from './pages/ExerciseDetail';
import { LessonList } from './pages/LessonList';
import { Navbar } from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    interface WheelEventExtended extends WheelEvent {
      wheelDeltaY?: number;
    }

    const preventDefault = (e: WheelEventExtended): void => {
      // Vérifie si c'est un pavé tactile en regardant les propriétés spécifiques
      const isTouchpad = e.wheelDeltaY ? 
      e.wheelDeltaY === -3 * e.deltaY : 
      e.deltaMode === 0;

      if (e.ctrlKey && isTouchpad) {
      e.preventDefault();
      }
    };

    document.addEventListener('wheel', preventDefault, { passive: false });

    return () => {
      document.removeEventListener('wheel', preventDefault);
    };
  }, []);

  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-100">
            <Navbar />
            <Routes>
              {/* Vos routes existantes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/new" element={<NewContent />} />
              <Route path="/edit/:id" element={<EditExercise />} />
              <Route path="/solutions/:id/edit" element={<EditSolution />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/exercises" element={<ExerciseList />} />
              <Route path="/exercises/:id" element={<ExerciseDetail />} />
              <Route path="/lessons" element={<LessonList />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </div>
  );
}
export default App;
