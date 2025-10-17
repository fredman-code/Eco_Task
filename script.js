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

// App State
const state = {
    user: null,
    currentView: 'home',
    activities: [
        { name: 'Planting a tree', description: 'Basic sustainability action', points: 2 },
        { name: 'Creating a mini home garden', description: '3+ plants, setup at home', points: 5 },
        { name: 'Adopting a plant', description: 'Document regular care', points: 3 },
        { name: 'Picking up 5 pieces of trash', description: 'General cleanup', points: 1 },
        { name: 'Picking up 10 pieces of trash', description: 'Extended cleanup', points: 2 },
        { name: 'Beach or desert cleanup', description: 'Must be done at registered UAE public zones', points: 4 },
        { name: 'Setting up a recycling station', description: 'Local community bin', points: 6 },
        { name: 'E-waste collection', description: 'Gather and submit e-waste safely', points: 4 }
    ],
    leaderboards: {
        school: [],
        uae: []
    },
    badges: [
        { id: 'bronze-leaf', name: 'Bronze Leaf', pointsRequired: 10, description: 'Earned for reaching 10 points' },
        { id: 'silver-sapling', name: 'Silver Sapling', pointsRequired: 25, description: 'Earned for reaching 25 points' },
        { id: 'golden-grove', name: 'Golden Grove', pointsRequired: 50, description: 'Earned for reaching 50 points' },
        { id: 'eco-warrior', name: 'Eco Warrior', pointsRequired: 75, description: 'Earned for reaching 75 points' },
        { id: 'champion-of-earth', name: 'Champion of the Earth', pointsRequired: 100, description: 'Earned for reaching 100 points' }
    ]
};

// DOM Elements
const authModal = document.getElementById('auth-modal');
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const switchToSignup = document.getElementById('switch-to-signup');
const switchToLogin = document.getElementById('switch-to-login');
const authBtn = document.getElementById('auth-btn');
const ctaAuthBtn = document.getElementById('cta-auth-btn');
const learnMoreBtn = document.getElementById('learn-more-btn');
const dashboard = document.getElementById('dashboard');
const aboutSection = document.getElementById('about-section');
const proofModal = document.getElementById('proof-modal');
const proofForm = document.getElementById('proof-form');
const proofPhoto = document.getElementById('proof-photo');
const proofPreview = document.getElementById('proof-preview');
const proofPreviewImg = document.getElementById('proof-preview-img');
const retakePhotoBtn = document.getElementById('retake-photo-btn');
const cancelProof = document.getElementById('cancel-proof');
const submitProof = document.getElementById('submit-proof');
const submitProofBtn = document.getElementById('submit-proof-btn');

// Face Verification Elements
// ...existing code...

// User Profile Elements
const userName = document.getElementById('user-name');
const userSchool = document.getElementById('user-school');
const userPoints = document.getElementById('user-points');
const progressText = document.getElementById('progress-text');
const progressFill = document.getElementById('progress-fill');
const userBadges = document.getElementById('user-badges');

// Firebase Helpers
// Load Firebase SDK
if (typeof firebase === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js';
    script.onload = () => {
        const authScript = document.createElement('script');
        authScript.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js';
        authScript.onload = () => {
            initializeFirebase();
        };
        document.head.appendChild(authScript);
    };
    document.head.appendChild(script);
}
function isPlaceholderFirebaseConfig(config) {
    return Object.values(config).some(value =>
        typeof value === 'string' && value.startsWith('REPLACE_WITH_')
    );
}

function getStoredProfiles() {
    try {
        const raw = localStorage.getItem('ecoSparkProfiles');
        return raw ? JSON.parse(raw) : {};
    } catch (error) {
        console.error('Failed to parse stored profiles:', error);
        return {};
    }
}

function saveProfiles(profiles) {
    localStorage.setItem('ecoSparkProfiles', JSON.stringify(profiles));
}

function persistCurrentUserProfile() {
    if (!state.user) return;
    localStorage.setItem('ecoSparkUser', JSON.stringify(state.user));

    if (state.user.uid) {
        const profiles = getStoredProfiles();
        profiles[state.user.uid] = { ...profiles[state.user.uid], ...state.user };
        saveProfiles(profiles);
        localStorage.setItem('ecoSparkActiveProfile', state.user.uid);
    }
}

