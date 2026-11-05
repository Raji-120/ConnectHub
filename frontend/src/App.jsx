import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <SocketProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Dashboard Route */}
                <Route
                  path="/dashboard/*"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Default Redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* 404 Fallback */}
                <Route
                  path="*"
                  element={
                    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-center p-4">
                      <h1 className="text-6xl font-extrabold text-brand-500">404</h1>
                      <p className="mt-3 text-gray-300 font-semibold">Page Not Found</p>
                      <a
                        href="/dashboard"
                        className="mt-6 px-4 py-2 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-500 transition"
                      >
                        Back to Home
                      </a>
                    </div>
                  }
                />
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
