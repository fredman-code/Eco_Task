   
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
                school: [
                    { name: 'Alex Johnson', school: 'Delhi Private School, Sharjah', points: 98, rank: 1 },
                    { name: 'Samira Ahmed', school: 'Delhi Private School, Sharjah', points: 87, rank: 2 },
                    { name: 'David Wilson', school: 'Delhi Private School, Sharjah', points: 76, rank: 3 },
                    { name: 'You', school: 'Delhi Private School, Sharjah', points: 12, rank: 7 }
                ],
                uae: [
                    { name: 'Fatima Al Mansoori', school: 'GEMS Wellington Academy', points: 127, rank: 1 },
                    { name: 'Mohammed Khan', school: 'DPS Dubai', points: 118, rank: 2 },
                    { name: 'Priya Patel', school: 'International Indian High School', points: 105, rank: 3 }
                ]
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
        const signupVideo = document.getElementById('signup-video');
        const signupCanvas = document.getElementById('signup-canvas');
        const captureFaceBtn = document.getElementById('capture-face-btn');
        const signupSubmit = document.getElementById('signup-submit');
        
        // User Profile Elements
        const userName = document.getElementById('user-name');
        const userSchool = document.getElementById('user-school');
        const userPoints = document.getElementById('user-points');
        const progressText = document.getElementById('progress-text');
        const progressFill = document.getElementById('progress-fill');
        const userBadges = document.getElementById('user-badges');
        
        // Initialize Models for Face Verification
        let faceDetectionModelLoaded = false;
        let isProcessingFace = false;
        
        async function loadFaceDetectionModels() {
            try {
                // Load smaller models to improve performance
                await faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
                faceDetectionModelLoaded = true;
                console.log('Face detection models loaded');
            } catch (error) {
                console.error('Error loading face detection models:', error);
                alert('Error loading face verification system. Please try again later.');
            }
        }
        
        // Initialize the app
        document.addEventListener('DOMContentLoaded', () => {
            loadFaceDetectionModels();
            setupEventListeners();
            checkForLoggedInUser();
        });
        
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
            
            // Signup Face Capture
            captureFaceBtn.addEventListener('click', captureFace);
            
            // Proof Submission
            submitProofBtn.addEventListener('click', () => {
                proofModal.classList.remove('hidden');
            });
            
            cancelProof.addEventListener('click', () => {
                proofModal.classList.add('hidden');
                resetProofForm();
            });
            
            retakePhotoBtn.addEventListener('click', () => {
                proofPreview.classList.add('hidden');
                proofPhoto.value = '';
                submitProof.disabled = true;
            });
            
            proofPhoto.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        proofPreviewImg.src = event.target.result;
                        proofPreview.classList.remove('hidden');
                        submitProof.disabled = false;
                    };
                    reader.readAsDataURL(file);
                }
            });
            
            // Form submissions
            document.getElementById('login-form-el').addEventListener('submit', handleLogin);
            document.getElementById('signup-form-el').addEventListener('submit', handleSignup);
            proofForm.addEventListener('submit', handleProofSubmission);
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
            
            // Start video for face capture
            startVideo();
        }
        
        async function startVideo() {
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
                document.getElementById('capture-face-btn').textContent = 'Upload Photo Instead';
                document.getElementById('capture-face-btn').onclick = uploadPhotoInstead;
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
                    signupCanvas.width = img.width;
                    signupCanvas.height = img.height;
                    const ctx = signupCanvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    await processFaceCapture();
                }
            };
            input.click();
        }
        
        async function captureFace() {
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
                
                // Store as lower resolution image to reduce data size
                state.userFaceData = signupCanvas.toDataURL('image/jpeg', 0.7);
                
                // Show success
                signupVideo.classList.add('hidden');
                signupCanvas.classList.remove('hidden');
                captureFaceBtn.textContent = 'Retake';
                
                // Enable signup button
                signupSubmit.disabled = false;
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
                    signupCanvas.width = img.width;
                    signupCanvas.height = img.height;
                    const ctx = signupCanvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    await captureFace();
                }
            };
            input.click();
        }

        function checkForLoggedInUser() {
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
        }
        
        function handleSignup(e) {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const school = document.getElementById('school-select').value;
            
            if (!email || !password || !school || !state.userFaceData) {
                alert('Please complete all registration steps including face verification');
                return;
            }
            
            // Mock signup for demo
            const user = {
                email,
                name: email.split('@')[0],
                school,
                points: 0,
                badges: [],
                faceData: state.userFaceData
            };
            
            // Store user data in localStorage (demo only)
            localStorage.setItem('ecoSparkUser', JSON.stringify(user));
            
            loginUser(user);
            authModal.classList.add('hidden');
            
            // Clean up
            if (signupVideo.srcObject) {
                signupVideo.srcObject.getTracks().forEach(track => track.stop());
            }
        }
        
        function loginUser(user) {
            state.user = user;
            updateUserProfile();
            dashboard.classList.remove('hidden');
            authBtn.textContent = 'Logout';
            authBtn.onclick = logoutUser;
            
            // Scroll to top
            window.scrollTo(0, 0);
            
            // Hide about section as we're logged in
            aboutSection.classList.add('hidden');
        }
        
        function logoutUser() {
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
        }
        
        function updateUserProfile() {
            if (!state.user) return;
            
            userName.textContent = state.user.name;
            userSchool.textContent = state.user.school;
            userPoints.textContent = state.user.points;
            
            // Set avatar - in a real app, would use the captured face image
            document.getElementById('user-avatar').src = state.user.faceData || 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/5b223324-7637-41f1-a6f2-3a7a07db224c.png' + state.user.name.charAt(0).toUpperCase();
            
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
            
            if (!activity || !proofPhoto.files[0]) {
                alert('Please select an activity and upload a photo');
                return;
            }
            
            // In a real app, we would:
            // 1. Verify the face in the proof photo matches the stored face data
            // 2. Send the submission to the server for processing and verification
            // 3. Update the UI when verification is complete
            
            // For demo purposes, simulate verification and point award
            setTimeout(() => {
                alert('Verification complete! Face match confirmed. Points awarded.');
                
                // Award points (find activity in the list)
                const activityData = state.activities.find(a => a.name === activity);
                if (activityData) {
                    state.user.points += activityData.points;
                    
                    // Check for new badges
                    state.badges.forEach(badge => {
                        if (state.user.points >= badge.pointsRequired && !state.user.badges.includes(badge.id)) {
                            state.user.badges.push(badge.id);
                            alert(`Congratulations! You earned the ${badge.name} badge!`);
                        }
                    });
                    
                    // Update stored user
                    localStorage.setItem('ecoSparkUser', JSON.stringify(state.user));
                    
                    // Update UI
                    updateUserProfile();
                    
                    // Close modal
                    proofModal.classList.add('hidden');
                    resetProofForm();
                }
            }, 1500);
        }