function buildUserProfileFromFirebase(firebaseUser, overrides = {}) {
    const profiles = getStoredProfiles();
    const existingProfile = profiles[firebaseUser.uid] || {};

    const profile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: overrides.name || firebaseUser.displayName || existingProfile.name || firebaseUser.email.split('@')[0],
        school: overrides.school || existingProfile.school || 'Delhi Private School, Sharjah',
        points: typeof overrides.points === 'number' ? overrides.points : (existingProfile.points ?? 0),
        badges: overrides.badges || existingProfile.badges || [],
        faceData: overrides.faceData || existingProfile.faceData || null
    };

    profiles[firebaseUser.uid] = profile;
    saveProfiles(profiles);
    localStorage.setItem('ecoSparkUser', JSON.stringify(profile));
    localStorage.setItem('ecoSparkActiveProfile', firebaseUser.uid);

    return profile;
}

function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK not loaded. Continuing with demo authentication.');
        return;
    }

    const config = window.firebaseConfig || PLACEHOLDER_FIREBASE_CONFIG;
    if (isPlaceholderFirebaseConfig(config)) {
        console.warn('Firebase config not provided. Continuing with local demo authentication.');
        return;
    }

    try {
        firebaseApp = firebase.apps.length ? firebase.app() : firebase.initializeApp(config);
        firebaseAuth = firebase.auth();
        // Load database SDK dynamically (Firebase v8 style)
        if (typeof firebase.database === 'undefined') {
            const dbScript = document.createElement('script');
            dbScript.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js';
            dbScript.onload = () => {
                console.log('Firebase database SDK loaded');
            };
            document.head.appendChild(dbScript);
        }
        firebaseInitialized = true;

        firebaseAuth.onAuthStateChanged((firebaseUser) => {
            if (firebaseUser) {
                const profile = buildUserProfileFromFirebase(firebaseUser);
                // write profile to DB and then login
                writeUserProfileToDB(profile).then(() => loginUser(profile));
            } else {
                logoutUser(true);
            }
        });
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
    }
}

function writeUserProfileToDB(profile) {
    return new Promise((resolve) => {
        if (typeof firebase === 'undefined' || typeof firebase.database === 'undefined') return resolve();
        const db = firebase.database();
        const data = {
            name: profile.name,
            email: profile.email,
            school: profile.school,
            points: profile.points || 0,
            badges: profile.badges || []
        };
        if (profile.uid) {
            db.ref('users/' + profile.uid).set(data, () => resolve());
        } else {
            resolve();
        }
    });
}

function fetchLeaderboards() {
    if (typeof firebase === 'undefined' || typeof firebase.database === 'undefined') return;
    const db = firebase.database();
    db.ref('users').once('value').then(snapshot => {
        const users = snapshot.val() || {};
        const arr = Object.values(users);
        arr.sort((a, b) => (b.points || 0) - (a.points || 0));
        state.leaderboards.uae = arr.map((u, i) => ({ name: u.name, school: u.school, points: u.points || 0, rank: i + 1 }));
        state.leaderboards.school = arr.filter(u => u.school === (state.user && state.user.school)).map((u, i) => ({ name: u.name, school: u.school, points: u.points || 0, rank: i + 1 }));
        renderLeaderboards();
    });
}

function renderLeaderboards() {
    // Simple rendering: replace leaderboard containers with generated items
    const schoolContainer = document.querySelector('#school-leaderboard .list');
    const uaeContainer = document.querySelector('#uae-leaderboard .list');
    if (schoolContainer) {
        schoolContainer.innerHTML = '';
        state.leaderboards.school.slice(0, 10).forEach(item => {
            const el = document.createElement('div');
            el.className = 'bg-white p-3 rounded-lg flex items-center border';
            el.innerHTML = `<div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3"><span class="text-gray-800 font-bold">${item.rank}</span></div><div class="flex-1 min-w-0"><p class="font-medium truncate">${item.name}</p><p class="text-xs text-gray-500">${item.points} points</p></div>`;
            schoolContainer.appendChild(el);
        });
    }
    if (uaeContainer) {
        uaeContainer.innerHTML = '';
        state.leaderboards.uae.slice(0, 10).forEach(item => {
            const el = document.createElement('div');
            el.className = 'bg-white p-3 rounded-lg flex items-center border';
            el.innerHTML = `<div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3"><span class="text-gray-800 font-bold">${item.rank}</span></div><div class="flex-1 min-w-0"><p class="font-medium truncate">${item.name}</p><p class="text-xs text-gray-500">${item.school} — ${item.points} pts</p></div>`;
            uaeContainer.appendChild(el);
        });
    }
}

