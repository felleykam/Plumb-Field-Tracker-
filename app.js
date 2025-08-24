/*
 * Hell — Plumb Field Tracker
 * Realtime Firestore (onSnapshot), GridStack layout persistence, file uploads to Storage,
 * geotag capture, and dark UI alignment.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc as firestoreDoc,
  onSnapshot,
  query,
  orderBy,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

/** *************************************************************
 * Firebase config:
 * - Uses window.FIREBASE_CONFIG if present (for env override),
 *   else falls back to your known project (update if needed).
 ************************************************************** */
const fallbackConfig = {
  apiKey: "AIzaSyDVgKDiwse6L8S4sf1MYvyEPInwtNfMaMg",
  authDomain: "field-tracker-155c5.firebaseapp.com",
  projectId: "field-tracker-155c5",
  storageBucket: "field-tracker-155c5.appspot.com",
  messagingSenderId: "553791143216",
  appId: "1:553791143216:web:b54acd483a162d7c761cf5"
};
const firebaseConfig = window.FIREBASE_CONFIG || fallbackConfig;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

/** *************************************************************
 * Boards
 ************************************************************** */
const boardsMeta = {
  jobs:         { title: 'Jobs',         coll: 'jobs' },
  forms:        { title: 'Forms',        coll: 'forms' },
  media:        { title: 'Media',        coll: 'media' },
  notes:        { title: 'Notes',        coll: 'notes' },
  measurements: { title: 'Measurements', coll: 'measurements' },
};

let currentBoardKey = 'jobs';
const boards = {}; // { key: { grid, element, collection } }

const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** *************************************************************
 * DOM
 ************************************************************** */
const sidebarItems = qsa('#sidebar li');
const addItemBtn = qs('#addItemBtn');

const modal = qs('#modal');
const closeModalBtn = qs('#closeModalBtn');
const cancelBtn = qs('#cancelBtn');
const itemForm = qs('#itemForm');
const fileInput = qs('#fileInput');
const getCoordsBtn = qs('#getCoordsBtn');

/** *************************************************************
 * Modal controls
 ************************************************************** */
function openModal() {
  modal.classList.remove('hidden');
}
function closeModal() {
  modal.classList.add('hidden');
  itemForm.reset();
  if (fileInput) fileInput.value = '';
}
addItemBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

/** *************************************************************
 * Sidebar switching
 ************************************************************** */
sidebarItems.forEach((item) => {
  item.addEventListener('click', () => {
    sidebarItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    const boardKey = item.dataset.board;
    currentBoardKey = boardKey;

    qsa('.board').forEach(b => b.classList.add('hidden'));
    boards[boardKey].element.classList.remove('hidden');
  });
});

/** *************************************************************
 * Geolocation
 ************************************************************** */
getCoordsBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation not supported by this browser.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      itemForm.elements.coords.value = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    },
    (err) => alert(`Location error: ${err.message}`)
  );
});

/** *************************************************************
 * Grid / Card helpers
 ************************************************************** */
function boardContainerEl(key) {
  return document.querySelector(`.grid-stack[data-board="${key}"]`);
}

