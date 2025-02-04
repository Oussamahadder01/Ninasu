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

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <Routes>
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
  );
}

export default App;
