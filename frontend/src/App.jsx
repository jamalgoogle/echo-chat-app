import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ChatApp from './pages/ChatApp.jsx';

function Gate({ children, requireUser }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="grid h-full place-items-center text-slate-500">Loading…</div>;
  if (requireUser && !user) return <Navigate to="/login" replace />;
  if (!requireUser && user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const loadMe = useAuthStore((s) => s.loadMe);
  useEffect(() => {
    loadMe();
  }, [loadMe]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Gate><Login /></Gate>} />
        <Route path="/register" element={<Gate><Register /></Gate>} />
        <Route path="/" element={<Gate requireUser><ChatApp /></Gate>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
