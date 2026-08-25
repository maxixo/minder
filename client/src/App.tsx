import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

import Layout           from '@/components/common/Layout';
import ProtectedRoute   from '@/components/common/ProtectedRoute';
import PublicOnlyRoute  from '@/components/common/PublicOnlyRoute';

const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const Welcome = lazy(() => import('@/pages/Welcome'));
const Home = lazy(() => import('@/pages/Home'));
const DailyReflection = lazy(() => import('@/pages/DailyReflection'));
const SelfCare = lazy(() => import('@/pages/SelfCare'));
const EmotionalGuidance = lazy(() => import('@/pages/EmotionalGuidance'));
const Review = lazy(() => import('@/pages/Review'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Inspiration = lazy(() => import('@/pages/Inspiration'));
const Share = lazy(() => import('@/pages/Share'));
const Settings = lazy(() => import('@/pages/Settings'));

const RouteLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-sage-50 dark:bg-[#0f1712]">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-sage-200 border-t-sage-600 dark:border-white/10 dark:border-t-sage-400" />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Toaster position="top-right" richColors closeButton />
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/share" element={<Share />} />
              <Route path="/export" element={<Share />} />
              <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
              <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Home />} />
                <Route path="/reflection" element={<DailyReflection />} />
                <Route path="/selfcare" element={<SelfCare />} />
                <Route path="/emotional" element={<EmotionalGuidance />} />
                <Route path="/review" element={<Review />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/inspiration" element={<Inspiration />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
