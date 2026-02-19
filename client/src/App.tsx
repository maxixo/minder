import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';

import Login            from '@/pages/Login';
import Register         from '@/pages/Register';
import Home             from '@/pages/Home';
import DailyReflection  from '@/pages/DailyReflection';
import SelfCare         from '@/pages/SelfCare';
import EmotionalGuidance from '@/pages/EmotionalGuidance';
import Review           from '@/pages/Review';
import Analytics        from '@/pages/Analytics';
import Settings         from '@/pages/Settings';

import Layout           from '@/components/common/Layout';
import ProtectedRoute   from '@/components/common/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" richColors closeButton />
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index            element={<Home />} />
            <Route path="reflection" element={<DailyReflection />} />
            <Route path="selfcare"   element={<SelfCare />} />
            <Route path="emotional"  element={<EmotionalGuidance />} />
            <Route path="review"     element={<Review />} />
            <Route path="analytics"  element={<Analytics />} />
            <Route path="settings"   element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
