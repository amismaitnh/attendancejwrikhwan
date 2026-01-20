// firebase-config.js - COMPLETE FIREBASE CONFIGURATION
console.log("🔧 Loading Firebase configuration...");

// Your Firebase Configuration
// ================================
// REPLACE THESE VALUES WITH YOUR ACTUAL FIREBASE CONFIG
// ================================

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDGMn56v-AEYU5EL88URr8DQE0FB_zVAZ4",
    authDomain: "attendance-jwr-ikhwan.firebaseapp.com",
    projectId: "attendance-jwr-ikhwan",
    storageBucket: "attendance-jwr-ikhwan.firebasestorage.app",
    messagingSenderId: "269032011038",
    appId: "1:269032011038:web:1e467882545a156b1f050f"
};


// ================================
// DEBUG: Check if config is valid
// ================================
console.log("🔍 Checking Firebase configuration...");
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key] || firebaseConfig[key].includes('YOUR_'));

if (missingKeys.length > 0) {
    console.error("❌ Firebase configuration is incomplete!");
    console.error("Missing or placeholder values for:", missingKeys);
    console.error("Please replace with your actual Firebase project values.");
    
    // Show user-friendly error
    if (typeof document !== 'undefined') {
        setTimeout(() => {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 70px;
                left: 50%;
                transform: translateX(-50%);
                background: #ff6b6b;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 9999;
                font-family: 'Poppins', sans-serif;
                text-align: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                max-width: 80%;
                animation: slideDown 0.3s ease;
            `;
            errorDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <span class="material-symbols-outlined" style="font-size: 20px;">
                        error
                    </span>
                    <strong>Firebase Configuration Required</strong>
                </div>
                <div style="font-size: 12px; opacity: 0.9;">
                    Please update firebase-config.js with your actual Firebase project values.
                </div>
            `;
            
            // Add animation style
            if (!document.querySelector('#error-anim')) {
                const style = document.createElement('style');
                style.id = 'error-anim';
                style.textContent = `
                    @keyframes slideDown {
                        from {
                            transform: translate(-50%, -100%);
                            opacity: 0;
                        }
                        to {
                            transform: translate(-50%, 0);
                            opacity: 1;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(errorDiv);
            
            // Remove after 10 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.style.opacity = '0';
                    errorDiv.style.transform = 'translate(-50%, -20px)';
                    setTimeout(() => {
                        if (errorDiv.parentNode) errorDiv.remove();
                    }, 300);
                }
            }, 10000);
        }, 2000);
    }
} else {
    console.log("✅ Firebase configuration is valid");
}

// Initialize Firebase Services
// ================================
console.log("🚀 Initializing Firebase services...");

let firebaseServices = null;
let initializationError = null;

try {
    // Initialize Firebase App
    const app = firebase.initializeApp(firebaseConfig);
    
    // Initialize services
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();
    
    // Configure Firestore settings (optional)
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        // Local development settings
        console.log("🏠 Development mode: Using local emulator settings");
        
        // Uncomment these lines if you're using Firebase Emulator
        /*
        db.useEmulator("localhost", 8080);
        auth.useEmulator("http://localhost:9099");
        storage.useEmulator("localhost", 9199);
        */
    } else {
        // Production settings
        db.settings({
            cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
        });
        
        // Enable offline persistence
        db.enablePersistence()
            .then(() => {
                console.log("💾 Firestore offline persistence enabled");
            })
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.log("⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time.");
                } else if (err.code === 'unimplemented') {
                    console.log("⚠️ The current browser doesn't support all of the features required to enable persistence");
                }
            });
    }
    
    // Configure Auth persistence
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log("🔐 Auth persistence set to LOCAL");
        })
        .catch((error) => {
            console.error("❌ Error setting auth persistence:", error);
        });
    
    // Create services object
    firebaseServices = {
        app: app,
        auth: auth,
        db: db,
        storage: storage,
        firebase: firebase
    };
    
    // Make available globally
    window.firebaseServices = firebaseServices;
    
    console.log("✅ Firebase services initialized successfully!");
    console.log("📊 Services available:");
    console.log("  - Auth:", !!auth);
    console.log("  - Firestore:", !!db);
    console.log("  - Storage:", !!storage);
    
} catch (error) {
    initializationError = error;
    console.error("❌ Firebase initialization failed:", error);
    
    // Show error to user
    if (typeof document !== 'undefined') {
        setTimeout(() => {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 70px;
                left: 50%;
                transform: translateX(-50%);
                background: #ff6b6b;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 9999;
                font-family: 'Poppins', sans-serif;
                text-align: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                max-width: 80%;
                animation: slideDown 0.3s ease;
            `;
            errorDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <span class="material-symbols-outlined" style="font-size: 20px;">
                        cloud_off
                    </span>
                    <strong>Firebase Connection Error</strong>
                </div>
                <div style="font-size: 12px; opacity: 0.9;">
                    ${error.message || 'Cannot connect to Firebase. Using local storage only.'}
                </div>
            `;
            document.body.appendChild(errorDiv);
            
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.style.opacity = '0';
                    setTimeout(() => {
                        if (errorDiv.parentNode) errorDiv.remove();
                    }, 300);
                }
            }, 8000);
        }, 1000);
    }
}

// Firebase Utility Functions
// ================================
class FirebaseUtils {
    constructor() {
        this.services = window.firebaseServices;
    }
    
    // Check if Firebase is ready
    isReady() {
        return !!this.services && !!this.services.auth && !!this.services.db;
    }
    
    // Get current user
    getCurrentUser() {
        return this.services?.auth?.currentUser;
    }
    
    // Check if user is logged in
    isLoggedIn() {
        return !!this.getCurrentUser();
    }
    
    // Check if user is anonymous
    isAnonymous() {
        const user = this.getCurrentUser();
        return user ? user.isAnonymous : false;
    }
    
    // Get authentication state
    getAuthState() {
        return new Promise((resolve) => {
            if (!this.services?.auth) {
                resolve(null);
                return;
            }
            
            this.services.auth.onAuthStateChanged((user) => {
                resolve(user);
            });
        });
    }
    
    // Test Firebase connection
    async testConnection() {
        try {
            if (!this.isReady()) {
                return { success: false, error: 'Firebase not initialized' };
            }
            
            const testRef = this.services.db.collection('_test').doc('connection');
            await testRef.set({
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                test: true,
                userAgent: navigator.userAgent
            }, { merge: true });
            
            console.log("✅ Firebase connection test successful");
            return { success: true };
            
        } catch (error) {
            console.error("❌ Firebase connection test failed:", error);
            return { success: false, error: error.message };
        }
    }
    
    // Get Firebase configuration
    getConfig() {
        return firebaseConfig;
    }
    
    // Clear Firebase data (for testing)
    async clearTestData() {
        try {
            if (!this.isReady()) return;
            
            const testRef = this.services.db.collection('_test').doc('connection');
            await testRef.delete();
            console.log("🧹 Test data cleared");
            
        } catch (error) {
            console.error("Error clearing test data:", error);
        }
    }
    
    // Upload file to Storage
    async uploadFile(file, path, metadata = {}) {
        try {
            if (!this.services?.storage) {
                throw new Error('Storage not available');
            }
            
            const storageRef = this.services.storage.ref().child(path);
            const uploadTask = storageRef.put(file, metadata);
            
            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        // Progress tracking
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`Upload progress: ${progress}%`);
                    },
                    (error) => {
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                        resolve({
                            success: true,
                            url: downloadURL,
                            path: path,
                            metadata: uploadTask.snapshot.metadata
                        });
                    }
                );
            });
            
        } catch (error) {
            console.error('Upload error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Get download URL from Storage
    async getFileUrl(path) {
        try {
            if (!this.services?.storage) {
                throw new Error('Storage not available');
            }
            
            const storageRef = this.services.storage.ref().child(path);
            const url = await storageRef.getDownloadURL();
            return { success: true, url: url };
            
        } catch (error) {
            console.error('Get URL error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize and expose utilities
const firebaseUtils = new FirebaseUtils();
window.firebaseUtils = firebaseUtils;

// Wait for DOM to be ready before showing notifications
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Run connection test after page loads
        setTimeout(async () => {
            if (firebaseUtils.isReady()) {
                const testResult = await firebaseUtils.testConnection();
                
                if (testResult.success) {
                    console.log("🌐 Firebase is connected and ready");
                    
                    // Show success notification
                    const notification = document.createElement('div');
                    notification.style.cssText = `
                        position: fixed;
                        top: 70px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #6bcf7f;
                        color: white;
                        padding: 10px 15px;
                        border-radius: 8px;
                        z-index: 9999;
                        font-family: 'Poppins', sans-serif;
                        text-align: center;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                        font-size: 12px;
                        animation: slideDown 0.3s ease;
                    `;
                    notification.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span>Connected</span>
                        </div>
                    `;
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.style.opacity = '0';
                            setTimeout(() => {
                                if (notification.parentNode) notification.remove();
                            }, 300);
                        }
                    }, 3000);
                }
            }
        }, 3000);
    });
}

