/**
 * Firebase Configuration and Service Initialization
 *
 * This module serves as the central configuration point for Firebase services in the application.
 * It initializes Firebase with environment variables and exports service instances for use throughout the app.
 *
 * @module firebase
 * @requires firebase/app
 * @requires firebase/auth
 * @requires firebase/firestore
 * @requires firebase/storage
 *
 * @example
 * // Import Firebase services
 * import { auth, db, storage } from '@/firebase';
 *
 * // Use authentication
 * await signInWithEmailAndPassword(auth, email, password);
 *
 * // Use Firestore
 * await addDoc(db.collection('users'), userData);
 *
 * // Use Storage
 * await uploadBytes(storage.ref('images/photo.jpg'), file);
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Firebase Configuration Object
 *
 * Contains all necessary configuration values for Firebase services.
 * These values are loaded from environment variables for security.
 *
 * Required Environment Variables:
 * - VITE_FIREBASE_API_KEY: Your Firebase API key
 * - VITE_FIREBASE_AUTH_DOMAIN: Your Firebase Auth domain (project-id.firebaseapp.com)
 * - VITE_FIREBASE_PROJECT_ID: Your Firebase project ID
 * - VITE_FIREBASE_STORAGE_BUCKET: Your Firebase storage bucket (project-id.appspot.com)
 * - VITE_FIREBASE_MESSAGING_SENDER_ID: Your Firebase messaging sender ID
 * - VITE_FIREBASE_APP_ID: Your Firebase app ID
 *
 */
const firebaseConfig = {
  /**
   * Firebase API Key
   * Used to authenticate requests to Firebase services
   * @see https://firebase.google.com/docs/web/setup#available-libraries
   */
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,

  /**
   * Firebase Authentication Domain
   * The domain where Firebase Authentication is hosted
   * Format: project-id.firebaseapp.com
   */
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,

  /**
   * Firebase Project ID
   * The unique identifier for your Firebase project
   */
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,

  /**
   * Firebase Storage Bucket
   * The URL where your Firebase Storage is hosted
   * Format: project-id.appspot.com
   */
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,

  /**
   * Firebase Messaging Sender ID
   * Used for Firebase Cloud Messaging (FCM)
   */
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,

  /**
   * Firebase App ID
   * The unique identifier for your Firebase app
   */
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Initialize Firebase App
 *
 * Creates and initializes a Firebase app instance with the provided configuration.
 * This is the first step in using Firebase services.
 *
 * @throws {Error} If Firebase initialization fails
 */
const app = initializeApp(firebaseConfig);

/**
 * Firebase Authentication Service
 *
 * Provides authentication functionality including:
 * - Email/password authentication
 * - Social authentication
 * - Phone number authentication
 * - Custom authentication
 *
 * @example
 * // Sign in with email and password
 * import { signInWithEmailAndPassword } from 'firebase/auth';
 * await signInWithEmailAndPassword(auth, email, password);
 *
 * // Sign out
 * import { signOut } from 'firebase/auth';
 * await signOut(auth);
 */
export const auth = getAuth(app);

/**
 * Firebase Firestore Service
 *
 * Provides database functionality including:
 * - Real-time data synchronization
 * - Offline data persistence
 * - Complex queries
 * - Batch operations
 *
 * @example
 * // Add a document
 * import { collection, addDoc } from 'firebase/firestore';
 * await addDoc(collection(db, 'users'), userData);
 *
 * // Get documents
 * import { collection, getDocs } from 'firebase/firestore';
 * const querySnapshot = await getDocs(collection(db, 'users'));
 */
export const db = getFirestore(app);

/**
 * Firebase Storage Service
 *
 * Provides file storage functionality including:
 * - File upload/download
 * - File metadata management
 * - File deletion
 * - File URL generation
 *
 * @example
 * // Upload a file
 * import { ref, uploadBytes } from 'firebase/storage';
 * await uploadBytes(ref(storage, 'images/photo.jpg'), file);
 *
 * // Get download URL
 * import { ref, getDownloadURL } from 'firebase/storage';
 * const url = await getDownloadURL(ref(storage, 'images/photo.jpg'));
 */
export const storage = getStorage(app);
