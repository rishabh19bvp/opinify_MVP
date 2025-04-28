// LEGACY FILE: All Firebase authentication flows are now handled by firebaseAuth.ts
// This file is kept for backward compatibility only. All functions here are deprecated and will throw errors.
// Please import from './firebaseAuth' for all authentication needs.

export const registerUser = async () => { throw new Error('LEGACY: Use firebaseAuth.ts registerUser instead'); };
export const loginUser = async () => { throw new Error('LEGACY: Use firebaseAuth.ts loginUser instead'); };
export const logoutUser = async () => { throw new Error('LEGACY: Use firebaseAuth.ts logoutUser instead'); };
export const resetPassword = async () => { throw new Error('LEGACY: Use firebaseAuth.ts resetPassword instead'); };
export const signInWithGoogle = async () => { throw new Error('LEGACY: Use firebaseAuth.ts signInWithGoogle instead'); };
export const startPhoneVerification = async () => { throw new Error('LEGACY: Use firebaseAuth.ts startPhoneVerification instead'); };
export const confirmPhoneVerification = async () => { throw new Error('LEGACY: Use firebaseAuth.ts confirmPhoneVerification instead'); };
export const onAuthStateChanged = () => { throw new Error('LEGACY: Use firebaseAuth.ts onAuthStateChanged instead'); };
export const signInAnonymouslyForTesting = async () => {
  return {
    success: false,
    message: null,
    error: 'LEGACY: Use firebaseAuth.ts signInAnonymouslyForTesting instead',
  };
};

const auth = {};
export default auth;
