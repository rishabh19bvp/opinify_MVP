// This file is kept as a placeholder for backward compatibility
// We've migrated to JWT authentication

// This file is kept as a placeholder for backward compatibility
// We've migrated to JWT authentication

// Dummy exports to maintain compatibility with existing imports
export const registerUser = async () => { throw new Error('Firebase auth is no longer used'); };
export const loginUser = async () => { throw new Error('Firebase auth is no longer used'); };
export const logoutUser = async () => { throw new Error('Firebase auth is no longer used'); };
export const resetPassword = async () => { throw new Error('Firebase auth is no longer used'); };
export const signInWithGoogle = async () => { throw new Error('Firebase auth is no longer used'); };
export const startPhoneVerification = async () => { throw new Error('Firebase auth is no longer used'); };
export const confirmPhoneVerification = async () => { throw new Error('Firebase auth is no longer used'); };
export const onAuthStateChanged = () => { throw new Error('Firebase auth is no longer used'); };
export const signInAnonymouslyForTesting = async () => {
  return {
    success: false,
    message: null,
    error: 'Firebase auth is no longer used',
  };
};

// Dummy auth object
const auth = {};
export default auth;
