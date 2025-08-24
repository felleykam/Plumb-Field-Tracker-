/*
 * Plumbing Board App
 *
 * This script initializes the Firebase backend, creates and manages
 * multiple GridStack boards, and handles adding/updating cards. The goal
 * is to provide a Trello‑like experience without any subscription fees.
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
// -----------------------------------------------------------------------------
let currentBoardKey = 'jobs';

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
function addCardToGrid(boardKey, docId, data) {
  const board = boards[boardKey];
  const grid = board.grid;
  const item = document.createElement('div');
  item.className = 'grid-stack-item';
  item.dataset.id = docId;
  item.setAttribute('gs-x', data.x ?? 0);
  item.setAttribute('gs-y', data.y ?? 0);
  item.setAttribute('gs-w', data.w ?? 3);
  item.setAttribute('gs-h', data.h ?? 1);

  const content = document.createElement('div');
  content.className = 'grid-stack-item-content';
  content.style.backgroundColor = data.color || '#54a0ff';
  const titleEl = document.createElement('h4');
  titleEl.textContent = data.title || 'Untitled';
  const descEl = document.createElement('p');
  descEl.textContent = data.description || '';
  content.appendChild(titleEl);
  content.appendChild(descEl);
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

let tempCoords = null;

function openModal() {
  if (currentBoardKey === 'jobs') {
    coordsField.classList.remove('hidden');
  } else {
    coordsField.classList.add('hidden');
  }
  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
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
const sidebarItems = document.querySelectorAll('#sidebar li');
sidebarItems.forEach((item) => {
  item.addEventListener('click', () => {
    sidebarItems.forEach((i) => i.classList.remove('active'));
    item.classList.add('active');

    const boardKey = item.dataset.board;
    currentBoardKey = boardKey;
    Object.keys(boards).forEach((key) => {
      boards[key].element.classList.add('hidden');
    });
    boards[boardKey].element.classList.remove('hidden');
  });
});

// -----------------------------------------------------------------------------
// Initial load
// -----------------------------------------------------------------------------
loadBoards().catch((err) => console.error('Error loading boards:', err));
