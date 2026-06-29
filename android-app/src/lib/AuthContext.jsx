import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let unsubUser = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous user listener if it exists
      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        unsubUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || userData.name,
              photoURL: firebaseUser.photoURL,
              ...userData
            });
            setIsAuthenticated(true);

            if (userData.status === 'pending') {
              setAuthError({ type: 'user_pending', message: 'Your account is pending admin approval.' });
            } else if (userData.status === 'rejected') {
              setAuthError({ type: 'user_rejected', message: 'Your account has been rejected.' });
            } else {
              setAuthError(null);
            }
          } else {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              role: 'student',
              status: 'pending'
            });
            setIsAuthenticated(true);
            setAuthError({ type: 'user_not_registered', message: 'User profile not found.' });
          }
          setIsLoadingAuth(false);
          setAuthChecked(true);
        }, (error) => {
          console.error("Error fetching user data:", error);
          // If permission denied, we still want to stop loading
          setIsLoadingAuth(false);
          setAuthChecked(true);
        });
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  const logout = async (shouldRedirect = true) => {
    try {
      await signOut(auth);
      if (shouldRedirect) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth: async () => {},
      checkAppState: async () => {}
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