// Initialize Models for Face Verification
// ...existing code...

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeFirebase();
    setupEventListeners();
    enableSignupButton();
    if (!firebaseInitialized) {
        checkForLoggedInUser();
    }
});

function enableSignupButton() {
    const signupUsername = document.getElementById('signup-username');
    const signupEmail = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const schoolSelect = document.getElementById('school-select');
    const signupSubmit = document.getElementById('signup-submit');
    function checkFields() {
        if (signupUsername.value && signupEmail.value && signupPassword.value && schoolSelect.value) {
            signupSubmit.disabled = false;
        } else {
            signupSubmit.disabled = true;
        }
    }
    signupUsername.addEventListener('input', checkFields);
    signupEmail.addEventListener('input', checkFields);
    signupPassword.addEventListener('input', checkFields);
    schoolSelect.addEventListener('change', checkFields);
    checkFields();
}

function setupEventListeners() {
    // Authentication
    authBtn.addEventListener('click', () => {
        authModal.classList.remove('hidden');
        showLoginForm();
    });

    ctaAuthBtn.addEventListener('click', () => {
        authModal.classList.remove('hidden');
        showSignupForm();
    });

    learnMoreBtn.addEventListener('click', () => {
        document.getElementById('about-section').scrollIntoView({ behavior: 'smooth' });
    });

    loginTab.addEventListener('click', showLoginForm);
    signupTab.addEventListener('click', showSignupForm);
    switchToSignup.addEventListener('click', showSignupForm);
    switchToLogin.addEventListener('click', showLoginForm);

    // Form submissions
    document.getElementById('login-form-el').addEventListener('submit', handleLogin);
    document.getElementById('signup-form-el').addEventListener('submit', handleSignup);
    // Proof modal triggers
    const submitProofBtnEl = document.getElementById('submit-proof-btn');
    if (submitProofBtnEl) submitProofBtnEl.addEventListener('click', () => {
        populateActivitySelect();
        proofModal.classList.remove('hidden');
    });
    const cancelProofBtn = document.getElementById('cancel-proof');
    if (cancelProofBtn) cancelProofBtn.addEventListener('click', () => proofModal.classList.add('hidden'));
    if (proofForm) proofForm.addEventListener('submit', handleProofSubmission);
}

function showLoginForm() {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    loginTab.classList.add('border-green-500', 'text-green-600');
    signupTab.classList.remove('border-green-500', 'text-green-600');
}

function showSignupForm() {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    signupTab.classList.add('border-green-500', 'text-green-600');
    loginTab.classList.remove('border-green-500', 'text-green-600');
}

async function startVideo() {
    captureFaceBtn.dataset.mode = 'capture';
    captureFaceBtn.textContent = 'Capture Face';

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            } 
        });
        signupVideo.srcObject = stream;
        signupVideo.onloadedmetadata = () => {
            signupVideo.play();
        };
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert(`Could not access camera: ${error.message}. Please enable camera permissions and try again.`);
        // Fallback to file upload
        captureFaceBtn.textContent = 'Upload Photo Instead';
        captureFaceBtn.dataset.mode = 'upload';
    }
}

async function processCanvasForFace() {
    // Use lighter face detection without landmarks/descriptors to improve performance
    const detections = await faceapi.detectAllFaces(signupCanvas,
        new faceapi.TinyFaceDetectorOptions({
            inputSize: 128,
            scoreThreshold: 0.5
        }));

    if (detections.length === 0) {
        alert('No face detected. Please try again making sure your face is clearly visible.');
        throw new Error('No face detected');
    }

    if (detections.length > 1) {
        alert('Multiple faces detected. Please ensure only your face is visible in the frame.');
        throw new Error('Multiple faces detected');
    }

    state.userFaceData = signupCanvas.toDataURL('image/jpeg', 0.7);

    signupVideo.classList.add('hidden');
    signupCanvas.classList.remove('hidden');
    captureFaceBtn.textContent = 'Retake';
    captureFaceBtn.dataset.mode = 'capture';
    signupSubmit.disabled = false;
}

