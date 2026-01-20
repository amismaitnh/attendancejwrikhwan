// firebase-auth.js - COMPLETE FIXED VERSION
class FirebaseAuthSystem {
    constructor() {
    this.auth = window.firebaseServices?.auth;
    this.db = window.firebaseServices?.db;
    this.currentUser = null;
    this.userProfile = null;
    this.autoLoginAttempted = false;
    this.loginSuggestionShown = false; // Add this flag
    
    if (!this.auth) {
        console.error("❌ Firebase auth not initialized!");
        return;
    }
    
    console.log("🔐 Firebase Auth System initialized");
    
    // Listen for auth state changes
    this.auth.onAuthStateChanged(async (user) => {
        this.currentUser = user;
        
        if (user) {
            console.log("👤 User logged in:", user.email || user.uid);
            this.userProfile = {
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                uid: user.uid,
                isAnonymous: user.isAnonymous
            };
            
            // Save user info to localStorage
            localStorage.setItem('firebaseUser', JSON.stringify(this.userProfile));
            
            // Initialize user data in Firestore
            await this.initializeUserData(user);
            
            // Show organization modal if no organization selected
            const selectedOrg = localStorage.getItem('selectedOrganization');
            if (!selectedOrg) {
                setTimeout(() => {
                    const orgModal = document.getElementById('orgModal');
                    if (orgModal) {
                        orgModal.classList.add('show');
                        document.body.classList.add('modal-open');
                    }
                }, 500);
            }
            
            // Start auto-sync
            this.startAutoSync();
            
            // Show login success notification
            this.showNotification(`Welcome ${this.userProfile.displayName}!`, 'success');
            
        } else {
            console.log("👤 User logged out");
            this.userProfile = null;
            localStorage.removeItem('firebaseUser');
            
            // Try auto-login as anonymous if not already attempted
            if (!this.autoLoginAttempted) {
                this.autoLoginAttempted = true;
                
                // Try anonymous login after 2 seconds
                setTimeout(() => {
                    this.tryAnonymousLogin();
                }, 2000);
            } else {
                // Show login suggestion - MODIFIED
                console.log("🔄 Auto-login already attempted, showing suggestion...");
                
                // Wait a bit then show suggestion
                setTimeout(() => {
                    // Check if we should show suggestion
                    const currentPath = window.location.pathname;
                    const allowedPages = ['index.html', 'report.html', 'signature.html', '/'];
                    const shouldShow = allowedPages.some(page => currentPath.includes(page));
                    
                    if (shouldShow && !this.loginSuggestionShown) {
                        this.showLoginSuggestion();
                        this.loginSuggestionShown = true;
                    }
                }, 3000);
            }
        }
        
        // Dispatch auth state change event
        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { 
                user: user, 
                isLoggedIn: !!user,
                profile: this.userProfile 
            }
        }));
    });
    
    // Check for saved user on startup
    this.checkSavedUser();
    
    // Force check for suggestion after initialization
    setTimeout(() => {
        if (!this.currentUser || this.currentUser.isAnonymous) {
            const currentPath = window.location.pathname;
            if (currentPath.includes('signature.html') && !this.loginSuggestionShown) {
                console.log("🔄 Post-init check for signature.html");
                this.showLoginSuggestion();
                this.loginSuggestionShown = true;
            }
        }
    }, 5000);
}

   showLoginSuggestion() {
    console.log("🔔 showLoginSuggestion() called");
    
    // Check if we're in a proper page
    const currentPath = window.location.pathname;
    console.log("Current path:", currentPath);
    
    // Define allowed pages
    const allowedPages = ['index.html', 'report.html', 'signature.html', '/'];
    const pageName = currentPath.split('/').pop() || 'index.html';
    
    // Check if current page is allowed
    const isAllowedPage = allowedPages.some(page => 
        currentPath.includes(page) || pageName === page
    );
    
    if (!isAllowedPage) {
        console.log("❌ Not showing suggestion - page not allowed:", pageName);
        return;
    }
    
    // Check if suggestion already exists
    if (document.getElementById('login-suggestion')) {
        console.log("❌ Not showing suggestion - already exists");
        return;
    }
    
    // Check if user is already logged in (non-anonymous)
    const user = this.getCurrentUser();
    if (user && !user.isAnonymous) {
        console.log("❌ Not showing suggestion - user already logged in");
        return;
    }
    
    console.log("✅ Conditions met, showing login suggestion...");
    
    // Create suggestion with better styling
    const suggestion = document.createElement('div');
    suggestion.id = 'login-suggestion';
    suggestion.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; padding: 2px;">
            <div style="display: flex; gap: 5px;">
                <button id="direct-login-btn" style="padding: 6px 14px; background: #9ade24; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer;">
                    Login
                </button>
                <button id="direct-close-btn" style="background: #f5f5f5; border: none; color: #888; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px;">
                    ×
                </button>
            </div>
        </div>
    `;
    
    // Enhanced styling
    suggestion.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        color: #333;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        z-index: 9999;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        font-family: 'Poppins', sans-serif;
        display: flex;
        align-items: center;
        animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 400px;
        backdrop-filter: blur(10px);
        transform-origin: bottom right;
    `;
    
    // Add animations to document head
    if (!document.querySelector('#suggestion-animations')) {
        const style = document.createElement('style');
        style.id = 'suggestion-animations';
        style.textContent = `
            @keyframes slideUp {
                from {
                    transform: translateY(100%) scale(0.9);
                    opacity: 0;
                }
                to {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
            }
            
            @keyframes fadeOutDown {
                from {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
                to {
                    transform: translateY(20px) scale(0.95);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Append to body
    document.body.appendChild(suggestion);
    console.log("✅ Suggestion added to DOM");
    
    // Add event listeners
    const loginBtn = document.getElementById('login-btn');
    const closeBtn = document.getElementById('close-suggestion');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log("Login button clicked");
            this.showLoginModal();
            this.removeSuggestion();
        });
        
        // Hover effects
        loginBtn.addEventListener('mouseenter', () => {
            loginBtn.style.backgroundColor = 'var(--primary)';
            loginBtn.style.transform = 'scale(1.05)';
        });
        
        loginBtn.addEventListener('mouseleave', () => {
            loginBtn.style.backgroundColor = 'var(--secondary)';
            loginBtn.style.transform = 'scale(1)';
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log("Close button clicked");
            this.removeSuggestion();
        });
        
        // Hover effects for close button
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.backgroundColor = '#e0e0e0';
            closeBtn.style.color = '#333';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.backgroundColor = '#f5f5f5';
            closeBtn.style.color = '#888';
        });
    }
    
    // Auto remove after 30 seconds
    setTimeout(() => {
        this.removeSuggestion();
    }, 30000);
    
    // Log success
    console.log("✅ Login suggestion displayed successfully");
}

// Add removeSuggestion method
removeSuggestion() {
    const suggestion = document.getElementById('login-suggestion');
    if (suggestion) {
        suggestion.style.animation = 'fadeOutDown 0.3s ease forwards';
        setTimeout(() => {
            if (suggestion.parentNode) {
                suggestion.remove();
                console.log("🗑️ Suggestion removed");
            }
        }, 300);
    }
}
    
    // Check for saved user in localStorage
    checkSavedUser() {
        try {
            const savedUser = localStorage.getItem('firebaseUser');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                console.log("📱 Found saved user:", userData.email || userData.uid);
            }
        } catch (e) {
            console.log("📱 No valid saved user found");
        }
    }
    
    // Try anonymous login
    async tryAnonymousLogin() {
        try {
            // Check if anonymous auth is enabled
            const userCredential = await this.auth.signInAnonymously();
            console.log("✅ Anonymous login successful");
            
            // Update user profile
            const user = userCredential.user;
            this.userProfile = {
                uid: user.uid,
                displayName: 'Guest User',
                isAnonymous: true
            };
            
            localStorage.setItem('firebaseUser', JSON.stringify(this.userProfile));
            
            // Show notification
            this.showNotification("Logged in as guest. Some features may be limited.", 'info');
            
            return { success: true, user: user };
            
        } catch (error) {
            console.error("❌ Anonymous login error:", error.message);
            
            // If anonymous auth is disabled, show login suggestion
            if (error.code === 'auth/admin-restricted-operation') {
                console.log("ℹ️ Anonymous auth is disabled. Using local storage only.");
                this.showLoginSuggestion();
            }
            
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
    
    // Show login suggestion
    showLoginSuggestion() {
        // Check if suggestion already exists
        if (document.getElementById('login-suggestion')) return;
        
        // Only show suggestion on index.html
        if (!window.location.pathname.includes('index.html')) return;
        
 setTimeout(() => {
    const suggestion = document.createElement('div');
    suggestion.id = 'login-suggestion';
    suggestion.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <div style="display: flex; gap: 5px;">
                <button id="login-btn" style="padding: 6px 14px; background: var(--secondary); color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer;">
                    Login
                </button>
                <button id="close-suggestion" style="background: transparent; border: none; color: #888; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px;">
                    ×
                </button>
            </div>
        </div>
    `;
    
    suggestion.style.cssText = `
        position: fixed;
        bottom: 50px;
        right: 20px;
        background: white;
        padding: 12px 16px;
        border-radius: 12px;
        z-index: 99999;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        font-family: 'Poppins', sans-serif;
        animation: slideUpDirect 0.5s ease;
        max-width: 380px;
    `;
    
    // Add CSS animation
    if (!document.querySelector('#login-suggestion-anim')) {
        const style = document.createElement('style');
        style.id = 'login-suggestion-anim';
        style.textContent = `
            @keyframes slideUpDirect {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(suggestion);
    
    // Login button click
    document.getElementById('login-btn').addEventListener('click', () => {
        this.showLoginModal();
        suggestion.style.animation = 'fadeOutSlideDown 0.3s ease forwards';
        setTimeout(() => {
            if (suggestion.parentNode) suggestion.remove();
        }, 300);
    });
    
    // Close button click
    document.getElementById('close-suggestion').addEventListener('click', () => {
        suggestion.style.animation = 'fadeOutSlideDown 0.3s ease forwards';
        setTimeout(() => {
            if (suggestion.parentNode) suggestion.remove();
        }, 300);
    });
    
    setTimeout(() => {
        if (suggestion.parentNode) {
            suggestion.style.animation = 'fadeOutSlideDown 0.3s ease forwards';
            setTimeout(() => {
                if (suggestion.parentNode) suggestion.remove();
            }, 300);
        }
    }, 100000);
    
}, 0);
    }
    
  // Method to show login modal
showLoginModal() {
    console.log("🔐 Showing login modal");
    
    // Check if modal already exists
    if (document.getElementById('firebase-login-modal')) {
        const existingModal = document.getElementById('firebase-login-modal');
        existingModal.classList.add('show');
        document.body.classList.add('modal-open');
        return;
    }
    
    // Create modal HTML
    const modalHTML = `
        <div id="firebase-login-modal" class="modal">
            <div class="firebase-login-modal-content">
                <h3>Cloud Sync Login</h3>
                <p class="firebase-login-subtitle">Login to sync your data with Firebase Cloud</p>
                
                <div class="firebase-login-input-group">
                    <input type="email" id="firebase-login-email" 
                           class="firebase-login-input" 
                           placeholder="Email address"
                           autocomplete="email">
                </div>
                  <span class="material-symbols-outlined">visibility</span>
                <div class="firebase-login-input-group">
                    <div class="firebase-password-container">
                        <input type="password" id="firebase-login-password" 
                               class="firebase-login-input" 
                               placeholder="Password"
                               autocomplete="current-password">
                        <button type="button" class="firebase-show-password" id="firebase-show-password">

                        </button>
                    </div>
                </div>
                
                <div id="firebase-login-error" class="firebase-login-error"></div>
                
                <div class="firebase-login-button-group">
                    <button id="firebase-modal-login" class="firebase-login-btn">
                        Login
                    </button>
                    <button id="firebase-modal-register" class="firebase-register-btn">
                        Register
                    </button>
                </div>
                
                <div class="firebase-continue-offline">
                    <button id="firebase-modal-continue" class="firebase-continue-btn">
                        Continue without login
                    </button>
                </div>
                
                <div style="margin-top: 25px;">
                    <button id="firebase-modal-close" class="firebase-login-close-btn">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.classList.add('modal-open');
    
    // Get references
    const modal = document.getElementById('firebase-login-modal');
    const emailInput = document.getElementById('firebase-login-email');
    const passwordInput = document.getElementById('firebase-login-password');
    const showPasswordBtn = document.getElementById('firebase-show-password');
    const errorDiv = document.getElementById('firebase-login-error');
    
    // Show modal with animation
    setTimeout(() => {
        modal.classList.add('show');
        
        // Focus on email input
        setTimeout(() => {
            emailInput.focus();
        }, 300);
    }, 10);
    
    // Toggle password visibility
    showPasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Change icon
        const icon = showPasswordBtn.querySelector('.material-symbols-outlined');
        icon.textContent = type === 'password' ? 'visibility' : 'visibility_off';
    });
    
    // Login button
    document.getElementById('firebase-modal-login').addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Clear previous errors
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
        
        // Validation
        if (!email) {
            errorDiv.textContent = 'Please enter your email';
            errorDiv.style.display = 'block';
            emailInput.focus();
            return;
        }
        
        if (!password) {
            errorDiv.textContent = 'Please enter your password';
            errorDiv.style.display = 'block';
            passwordInput.focus();
            return;
        }
        
        // Show loading state
        const loginBtn = document.getElementById('firebase-modal-login');
        const originalText = loginBtn.textContent;
        loginBtn.textContent = 'Logging in...';
        loginBtn.disabled = true;
        
        try {
            const result = await this.login(email, password);
            
            if (result.success) {
                // Success - close modal
                this.closeLoginModal();
                this.showNotification('Login successful! ✅', 'success');
            } else {
                // Show error
                errorDiv.textContent = result.error;
                errorDiv.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (error) {
            errorDiv.textContent = 'An unexpected error occurred';
            errorDiv.style.display = 'block';
        } finally {
            // Restore button
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
        }
    });
    
    // Register button
    document.getElementById('firebase-modal-register').addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        // Clear previous errors
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
        
        // Validation
        if (!email) {
            errorDiv.textContent = 'Please enter your email';
            errorDiv.style.display = 'block';
            emailInput.focus();
            return;
        }
        
        if (!password) {
            errorDiv.textContent = 'Please enter your password';
            errorDiv.style.display = 'block';
            passwordInput.focus();
            return;
        }
        
        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters';
            errorDiv.style.display = 'block';
            passwordInput.focus();
            return;
        }
        
        // Show loading state
        const registerBtn = document.getElementById('firebase-modal-register');
        const originalText = registerBtn.textContent;
        registerBtn.textContent = 'Registering...';
        registerBtn.disabled = true;
        
        try {
            const displayName = email.split('@')[0];
            const result = await this.register(email, password, displayName);
            
            if (result.success) {
                errorDiv.textContent = 'Registration successful! Please login.';
                errorDiv.style.display = 'block';
                errorDiv.style.color = '#6bcf7f';
                
                // Clear password field
                passwordInput.value = '';
                
                // Switch focus to password for login
                setTimeout(() => {
                    passwordInput.focus();
                }, 100);
            } else {
                errorDiv.textContent = result.error;
                errorDiv.style.display = 'block';
                errorDiv.style.color = '#e74c3c';
            }
        } catch (error) {
            errorDiv.textContent = 'An unexpected error occurred';
            errorDiv.style.display = 'block';
            errorDiv.style.color = '#e74c3c';
        } finally {
            // Restore button
            registerBtn.textContent = originalText;
            registerBtn.disabled = false;
        }
    });
    
    // Continue without login
    document.getElementById('firebase-modal-continue').addEventListener('click', () => {
        this.closeLoginModal();
        this.showNotification('Continuing in offline mode 📱', 'info');
    });
    
    // Close button
    document.getElementById('firebase-modal-close').addEventListener('click', () => {
        this.closeLoginModal();
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            this.closeLoginModal();
        }
    });
    
    // Close on Escape key
    const closeOnEscape = (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            this.closeLoginModal();
            document.removeEventListener('keydown', closeOnEscape);
        }
    };
    document.addEventListener('keydown', closeOnEscape);
    
    // Enter key to submit
    const handleEnterKey = (e) => {
        if (e.key === 'Enter' && modal.classList.contains('show')) {
            if (emailInput === document.activeElement || passwordInput === document.activeElement) {
                document.getElementById('firebase-modal-login').click();
            }
        }
    };
    document.addEventListener('keydown', handleEnterKey);
    
    // Cleanup function
    modal.cleanup = () => {
        document.removeEventListener('keydown', closeOnEscape);
        document.removeEventListener('keydown', handleEnterKey);
    };
}

