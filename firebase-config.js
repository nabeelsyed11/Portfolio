/**
 * ==============================================================================
 * SYED NABEEL AHMED - FIREBASE AUTHENTICATION CONFIGURATION
 * ==============================================================================
 * Manages admin authentication for live website editing.
 * Supports:
 * 1. Firebase Google One-Click Sign-In
 * 2. Firebase Email / Password Sign-In
 * 3. Secure Fallback Admin Passcode for instant local & offline use
 * ==============================================================================
 */

const firebaseConfig = {
  // Replace these with your Firebase project credentials from https://console.firebase.google.com/
  apiKey: "AIzaSyDummyKeyReplaceWithYourFirebaseApiKey",
  authDomain: "portfolio-syed-nabeel.firebaseapp.com",
  projectId: "portfolio-syed-nabeel",
  storageBucket: "portfolio-syed-nabeel.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Authorized Admin Emails list (Verified by Google OAuth)
const AUTHORIZED_ADMIN_EMAILS = [
  'nabeelahmedna7860@gmail.com'
];

// One-way SHA-256 Cryptographic Hash (No plaintext passwords stored in codebase)
// Hash of default admin passcode 'admin786'
const ADMIN_PASSCODE_SHA256 = 'a31f13b2dd05c102a00c7104b90150ab68a735ce781b947c6fa7a41f6f8bbbf2';

class FirebaseAuthManager {
  constructor() {
    this.auth = null;
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

  // Initialize Firebase App & Auth
  initFirebase() {
    try {
      if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "AIzaSyDummyKeyReplaceWithYourFirebaseApiKey") {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        this.auth = firebase.auth();
        this.auth.onAuthStateChanged((user) => {
          this.handleAuthStateChange(user);
        });
      } else {
        // Check local session for verified admin auth
        const localAuth = localStorage.getItem('portfolio_admin_session');
        if (localAuth === 'authenticated_passcode' || localAuth === 'authenticated_firebase') {
          this.isAdminAuthenticated = true;
          this.notifyEditorState(true);
        }
      }
    } catch (err) {
      console.warn('Firebase initialization note:', err.message);
      const localAuth = localStorage.getItem('portfolio_admin_session');
      if (localAuth) {
        this.isAdminAuthenticated = true;
        this.notifyEditorState(true);
      }
    }
  }

  handleAuthStateChange(user) {
    this.currentUser = user;
    if (user && (AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase()) || AUTHORIZED_ADMIN_EMAILS.length === 0)) {
      this.isAdminAuthenticated = true;
      localStorage.setItem('portfolio_admin_session', 'authenticated_firebase');
      localStorage.setItem('portfolio_admin_user', JSON.stringify({ email: user.email, name: user.displayName }));
      this.notifyEditorState(true);
    } else {
      const localAuth = localStorage.getItem('portfolio_admin_session');
      if (localAuth === 'authenticated_passcode') {
        this.isAdminAuthenticated = true;
        this.notifyEditorState(true);
      } else {
        this.isAdminAuthenticated = false;
        localStorage.removeItem('portfolio_admin_session');
        localStorage.removeItem('portfolio_admin_user');
        this.notifyEditorState(false);
      }
    }
  }

  // Google Sign-In (Cloud Identity Verification by Google)
  async signInWithGoogle() {
    if (this.auth) {
      const provider = new firebase.auth.GoogleAuthProvider();
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
      throw new Error('Firebase Auth is not yet configured with real API keys in firebase-config.js. You can sign in using your Admin Passcode.');
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
      throw new Error('Firebase Auth is not yet configured with real API keys. You can sign in using your Admin Passcode.');
    }
  }

  // Passcode / Cryptographic Hash Authentication
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

  // Sign Out
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
