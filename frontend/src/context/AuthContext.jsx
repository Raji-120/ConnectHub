import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('connecthub_token'));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check current session from cookie / token
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/auth/me');
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
        localStorage.removeItem('connecthub_token');
        setToken(null);
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem('connecthub_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await axiosClient.post('/auth/login', { email, password });
      if (res.data?.success) {
        setUser(res.data.user);
        if (res.data.token) {
          localStorage.setItem('connecthub_token', res.data.token);
          setToken(res.data.token);
        }
        return { success: true, user: res.data.user };
      }
      throw new Error(res.data?.message || 'Login failed');
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Register handler
  const register = async (name, email, password, avatar) => {
    setAuthError(null);
    try {
      const res = await axiosClient.post('/auth/register', {
        name,
        email,
        password,
        avatar,
      });
      if (res.data?.success) {
        setUser(res.data.user);
        if (res.data.token) {
          localStorage.setItem('connecthub_token', res.data.token);
          setToken(res.data.token);
        }
        return { success: true, user: res.data.user };
      }
      throw new Error(res.data?.message || 'Registration failed');
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (err) {
      console.warn('Logout error (clearing local state anyway):', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('connecthub_token');
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      const res = await axiosClient.put('/auth/profile', profileData);
      if (res.data?.success) {
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      throw new Error(res.data?.message || 'Update profile failed');
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        authError,
        login,
        register,
        logout,
        updateProfile,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
