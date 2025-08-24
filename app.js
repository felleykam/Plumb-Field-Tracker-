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
// Firebase setup
// -----------------------------------------------------------------------------
// TODO: Fill in your own Firebase configuration here. This object is required
// to connect your frontend to the Firebase project you created earlier. See
// https://firebase.google.com/docs/web/setup for details.
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVgKDiwse6L8S4sf1MYvyEPInwtNfMaMg",
  authDomain: "field-tracker-155c5.firebaseapp.com",
  projectId: "field-tracker-155c5",
  storageBucket: "field-tracker-155c5.firebasestorage.app",
  messagingSenderId: "553791143216",
  appId: "1:553791143216:web:b54acd483a162d7c761cf5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// -----------------------------------------------------------------------------
// Application state
// -----------------------------------------------------------------------------
// Keep track of the currently selected board (e.g. jobs, forms, media, notes,
// measurements). Defaults to 'jobs'.
let currentBoardKey = 'jobs';

// This object holds references to each board's DOM element, GridStack instance,
// and Firestore collection. Additional boards can be added here if needed.
const boards = {
  jobs: {
    element: document.getElementById('jobsBoard'),
    grid: null,
    collection: collection(db, 'jobs'),
  },
  forms: {
    element: document.getElementById('formsBoard'),
    grid: null,
    collection: collection(db, 'forms'),
  },
  media: {
    element: document.getElementById('mediaBoard'),
    grid: null,
    collection: collection(db, 'media'),
  },
  notes: {
    element: document.getElementById('notesBoard'),
    grid: null,
    collection: collection(db, 'notes'),
  },
  measurements: {
    element: document.getElementById('measurementsBoard'),
    grid: null,
    collection: collection(db, 'measurements'),
  },
};

// -----------------------------------------------------------------------------
// GridStack initialization
// -----------------------------------------------------------------------------
// Create a GridStack instance for each board. The `float: true` option lets
// widgets flow around each other smoothly instead of pushing on drag.
Object.keys(boards).forEach((key) => {
  const board = boards[key];
  board.grid = GridStack.init(
    {
      float: true,
      cellHeight: 80,
      disableOneColumnMode: false,
      resizable: {
        handles: 'se',
      },
    },
    board.element
  );

  // Listen for position/size changes and persist them to Firestore
  board.grid.on('change', (event, items) => {
    items.forEach((item) => {
      const docId = item.el.dataset.id;
      if (!docId) return;
      const { x, y, w, h } = item;
      updateDoc(firestoreDoc(board.collection, docId), { x, y, w, h }).catch(
        (err) => console.error('Failed to update item layout:', err)
      );
    });
  });
});

// -----------------------------------------------------------------------------
// Data loading
// -----------------------------------------------------------------------------
// Fetch existing documents from Firestore for each board and render them.
async function loadBoards() {
  for (const key of Object.keys(boards)) {
    const board = boards[key];
    try {
      const snapshot = await getDocs(board.collection);
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        addCardToGrid(key, docSnap.id, data);
      });
    } catch (error) {
      console.error(`Error loading ${key} board:`, error);
    }
  }
}

// -----------------------------------------------------------------------------
// Card creation and rendering
// -----------------------------------------------------------------------------
// Helper to create and insert a card into the specified board's grid. Accepts
// initial position and size from data (falling back to defaults if missing).
function addCardToGrid(boardKey, docId, data) {
  const board = boards[boardKey];
  const grid = board.grid;
  const item = document.createElement('div');
  item.className = 'grid-stack-item';
  item.dataset.id = docId;
  // Use saved or default positions
  item.setAttribute('gs-x', data.x ?? 0);
  item.setAttribute('gs-y', data.y ?? 0);
  item.setAttribute('gs-w', data.w ?? 3);
  item.setAttribute('gs-h', data.h ?? 1);

  // Card content
  const content = document.createElement('div');
  content.className = 'grid-stack-item-content';
  content.style.backgroundColor = data.color || '#54a0ff';
  const titleEl = document.createElement('h4');
  titleEl.textContent = data.title || 'Untitled';
  const descEl = document.createElement('p');
  descEl.textContent = data.description || '';
  content.appendChild(titleEl);
  content.appendChild(descEl);
  // If coordinates exist, display them
  if (data.coords) {
    const coordsEl = document.createElement('p');
    coordsEl.style.fontSize = '0.75em';
    coordsEl.style.opacity = '0.7';
    coordsEl.textContent = `(${data.coords.lat.toFixed(5)}, ${data.coords.lng.toFixed(5)})`;
    content.appendChild(coordsEl);
  }
  item.appendChild(content);
  grid.addWidget(item);
}

