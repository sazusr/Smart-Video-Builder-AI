import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { AppUser, UserRole, UserStatus } from '../types';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

// â”€â”€â”€ Register â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  paymentNumber?: string,
  phone?: string,
  paymentMethod?: string
): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user);

  const isAdmin = email.toLowerCase() === ADMIN_EMAIL?.toLowerCase();
  const role: UserRole = isAdmin ? 'admin' : 'user';
  const status: UserStatus = isAdmin ? 'active' : 'pending';

  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    email: email.toLowerCase(),
    displayName,
    phone: phone || null,
    role,
    status,
    plan: 'pro',
    paymentNumber: paymentNumber || null,
    paymentMethod: paymentMethod || null,
    createdAt: serverTimestamp(),
    approvedAt: isAdmin ? serverTimestamp() : null,
    approvedBy: isAdmin ? 'system' : null,
    lastLoginAt: serverTimestamp(),
    photoURL: null,
  });
}

// â”€â”€â”€ Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function loginUser(email: string, password: string): Promise<AppUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const userRef = doc(db, 'users', cred.user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    // Document exists â€” just update lastLoginAt
    await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
  } else {
    // Document missing â€” auto-create it (e.g. manually created admin in Firebase Auth)
    const isAdmin = email.toLowerCase() === ADMIN_EMAIL?.toLowerCase();
    const role: UserRole = isAdmin ? 'admin' : 'user';
    const status: UserStatus = isAdmin ? 'active' : 'pending';
    await setDoc(userRef, {
      uid: cred.user.uid,
      email: email.toLowerCase(),
      displayName: cred.user.displayName || email.split('@')[0],
      role,
      status,
      plan: 'pro',
      createdAt: serverTimestamp(),
      approvedAt: isAdmin ? serverTimestamp() : null,
      approvedBy: isAdmin ? 'system' : null,
      lastLoginAt: serverTimestamp(),
      photoURL: cred.user.photoURL || null,
    });
  }

  const updated = await getDoc(userRef);
  if (!updated.exists()) throw new Error('User profile not found.');
  return updated.data() as AppUser;
}

// â”€â”€â”€ Google Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function loginWithGoogle(): Promise<AppUser> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);

  const userRef = doc(db, 'users', cred.user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const isAdmin = cred.user.email?.toLowerCase() === ADMIN_EMAIL?.toLowerCase();
    await setDoc(userRef, {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName || 'User',
      role: isAdmin ? 'admin' : 'user',
      status: isAdmin ? 'active' : 'pending',
      plan: 'pro',
      createdAt: serverTimestamp(),
      approvedAt: isAdmin ? serverTimestamp() : null,
      approvedBy: isAdmin ? 'system' : null,
      lastLoginAt: serverTimestamp(),
      photoURL: cred.user.photoURL,
    });
  } else {
    await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
  }

  const updated = await getDoc(userRef);
  return updated.data() as AppUser;
}

// â”€â”€â”€ Logout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// â”€â”€â”€ Get user profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as AppUser;
}

// â”€â”€â”€ Update User Gemini API Key â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function updateUserGeminiKey(uid: string, key: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { geminiApiKey: key });
}

// â”€â”€â”€ Forgot password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// â”€â”€â”€ Auth state listener â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// â”€â”€â”€ Admin: get all users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getAllUsers(): Promise<AppUser[]> {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as AppUser);
}

// â”€â”€â”€ Admin: update user status / role â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function updateUserStatus(
  uid: string,
  status: UserStatus,
  approvedBy?: string
): Promise<void> {
  const updates: Record<string, unknown> = { status };
  if (status === 'active') {
    updates.approvedAt = serverTimestamp();
    updates.approvedBy = approvedBy || 'admin';
  }
  await updateDoc(doc(db, 'users', uid), updates);
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { role });
}

// â”€â”€â”€ Ensure admin account exists (called on app init) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function ensureAdminExists(): Promise<void> {
  try {
    const q = query(
      collection(db, 'users'),
      where('email', '==', ADMIN_EMAIL?.toLowerCase())
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      // Admin account does not exist â€” it will be created on first login
      console.log('[Auth] Admin account not yet created. Register at /register with admin email.');
    }
  } catch {
    // Silent fail â€” non-critical
  }
}