async function captureFace() {
    if (captureFaceBtn.dataset.mode === 'upload') {
        uploadPhotoInstead();
        return;
    }

    if (!signupVideo.srcObject) {
        uploadPhotoInstead();
        return;
    }

    if (!faceDetectionModelLoaded) {
        alert('Face verification system is still initializing. Please wait a moment and try again.');
        return;
    }

    if (isProcessingFace) return;
    isProcessingFace = true;
    captureFaceBtn.disabled = true;

    try {
        // Draw video frame to canvas with smaller dimensions
        const context = signupCanvas.getContext('2d');
        signupCanvas.width = 300;
        signupCanvas.height = 225;
        context.drawImage(signupVideo, 0, 0, 300, 225);

        await processCanvasForFace();
    } catch (error) {
        console.error('Face capture error:', error);
    } finally {
        isProcessingFace = false;
        captureFaceBtn.disabled = false;
    }
}

function uploadPhotoInstead() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const img = await faceapi.bufferToImage(file);
            const targetWidth = 300;
            const scale = targetWidth / img.width;
            signupCanvas.width = targetWidth;
            signupCanvas.height = Math.round(img.height * scale);
            const ctx = signupCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0, signupCanvas.width, signupCanvas.height);

            try {
                await processCanvasForFace();
            } catch (error) {
                console.error('Uploaded photo processing failed:', error);
            }
        }
    };
    input.click();
}

function checkForLoggedInUser() {
    if (firebaseInitialized) return;

    // Check if user is logged in (demo - in a real app, check localStorage or cookies)
    if (localStorage.getItem('ecoSparkUser')) {
        const user = JSON.parse(localStorage.getItem('ecoSparkUser'));
        loginUser(user);
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Demo - in a real app, would validate and send to server
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (firebaseInitialized && firebaseAuth) {
        firebaseAuth.signInWithEmailAndPassword(email, password)
            .then(() => {
                authModal.classList.add('hidden');
            })
            .catch(error => {
                console.error('Firebase login failed:', error);
                alert(`Login failed: ${error.message}`);
            });
        return;
    }

    // Mock login for demo
    const user = {
        email,
        name: email.split('@')[0],
        school: 'Delhi Private School, Sharjah',
        points: 12,
        badges: ['bronze-leaf'],
        faceData: null // In a real app, we would store the face descriptor
    };

    loginUser(user);
    authModal.classList.add('hidden');
}

function cleanupSignupFlow() {
    if (signupVideo.srcObject) {
        signupVideo.srcObject.getTracks().forEach(track => track.stop());
        signupVideo.srcObject = null;
    }

    signupVideo.classList.remove('hidden');
    signupCanvas.classList.add('hidden');
    captureFaceBtn.textContent = 'Capture Face';
    captureFaceBtn.dataset.mode = 'capture';
    signupSubmit.disabled = true;
    state.userFaceData = null;
}

function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const school = document.getElementById('school-select').value;

    if (!username || !email || !password || !school) {
        alert('Please complete all registration steps');
        return;
    }

    if (firebaseInitialized && firebaseAuth) {
        firebaseAuth.createUserWithEmailAndPassword(email, password)
            .then(async ({ user }) => {
                try {
                    await user.updateProfile({ displayName: username });
                } catch (error) {
                    console.warn('Failed to update Firebase display name:', error);
                }

                buildUserProfileFromFirebase(user, {
                    name: username,
                    school,
                    points: 0,
                    badges: []
                });

                authModal.classList.add('hidden');
            })
            .catch(error => {
                console.error('Firebase signup failed:', error);
                alert(`Sign up failed: ${error.message}`);
            });
        return;
    }

    // Mock signup for demo
    const user = {
        email,
        name: username,
        school,
        points: 0,
        badges: []
    };

    // Store user data in localStorage (demo only)
    localStorage.setItem('ecoSparkUser', JSON.stringify(user));

    loginUser(user);
    authModal.classList.add('hidden');
}