// Debug functions
window.debugFirebase = {
    config: () => {
        console.log("🔧 Firebase Config:", firebaseConfig);
        console.log("🔧 Firebase Services:", window.firebaseServices);
        console.log("🔧 Firebase Utils:", window.firebaseUtils);
        console.log("🔧 Current User:", window.firebaseServices?.auth?.currentUser);
        console.log("🔧 Is Ready:", window.firebaseUtils?.isReady());
    },
    
    test: async () => {
        console.log("🧪 Running Firebase tests...");
        const result = await firebaseUtils.testConnection();
        console.log("Test Result:", result);
        return result;
    },
    
    auth: () => {
        const auth = window.firebaseServices?.auth;
        console.log("🔐 Auth State:", {
            currentUser: auth?.currentUser,
            isLoggedIn: !!auth?.currentUser,
            isAnonymous: auth?.currentUser?.isAnonymous,
            email: auth?.currentUser?.email
        });
    },
    
    storage: async () => {
        console.log("📦 Storage Test");
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        const result = await firebaseUtils.uploadFile(testBlob, '_test/test.txt');
        console.log("Storage Test Result:", result);
    }
};

console.log("🎉 Firebase configuration module loaded successfully!");

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        firebaseConfig,
        firebaseServices,
        FirebaseUtils,
        firebaseUtils
    };
}