// Method to close login modal
closeLoginModal() {
    const modal = document.getElementById('firebase-login-modal');
    if (modal) {
        // Run cleanup if exists
        if (modal.cleanup) {
            modal.cleanup();
        }
        
        // Remove with animation
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
                document.body.classList.remove('modal-open');
            }
        }, 300);
    }
}
    
    // Initialize user data in Firestore
    async initializeUserData(user) {
        try {
            if (!this.db || user.isAnonymous) return;
            
            const userRef = this.db.collection('users').doc(user.uid);
            const userDoc = await userRef.get();
            
            if (!userDoc.exists) {
                // Create new user document
                await userRef.set({
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    organizations: []
                });
                console.log("✅ New user created in Firestore");
            } else {
                // Update last login
                await userRef.update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error("❌ Error initializing user data:", error);
        }
    }
    
    // Start auto-sync of local data to Firebase
    startAutoSync() {
        if (!this.isLoggedIn() || this.currentUser?.isAnonymous) {
            console.log("⏸️ Auto-sync disabled for anonymous users");
            return;
        }
        
        // Sync local data every 60 seconds
        this.syncInterval = setInterval(() => {
            this.syncLocalDataToFirebase();
        }, 60000);
        
        // Also sync when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(() => {
                    this.syncLocalDataToFirebase();
                }, 1000);
            }
        });
        
        // Sync on page load
        setTimeout(() => {
            this.syncLocalDataToFirebase();
        }, 3000);
        
        console.log("🔄 Auto-sync started");
    }
    
    // Sync local data to Firebase
    async syncLocalDataToFirebase() {
        if (!this.isLoggedIn() || this.currentUser?.isAnonymous) return;
        
        const selectedOrg = localStorage.getItem('selectedOrganization');
        if (!selectedOrg || !window.dbManager) return;
        
        try {
            await window.dbManager.syncAllLocalData();
        } catch (error) {
            console.error("❌ Auto-sync error:", error);
        }
    }
    
    // Register new user
    async register(email, password, displayName) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update display name
            await user.updateProfile({
                displayName: displayName
            });
            
            console.log("✅ Registration successful:", user.email);
            return { success: true, user: user };
            
        } catch (error) {
            console.error("❌ Registration error:", error.message);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
    
    // Login existing user
    async login(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            console.log("✅ Login successful:", userCredential.user.email);
            return { success: true, user: userCredential.user };
            
        } catch (error) {
            console.error("❌ Login error:", error.message);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
    
    // Logout
    async logout() {
        try {
            await this.auth.signOut();
            console.log("✅ Logout successful");
            
            // Clear sync interval
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
                this.syncInterval = null;
            }
            
            return { success: true };
            
        } catch (error) {
            console.error("❌ Logout error:", error.message);
            return { success: false, error: error.message };
        }
    }
    
    // Get user-friendly error messages
    getErrorMessage(error) {
        switch(error.code) {
            case 'auth/email-already-in-use':
                return 'Email already in use';
            case 'auth/invalid-email':
                return 'Invalid email format';
            case 'auth/weak-password':
                return 'Password too weak (min 6 characters)';
            case 'auth/user-not-found':
                return 'User not found';
            case 'auth/wrong-password':
                return 'Wrong password';
            case 'auth/too-many-requests':
                return 'Too many attempts. Try again later';
            case 'auth/admin-restricted-operation':
                return 'Anonymous login is disabled';
            case 'auth/network-request-failed':
                return 'Network error. Check your connection';
            default:
                return error.message.replace('Firebase: ', '');
        }
    }
    
    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.firebase-notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `firebase-notification ${type}`;
        notification.innerHTML = `
            <span class="material-symbols-outlined" style="margin-right: 8px; vertical-align: middle;">
                ${type === 'success' ? 'check_circle' : 
                  type === 'error' ? 'error' : 
                  type === 'warning' ? 'warning' : 'info'}
            </span>
            <span>${message}</span>
        `;
        
        const iconColor = type === 'success' ? '#4CAF50' :
                         type === 'error' ? '#f44336' :
                         type === 'warning' ? '#FF9800' : '#2196F3';
        
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            background: white;
            color: #333;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: 'Poppins', sans-serif;
            font-size: 14px;
            display: flex;
            align-items: center;
            border-left: 4px solid ${iconColor};
            animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
    
    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }
    
    // Get user profile
    getUserProfile() {
        return this.userProfile;
    }
    
    // Check if user is anonymous
    isAnonymous() {
        return this.currentUser?.isAnonymous || false;
    }
}

// Initialize auth system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to be ready
    const checkFirebase = setInterval(() => {
        if (window.firebaseServices?.auth) {
            clearInterval(checkFirebase);
            window.firebaseAuth = new FirebaseAuthSystem();
            console.log("✅ Firebase Auth initialized");
        }
    }, 100);
});
