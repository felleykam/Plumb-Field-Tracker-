/*
 * Plumbing Board App
 *
 * This script initializes the Firebase backend, creates and manages
 * multiple GridStack boards, and handles adding/updating cards. The goal
 * is to provide a Trello‑like experience without any subscription fees.
 *
 * NOTE: Replace the placeholder values in firebaseConfig with your actual
 * Firebase project configuration. These values can be found in your
 * Firebase console under Project settings > General.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc as firestoreDoc,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// -----------------------------------------------------------------------------

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVgKDiwse6L8S4sf1MYvyEPInwtNfMaMg",
  authDomain: "field-tracker-155c5.firebaseapp.com",
  projectId: "field-tracker-155c5",
  storageBucket: "field-tracker-155c5.appspot.com",
  messagingSenderId: "553791143216",
  appId: "1:553791143216:web:b54acd483a162d7c761cf5"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// -----------------------------------------------------------------------------
// Application state
// (The rest of your code below remains unchanged.)
