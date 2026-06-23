import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './components/common/ProtectedRoute.jsx';
import AppLayout from './components/common/AppLayout.jsx';
import Feedback from './pages/Feedback.jsx';
import AdminFeedback from './pages/admin/AdminFeedback.jsx';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Matching from './pages/Matching.jsx';
import Requests from './pages/Requests.jsx';
import Chats from './pages/Chats.jsx';
import ChatRoom from './pages/ChatRoom.jsx';
import Profile from './pages/Profile.jsx';
import PublicProfile from './pages/PublicProfile.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import NotFound from './pages/NotFound.jsx';
import ForgotPassword from './pages/ForgetPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/privacy" element={<Privacy />} />
<Route path="/terms" element={<Terms />} />

      {/* Authenticated app */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/match" element={<Matching />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/chats/:matchId" element={<ChatRoom />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/users/:id" element={<PublicProfile />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route
  path="/admin/feedback"
  element={
    <AdminRoute>
      <AdminFeedback />
    </AdminRoute>
  }
/>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