function createCardEl(data) {
  const item = document.createElement('div');
  item.className = 'grid-stack-item';
  item.dataset.id = data.id;

  if (typeof data.x === 'number') item.setAttribute('gs-x', data.x);
  if (typeof data.y === 'number') item.setAttribute('gs-y', data.y);
  item.setAttribute('gs-w', data.w ?? 3);
  item.setAttribute('gs-h', data.h ?? 2); // default taller for readability

  const content = document.createElement('div');
  content.className = 'grid-stack-item-content';
  if (data.color) content.style.backgroundColor = data.color;

  // Title + Desc
  const title = document.createElement('h4');
  title.textContent = data.title || 'Untitled';

  const desc = document.createElement('p');
  desc.textContent = data.description || '';

  content.append(title, desc);

  // Tests
  if (data.preRough || data.subRough) {
    const tests = document.createElement('div');
    tests.className = 'tests';
    if (data.preRough) {
      const t = document.createElement('span');
      t.className = `badge ${data.preRough === 'PASS' ? 'pass' : 'fail'}`;
      t.textContent = `Pre-Rough: ${data.preRough}`;
      tests.appendChild(t);
    }
    if (data.subRough) {
      const t = document.createElement('span');
      t.className = `badge ${data.subRough === 'PASS' ? 'pass' : 'fail'}`;
      t.textContent = `Sub-Rough: ${data.subRough}`;
      tests.appendChild(t);
    }
    content.appendChild(tests);
  }

  // Coordinates
  if (data.coords) {
    const c = document.createElement('p');
    c.className = 'coords';
    c.textContent = `@ ${data.coords}`;
    content.appendChild(c);
  }

  // Files
  if (Array.isArray(data.files) && data.files.length) {
    const list = document.createElement('ul');
    list.className = 'files';
    for (const f of data.files) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = f.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = f.name || 'file';
      li.appendChild(a);
      list.appendChild(li);
    }
    content.appendChild(list);
  }

  item.appendChild(content);
  return item;
}

function addCardToGrid(boardKey, id, data) {
  const grid = boards[boardKey].grid;
  const el = createCardEl({ id, ...data });
  grid.addWidget(el);
}

/** *************************************************************
 * Boards init + realtime listeners
 ************************************************************** */
async function createBoard(key) {
  const el = boardContainerEl(key);
  const grid = GridStack.init(
    {
      float: true,
      cellHeight: 100,
      minRow: 1,
      column: 12,
      margin: 8,
      animate: true,
      resizable: { handles: 'e, se, s, sw, w' },
      draggable: { handle: '.grid-stack-item-content' }
    },
    el
  );

  // persist moves/sizes
  grid.on('change', async (_e, items) => {
    for (const it of items) {
      const id = it.el?.dataset?.id;
      if (!id) continue;
      const coll = boardsMeta[key].coll;
      const ref = firestoreDoc(db, coll, id);
      await updateDoc(ref, { x: it.x, y: it.y, w: it.w, h: it.h, updatedAt: Date.now() });
    }
  });

  const element = el.parentElement;
  const collectionRef = collection(db, boardsMeta[key].coll);
  boards[key] = { grid, element, collection: collectionRef };

  // realtime feed
  const qRef = query(collectionRef, orderBy('createdAt', 'asc'));
  onSnapshot(qRef, (snap) => {
    grid.removeAll();
    snap.forEach((docSnap) => addCardToGrid(key, docSnap.id, docSnap.data()));
  });
}

async function initBoards() {
  for (const key of Object.keys(boardsMeta)) {
    await createBoard(key);
  }
}
initBoards().catch((e) => console.error('Init error:', e));

/** *************************************************************
 * Form submit (create doc + optional uploads)
 ************************************************************** */
function asNum(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

itemForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(itemForm).entries());

  const w = asNum(data.w, 3);
  const h = asNum(data.h, 2);

  // Upload files to Storage (if any)
  let filesMeta = [];
  const files = fileInput?.files || [];
  for (const file of files) {
    const path = `${boardsMeta[currentBoardKey].coll}/${Date.now()}_${file.name}`;
    const ref = storageRef(storage, path);
    await uploadBytes(ref, file);
    const url = await getDownloadURL(ref);
    filesMeta.push({ name: file.name, url, path });
  }

  const payload = {
    title: data.title || 'Untitled',
    description: data.description || '',
    color: data.color || '#6aa9ff',
    preRough: data.preRough || '',
    subRough: data.subRough || '',
    coords: data.coords || '',
    files: filesMeta,
    x: 0, y: 0, w, h,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await addDoc(boards[currentBoardKey].collection, payload);
  closeModal();
});

