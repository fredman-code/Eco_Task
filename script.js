// App script - Firebase auth + Realtime DB + proof submission
// Writes username to users/{uid} on signup and reads it on login; redirects to dashboard.html after auth

const PLACEHOLDER_FIREBASE_CONFIG = {
  apiKey: 'REPLACE_WITH_YOUR_API_KEY',
  authDomain: 'REPLACE_WITH_YOUR_AUTH_DOMAIN',
  projectId: 'REPLACE_WITH_YOUR_PROJECT_ID',
  storageBucket: 'REPLACE_WITH_YOUR_STORAGE_BUCKET',
  messagingSenderId: 'REPLACE_WITH_YOUR_MESSAGING_SENDER_ID',
  appId: 'REPLACE_WITH_YOUR_APP_ID'
};

let firebaseApp = null;
let firebaseAuth = null;
let firebaseInitialized = false;

const state = {
  user: null,
  activities: [
    { name: 'Planting a tree', points: 2 },
    { name: 'Creating a mini home garden', points: 5 },
    { name: 'Adopting a plant', points: 3 },
    { name: 'Picking up 5 pieces of trash', points: 1 }
  ]
};

const $ = id => document.getElementById(id);

function loadFirebaseSdk(cb) {
  if (typeof firebase !== 'undefined') return cb();
  const s1 = document.createElement('script'); s1.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js';
  s1.onload = () => { const s2 = document.createElement('script'); s2.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js'; s2.onload = () => { const s3 = document.createElement('script'); s3.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js'; s3.onload = cb; document.head.appendChild(s3); }; document.head.appendChild(s2); };
  document.head.appendChild(s1);
}

function isPlaceholderConfig(c) { if (!c) return true; return Object.values(c).some(v => typeof v === 'string' && v.startsWith('REPLACE_WITH_')); }

function initializeFirebase() {
  if (typeof firebase === 'undefined') return;
  const cfg = window.firebaseConfig || PLACEHOLDER_FIREBASE_CONFIG;
  if (isPlaceholderConfig(cfg)) { console.warn('Firebase config missing — running in demo mode'); return; }
  try {
    firebaseApp = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
    firebaseAuth = firebase.auth();
    firebaseInitialized = true;

    firebaseAuth.onAuthStateChanged(async fbUser => {
      if (!fbUser) { state.user = null; return; }
      if (typeof firebase.database !== 'undefined') {
        try {
          const snap = await firebase.database().ref('users/' + fbUser.uid).once('value');
          const profile = snap.val();
          if (profile) { profile.uid = fbUser.uid; state.user = profile; localStorage.setItem('ecoSparkUser', JSON.stringify(profile)); renderProfile(); try { if (!location.pathname.endsWith('dashboard.html')) location.href = 'dashboard.html'; } catch (e) {} return; }
        } catch (err) { console.warn('DB read failed', err); }
      }
      state.user = { uid: fbUser.uid, name: fbUser.displayName || fbUser.email.split('@')[0], email: fbUser.email, school: 'Unknown', points: 0, badges: [] };
      localStorage.setItem('ecoSparkUser', JSON.stringify(state.user)); renderProfile(); try { if (!location.pathname.endsWith('dashboard.html')) location.href = 'dashboard.html'; } catch (e) {}
    });
  } catch (err) { console.error('Firebase init error', err); }
}

function renderProfile() {
  const user = state.user || JSON.parse(localStorage.getItem('ecoSparkUser') || 'null');
  if (!user) return;
  state.user = user;
  if ($('user-name')) $('user-name').textContent = user.name || '';
  if ($('user-username')) $('user-username').textContent = user.username || user.name || '';
  if ($('user-school')) $('user-school').textContent = user.school || '';
  if ($('user-points')) $('user-points').textContent = user.points || 0;
}

async function handleSignup(e) {
  e.preventDefault();
  const username = $('signup-username') ? $('signup-username').value.trim() : '';
  const email = $('signup-email') ? $('signup-email').value.trim() : '';
  const password = $('signup-password') ? $('signup-password').value : '';
  const school = $('school-select') ? $('school-select').value : 'Delhi Private School, Sharjah';
  if (!username || !email || !password) return alert('Please fill required fields');
  if (firebaseInitialized && firebaseAuth) {
    try {
      const cred = await firebaseAuth.createUserWithEmailAndPassword(email, password);
      const user = cred.user;
      try { await user.updateProfile({ displayName: username }); } catch (e) { console.warn('updateProfile failed', e); }
      if (typeof firebase.database !== 'undefined') {
        const profile = { name: username, username, email, school, points: 0, badges: [] };
        await firebase.database().ref('users/' + user.uid).set(profile);
        profile.uid = user.uid; state.user = profile; localStorage.setItem('ecoSparkUser', JSON.stringify(profile)); renderProfile(); try { location.href = 'dashboard.html'; } catch (e) {} return;
      }
    } catch (err) { console.error('Signup failed', err); alert('Signup failed: ' + (err.message || err)); return; }
  }
  const demo = { uid: 'local_' + Date.now(), name: username, username, email, school, points: 0, badges: [] }; state.user = demo; localStorage.setItem('ecoSparkUser', JSON.stringify(demo)); renderProfile(); try { location.href = 'dashboard.html'; } catch (e) {}
}

