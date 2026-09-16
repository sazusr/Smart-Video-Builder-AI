import type { StoryProject } from '../types/storyVideo';
﻿import { setDoc } from 'firebase/firestore';
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp,
  type DocumentData, type QueryDocumentSnapshot,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { GenerationResult } from '../types';

const GENERATIONS_COL = 'generations';

// â”€â”€ Save a generation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function saveGeneration(
  userId: string,
  result: GenerationResult
): Promise<string> {
  const docRef = await addDoc(collection(db, GENERATIONS_COL), {
    ...result,
    userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// â”€â”€ Get user generations (paginated) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getUserGenerations(
  userId: string,
  pageSize = 20,
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
  filters?: { language?: string; contentType?: string }
): Promise<{ items: (GenerationResult & { id: string })[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  let q = query(
    collection(db, GENERATIONS_COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(
      collection(db, GENERATIONS_COL),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const snap = await getDocs(q);
  let items = snap.docs.map(d => ({ id: d.id, ...d.data() } as GenerationResult & { id: string }));

  // Client-side filter (simpler than composite indexes)
  if (filters?.language) {
    items = items.filter(item => item.language === filters.language);
  }
  if (filters?.contentType) {
    items = items.filter(item => item.contentType === filters.contentType);
  }

  return {
    items,
    lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
  };
}

// â”€â”€ Get total generation count for a user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getUserGenerationCount(userId: string): Promise<number> {
  try {
    const q = query(
      collection(db, GENERATIONS_COL),
      where('userId', '==', userId)
    );
    const countSnap = await getCountFromServer(q);
    return countSnap.data().count;
  } catch {
    return 0;
  }
}

// â”€â”€ Get total generation count (admin) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getTotalGenerationCount(): Promise<number> {
  try {
    const countSnap = await getCountFromServer(collection(db, GENERATIONS_COL));
    return countSnap.data().count;
  } catch {
    return 0;
  }
}

// â”€â”€ Toggle favorite â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function toggleFavorite(genId: string, value: boolean): Promise<void> {
  await updateDoc(doc(db, GENERATIONS_COL, genId), { isFavorited: value });
}

// â”€â”€ Delete generation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function deleteGeneration(genId: string): Promise<void> {
  await deleteDoc(doc(db, GENERATIONS_COL, genId));
}

// â”€â”€ Save admin API settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface SystemSettings {
  backupKey?: string;
  appUpdateLink?: string;
  tutorialLink?: string;
  communityLink?: string;
  whatsappLink?: string;
  websiteLink?: string;
  geminiApiKeyLink?: string;
}

export async function saveAdminGeminiSettings(settings: SystemSettings): Promise<void> {
  const { setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'settings', 'gemini'), {
    ...settings,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// â”€â”€ Get admin Gemini settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getAdminGeminiSettings(): Promise<SystemSettings | null> {
  const snap = await getDoc(doc(db, 'settings', 'gemini'));
  if (!snap.exists()) return null;
  return snap.data() as SystemSettings;
}

export interface PublicSettings {
  paymentNumber?: string;
  paymentAmount?: string;
  appVersion?: string;
  activeMethods?: {
    bkash: boolean;
    nagad: boolean;
    rocket: boolean;
  };
}

// â”€â”€ Public Settings (e.g. Payment Number) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getPublicSettings(): Promise<PublicSettings | null> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'public'));
    if (!snap.exists()) return null;
    return snap.data() as PublicSettings;
  } catch (e) {
    return null;
  }
}

export async function savePublicSettings(settings: Partial<PublicSettings>): Promise<void> {
  const { setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'settings', 'public'), settings, { merge: true });
}

// â”€â”€ User: Get API keys array â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getUserApiKeys(uid: string): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return [];
    const data = snap.data();
    const keys: string[] = data.geminiApiKeys || [];
    // Also include single key for backward compat
    if (data.geminiApiKey && !keys.includes(data.geminiApiKey)) {
      return [data.geminiApiKey, ...keys];
    }
    return keys;
  } catch { return []; }
}

// â”€â”€ User: Save API keys array â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function saveUserApiKeys(uid: string, keys: string[]): Promise<void> {
  const { updateDoc } = await import('firebase/firestore');
  const cleanKeys = keys.map(k => k.trim()).filter(Boolean);
  await updateDoc(doc(db, 'users', uid), {
    geminiApiKeys: cleanKeys,
    // Keep first key as primary for backward compat
    geminiApiKey: cleanKeys[0] || '',
  });
}

// â”€â”€ Admin: Save API keys array â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function saveAdminApiKeys(keys: string[]): Promise<void> {
  const { setDoc } = await import('firebase/firestore');
  const cleanKeys = keys.map(k => k.trim()).filter(Boolean);
  await setDoc(doc(db, 'settings', 'gemini'), {
    apiKeys: cleanKeys,
    backupKey: cleanKeys[0] || '',
    updatedAt: serverTimestamp(),
  }, { merge: true });
}


// ── Story Video Projects ──────────────────────────────────────────────────
export const STORY_PROJECTS_COL = 'story_projects';

// Helper to strip undefined values recursively (Firestore doesn't allow undefined)
function removeUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, removeUndefined(v)])
    );
  }
  return obj;
}

export async function saveStoryProject(userId: string, project: StoryProject): Promise<void> {
  const { setDoc } = await import('firebase/firestore');
  const cleanData = removeUndefined({
    ...project,
    userId,
    updatedAt: new Date().toISOString()
  });
  await setDoc(doc(db, STORY_PROJECTS_COL, project.id), cleanData);
}

export async function getStoryProject(projectId: string): Promise<StoryProject | null> {
  const snap = await getDoc(doc(db, STORY_PROJECTS_COL, projectId));
  if (!snap.exists()) return null;
  return snap.data() as StoryProject;
}

export async function getUserStoryProjects(userId: string, pageSize = 20): Promise<StoryProject[]> {
  const q = query(
    collection(db, STORY_PROJECTS_COL),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
    limit(pageSize)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as StoryProject);
}

export async function deleteStoryProject(projectId: string): Promise<void> {
  await deleteDoc(doc(db, STORY_PROJECTS_COL, projectId));
}