function loginUser(user) {
    if (!user) return;

    state.user = user;
    persistCurrentUserProfile();
    updateUserProfile();
    dashboard.classList.remove('hidden');
    authBtn.textContent = 'Logout';
    authBtn.onclick = () => logoutUser();

    // Scroll to top
    window.scrollTo(0, 0);

    // Hide about section as we're logged in
    if (aboutSection) aboutSection.classList.add('hidden');

    // Fetch leaderboards and render
    fetchLeaderboards();
}

function populateActivitySelect() {
    const select = document.getElementById('activity-select');
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>Select an activity</option>';
    state.activities.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.name;
        opt.textContent = `${a.name} (${a.points} pts)`;
        select.appendChild(opt);
    });
}

function logoutUser(triggeredByFirebase = false) {
    state.user = null;
    dashboard.classList.add('hidden');
    authBtn.textContent = 'Login / Sign Up';
    authBtn.onclick = () => {
        authModal.classList.remove('hidden');
        showLoginForm();
    };

    // Show about section again
    aboutSection.classList.remove('hidden');

    // In a real app, would also clear auth tokens, etc.
    localStorage.removeItem('ecoSparkUser');
    localStorage.removeItem('ecoSparkActiveProfile');

    if (firebaseInitialized && firebaseAuth && firebaseAuth.currentUser && !triggeredByFirebase) {
        firebaseAuth.signOut().catch(error => {
            console.error('Failed to sign out from Firebase:', error);
        });
    }
}

function updateUserProfile() {
    if (!state.user) return;

    userName.textContent = state.user.name;
    const userUsername = document.getElementById('user-username');
    if (userUsername) userUsername.textContent = state.user.name;
    userSchool.textContent = state.user.school;
    userPoints.textContent = state.user.points;

    // Set avatar - use default image
    document.getElementById('user-avatar').src = 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/5b223324-7637-41f1-a6f2-3a7a07db224c.png';

    // Update progress to next badge
    const nextBadge = state.badges.find(badge => !state.user.badges.includes(badge.id) || badge.id === state.user.badges[state.user.badges.length - 1]);
    if (nextBadge) {
        const progressPercent = Math.min(100, (state.user.points / nextBadge.pointsRequired) * 100);
        progressFill.style.width = `${progressPercent}%`;
        progressText.textContent = `${state.user.points}/${nextBadge.pointsRequired} points`;
    }

    // Update badges
    userBadges.innerHTML = '';
    state.user.badges.forEach(badgeId => {
        const badge = state.badges.find(b => b.id === badgeId);
        if (badge) {
            const badgeEl = document.createElement('div');
            badgeEl.className = 'badge bg-green-100 text-green-800';
            badgeEl.textContent = badge.name;
            userBadges.appendChild(badgeEl);
        }
    });
}

function resetProofForm() {
    proofForm.reset();
    proofPreview.classList.add('hidden');
    proofPreviewImg.src = '#';
    submitProof.disabled = true;
}

function handleProofSubmission(e) {
    e.preventDefault();
    const activity = document.getElementById('activity-select').value;
    const description = document.getElementById('proof-description').value;

    if (!activity) {
        alert('Please select an activity');
        return;
    }

    // Push submission to Firebase pending queue
    if (typeof firebase !== 'undefined' && typeof firebase.database !== 'undefined') {
        const db = firebase.database();
        const submission = {
            userId: state.user && state.user.uid ? state.user.uid : null,
            username: state.user ? state.user.name : 'Anonymous',
            school: state.user ? state.user.school : 'Unknown',
            activity,
            description: description || '',
            timestamp: Date.now(),
            status: 'pending'
        };
        db.ref('activities/pending').push(submission, err => {
            if (err) {
                alert('Failed to submit activity proof. Please try again.');
            } else {
                alert('Submitted activity for admin review.');
                proofModal.classList.add('hidden');
                resetProofForm();
            }
        });
        return;
    }

    // Fallback: store locally
    let local = JSON.parse(localStorage.getItem('ecoSparkPending') || '[]');
    local.push({ user: state.user, activity, description, timestamp: Date.now(), status: 'pending' });
    localStorage.setItem('ecoSparkPending', JSON.stringify(local));
    alert('Submitted activity for admin review (local).');
    proofModal.classList.add('hidden');
    resetProofForm();
}