async function handleLogin(e) {
  e.preventDefault();
  const email = $('login-email') ? $('login-email').value.trim() : '';
  const password = $('login-password') ? $('login-password').value : '';
  if (!email || !password) return alert('Please fill required fields');
  if (firebaseInitialized && firebaseAuth) {
    try {
      const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
      const fbUser = cred.user;
      if (typeof firebase.database !== 'undefined') {
        try {
          const snap = await firebase.database().ref('users/' + fbUser.uid).once('value');
          const profile = snap.val();
          if (profile) { profile.uid = fbUser.uid; state.user = profile; localStorage.setItem('ecoSparkUser', JSON.stringify(profile)); renderProfile(); try { location.href = 'dashboard.html'; } catch (e) {} return; }
        } catch (err) { console.warn('DB read failed', err); }
      }
      state.user = { uid: fbUser.uid, name: fbUser.displayName || fbUser.email.split('@')[0], email: fbUser.email, school: 'Unknown', points: 0, badges: [] };
      localStorage.setItem('ecoSparkUser', JSON.stringify(state.user)); renderProfile(); try { location.href = 'dashboard.html'; } catch (e) {}
      return;
    } catch (err) { console.error('Login failed', err); alert('Login failed: ' + (err.message || err)); return; }
  }
  const stored = localStorage.getItem('ecoSparkUser'); if (stored) { state.user = JSON.parse(stored); renderProfile(); try { location.href = 'dashboard.html'; } catch (e) {} return; }
  alert('No user found (demo)');
}

function wireProofPhotoInput() { const input = $('proof-photo-input'); const preview = $('proof-preview-img'); const previewWrap = $('proof-preview'); if (!input) return; input.addEventListener('change', e => { const file = e.target.files && e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = ev => { if (preview) { preview.src = ev.target.result; if (previewWrap) previewWrap.classList.remove('hidden'); } }; r.readAsDataURL(file); }); }

async function handleProofSubmission(e) { e.preventDefault(); const activity = $('activity-select') ? $('activity-select').value : null; const description = $('proof-description') ? $('proof-description').value : ''; const preview = $('proof-preview-img'); const photo = preview && preview.src && preview.src !== '#' ? preview.src : null; if (!activity) return alert('Select an activity'); const submission = { userId: state.user && state.user.uid ? state.user.uid : null, username: state.user && (state.user.username || state.user.name), school: state.user && state.user.school, activity, description, photoData: photo, timestamp: Date.now(), status: 'pending' }; if (typeof firebase !== 'undefined' && typeof firebase.database !== 'undefined') { try { await firebase.database().ref('activities/pending').push(submission); alert('Submitted for review'); const modal = $('proof-modal'); const form = $('proof-form'); const previewWrap = $('proof-preview'); if (modal) modal.classList.add('hidden'); if (form) form.reset(); if (previewWrap) previewWrap.classList.add('hidden'); return; } catch (err) { console.error('Submit failed', err); alert('Submit failed'); return; } } const local = JSON.parse(localStorage.getItem('ecoSparkPending') || '[]'); local.push(submission); localStorage.setItem('ecoSparkPending', JSON.stringify(local)); alert('Submitted (local)'); const modal = $('proof-modal'); const form = $('proof-form'); const previewWrap = $('proof-preview'); if (modal) modal.classList.add('hidden'); if (form) form.reset(); if (previewWrap) previewWrap.classList.add('hidden'); }

function populateActivitySelect() { const select = $('activity-select'); if (!select) return; select.innerHTML = '<option value="" disabled selected>Select an activity</option>'; state.activities.forEach(a => { const opt = document.createElement('option'); opt.value = a.name; opt.textContent = `${a.name} (${a.points} pts)`; select.appendChild(opt); }); }

function setupBindings() {
  const authBtn = $('auth-btn'); if (authBtn) authBtn.addEventListener('click', () => { const m = $('auth-modal'); if (m) m.classList.remove('hidden'); });
  const cta = $('cta-auth-btn'); if (cta) cta.addEventListener('click', () => { const m = $('auth-modal'); if (m) m.classList.remove('hidden'); });
  const loginForm = $('login-form-el'); if (loginForm) loginForm.addEventListener('submit', handleLogin);
  const signupForm = $('signup-form-el'); if (signupForm) signupForm.addEventListener('submit', handleSignup);
  const submitProofBtn = $('submit-proof-btn'); if (submitProofBtn) submitProofBtn.addEventListener('click', () => { const m = $('proof-modal'); if (m) m.classList.remove('hidden'); wireProofPhotoInput(); });
  const proofForm = $('proof-form'); if (proofForm) proofForm.addEventListener('submit', handleProofSubmission);
  populateActivitySelect();
  const su = $('signup-username'), se = $('signup-email'), sp = $('signup-password'), sc = $('school-select'), ss = $('signup-submit');
  if (su && se && sp && sc && ss) { const check = () => ss.disabled = !(su.value && se.value && sp.value && sc.value); su.addEventListener('input', check); se.addEventListener('input', check); sp.addEventListener('input', check); sc.addEventListener('change', check); check(); }
}

document.addEventListener('DOMContentLoaded', () => { loadFirebaseSdk(() => initializeFirebase()); setupBindings(); renderProfile(); });
