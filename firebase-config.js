/**
 * ==============================================================================
 * SYED NABEEL AHMED - OFFICIAL FIREBASE INTEGRATION & AUTHENTICATION
 * ==============================================================================
 * Project: portfolio-911b8
 * Features:
 * - Firebase Web App Initialization
 * - Firebase Google Analytics (G-8B5EGSTKBN)
 * - Firebase Google OAuth & Email Authentication
 * - SHA-256 Cryptographic Passcode Verification
 * ==============================================================================
 */

const firebaseConfig = {
  apiKey: "AIzaSyDjVr7wYoff9QxusYF5_NX49wY8wxbTk7U",
  authDomain: "portfolio-1d97f.firebaseapp.com",
  projectId: "portfolio-1d97f",
  storageBucket: "portfolio-1d97f.firebasestorage.app",
  messagingSenderId: "299635279591",
  appId: "1:299635279591:web:bb0feb1206295c1bd34442",
  measurementId: "G-5EX55RGLCC"
};

// Authorized Admin Emails (Verified via Google OAuth)
const AUTHORIZED_ADMIN_EMAILS = [
  'nabeelahmedna7860@gmail.com'
];

// One-way SHA-256 Cryptographic Hash of Admin Passcode 'F5eNRs5sJ5gA7s5s'
const ADMIN_PASSCODE_SHA256 = 'e43969ccdf2440baf3d904077d4088ef99c167cb967a5104226f0b5cc8c06273';

class FirebaseAuthManager {
  constructor() {
    this.app = null;
    this.auth = null;
    this.analytics = null;
    this.currentUser = null;
    this.isAdminAuthenticated = false;
    this.initFirebase();
  }

  // Cryptographic One-Way SHA-256 hasher using native Web Crypto API
  async hashString(str) {
    const utf8 = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Initialize Firebase App, Auth & Analytics
  initFirebase() {
    try {
      if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
          this.app = firebase.initializeApp(firebaseConfig);
        } else {
          this.app = firebase.app();
        }

        // Initialize Firebase Auth
        if (typeof firebase.auth === 'function') {
          this.auth = firebase.auth();
          this.auth.onAuthStateChanged((user) => {
            this.handleAuthStateChange(user);
          });
        }

        // Initialize Firebase Google Analytics if supported
        if (typeof firebase.analytics === 'function' && firebaseConfig.measurementId) {
          try {
            this.analytics = firebase.analytics();
            console.log('Firebase Analytics initialized successfully.');
          } catch (analyticsErr) {
            console.warn('Firebase Analytics note:', analyticsErr.message);
          }
        }
      }
    } catch (err) {
      console.warn('Firebase initialization note:', err.message);
    }
  }

  handleAuthStateChange(user) {
    this.currentUser = user;
    if (user && (AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase()) || AUTHORIZED_ADMIN_EMAILS.length === 0)) {
      this.isAdminAuthenticated = true;
      this.notifyEditorState(true);
    } else {
      this.isAdminAuthenticated = false;
      this.notifyEditorState(false);
    }
  }

  // Google One-Click Sign-In
  async signInWithGoogle() {
    if (this.auth) {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      try {
        const result = await this.auth.signInWithPopup(provider);
        const user = result.user;
        if (AUTHORIZED_ADMIN_EMAILS.length > 0 && !AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
          await this.auth.signOut();
          throw new Error(`Unauthorized account (${user.email}). Only ${AUTHORIZED_ADMIN_EMAILS.join(', ')} is authorized.`);
        }
        return { success: true, user };
      } catch (error) {
        throw error;
      }
    } else {
      throw new Error('Firebase Auth is not available. Please sign in using your Admin Passcode.');
    }
  }

  // Email / Password Sign-In
  async signInWithEmailPassword(email, password) {
    if (this.auth) {
      try {
        const result = await this.auth.signInWithEmailAndPassword(email, password);
        return { success: true, user: result.user };
      } catch (error) {
        throw error;
      }
    } else {
      throw new Error('Firebase Auth is not available. Please sign in using your Admin Passcode.');
    }
  }

  // Passcode / SHA-256 Authentication
  async signInWithPasscode(passcode) {
    const inputHash = await this.hashString(passcode.trim());
    if (inputHash === ADMIN_PASSCODE_SHA256) {
      this.isAdminAuthenticated = true;
      localStorage.setItem('portfolio_admin_session', 'authenticated_passcode');
      localStorage.setItem('portfolio_admin_user', JSON.stringify({ email: 'nabeelahmedna7860@gmail.com', name: 'Syed Nabeel Ahmed' }));
      this.notifyEditorState(true);
      return { success: true };
    } else {
      throw new Error('Incorrect Admin Passcode. Access denied.');
    }
  }

  // Sign Out / Lock Session
  async signOut() {
    if (this.auth && this.auth.currentUser) {
      await this.auth.signOut();
    }
    this.isAdminAuthenticated = false;
    this.currentUser = null;
    localStorage.removeItem('portfolio_admin_session');
    localStorage.removeItem('portfolio_admin_user');
    this.notifyEditorState(false);
  }

  // Notify Editor UI to show/hide edit controls
  notifyEditorState(isAuthenticated) {
    if (window.portfolioEditor) {
      window.portfolioEditor.setAdminAccess(isAuthenticated);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (window.portfolioEditor) {
          window.portfolioEditor.setAdminAccess(isAuthenticated);
        }
      });
    }
  }
}

// Global instance
window.firebaseAuthManager = new FirebaseAuthManager();