// -----------------------------------------------------------------------------
// Modal handling
// -----------------------------------------------------------------------------
const modal = document.getElementById('modal');
const itemForm = document.getElementById('itemForm');
const addItemBtn = document.getElementById('addItemBtn');
const cancelBtn = document.getElementById('cancelBtn');
const getCoordsBtn = document.getElementById('getCoordsBtn');
const coordsField = document.getElementById('coordsField');

let tempCoords = null; // temporarily holds coordinates between button press and save

function openModal() {
  // Show or hide coordinate field only for Jobs board
  if (currentBoardKey === 'jobs') {
    coordsField.classList.remove('hidden');
  } else {
    coordsField.classList.add('hidden');
  }
  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
  // Reset form values
  itemForm.reset();
  tempCoords = null;
  document.getElementById('itemCoords').value = '';
}

addItemBtn.addEventListener('click', () => {
  openModal();
});

cancelBtn.addEventListener('click', (e) => {
  e.preventDefault();
  closeModal();
});

// Capture geolocation when user clicks "Use Current Location". If location
// permission is not granted, an error is logged and coordinates remain null.
getCoordsBtn.addEventListener('click', async () => {
  if (!('geolocation' in navigator)) {
    alert('Geolocation is not supported by your browser.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      tempCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      document.getElementById('itemCoords').value = `${tempCoords.lat.toFixed(5)}, ${tempCoords.lng.toFixed(5)}`;
    },
    (err) => {
      console.error('Error obtaining geolocation', err);
    }
  );
});

// Handle form submission: save the new card to Firestore and render it on the
// current board. After saving, close the modal.
itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('itemTitle').value.trim();
  const description = document.getElementById('itemDesc').value.trim();
  const color = document.getElementById('itemColor').value;

  const board = boards[currentBoardKey];
  try {
    const docRef = await addDoc(board.collection, {
      title,
      description,
      color,
      coords: tempCoords || null,
      x: 0,
      y: 0,
      w: 3,
      h: 1,
    });
    // Add the card to the UI
    addCardToGrid(currentBoardKey, docRef.id, {
      title,
      description,
      color,
      coords: tempCoords,
      x: 0,
      y: 0,
      w: 3,
      h: 1,
    });
  } catch (error) {
    console.error('Error adding document:', error);
  }
  closeModal();
});

// -----------------------------------------------------------------------------
// Sidebar navigation
// -----------------------------------------------------------------------------
// When a sidebar item is clicked, switch the visible board. Only the selected
// board's grid is visible and interactive; others are hidden.
const sidebarItems = document.querySelectorAll('#sidebar li');
sidebarItems.forEach((item) => {
  item.addEventListener('click', () => {
    // Remove 'active' class from all items and assign to the clicked one
    sidebarItems.forEach((i) => i.classList.remove('active'));
    item.classList.add('active');

    const boardKey = item.dataset.board;
    currentBoardKey = boardKey;
    // Hide all boards and show the selected one
    Object.keys(boards).forEach((key) => {
      boards[key].element.classList.add('hidden');
    });
    boards[boardKey].element.classList.remove('hidden');
  });
});

// -----------------------------------------------------------------------------
// Initial load
// -----------------------------------------------------------------------------
// Load existing cards from Firestore on initial page load.
loadBoards().catch((err) => console.error('Error loading boards:', err));