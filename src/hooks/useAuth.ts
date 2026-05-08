import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, getDocs, limit, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  firstName?: string;
  phone?: string;
  channelName?: string;
  geminiApiKey?: string;
  geminiBackupApiKeys?: string[];
  role: 'admin' | 'user';
  status: 'active' | 'pending' | 'blocked';
  createdAt: any;
  updatedAt: any;
}

const SUPER_ADMIN_EMAIL = 'freelancersazu3@gmail.com';

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        setUser(u);
        if (u) {
          const isSuperAdmin = u.email === SUPER_ADMIN_EMAIL;
          
          // Fetch or create profile with retry logic for offline states
          const userDocRef = doc(db, 'users', u.uid);
          let userDoc;
          let retries = 3;
          
          while (retries > 0) {
            try {
              userDoc = await getDoc(userDocRef);
              break;
            } catch (e: any) {
              if (e.message?.includes('offline') && retries > 1) {
                console.warn(`Firestore offline, retrying (${retries} left)...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                retries--;
              } else {
                throw e;
              }
            }
          }

          if (userDoc && userDoc.exists()) {
            let profileData = userDoc.data() as UserProfile;
            
            // Force Super Admin privileges and active status if email matches
            if (isSuperAdmin && (profileData.role !== 'admin' || profileData.status !== 'active')) {
              profileData.role = 'admin';
              profileData.status = 'active';
              await setDoc(userDocRef, { 
                role: 'admin', 
                status: 'active',
                updatedAt: serverTimestamp()
              }, { merge: true });
              try {
                await setDoc(doc(db, 'admins', u.uid), { uid: u.uid });
              } catch (e) {
                console.warn("Could not sync to admins collection");
              }
            }
            
            setProfile(profileData);
          } else {
            // Check if first user or Super Admin
            let isFirstUser = isSuperAdmin;
            
            if (!isSuperAdmin) {
              try {
                const usersQuery = query(collection(db, 'users'), limit(1));
                const usersSnap = await getDocs(usersQuery);
                isFirstUser = usersSnap.empty;
              } catch (e) {
                // If query fails, assume not first user (safest)
                console.warn("Could not check if first user, defaulting to regular user");
                isFirstUser = false;
              }
            }

            const newProfile: UserProfile = {
              uid: u.uid,
              email: u.email || '',
              role: isFirstUser ? 'admin' : 'user',
              status: isFirstUser ? 'active' : 'pending',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };

            let writeSuccessful = false;
            let writeRetries = 3;
            while (writeRetries > 0) {
              try {
                await setDoc(userDocRef, newProfile);
                writeSuccessful = true;
                break;
              } catch (e: any) {
                if (e.message?.includes('offline') && writeRetries > 1) {
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  writeRetries--;
                } else {
                  throw e;
                }
              }
            }
            
            if (isFirstUser && writeSuccessful) {
              try {
                await setDoc(doc(db, 'admins', u.uid), { uid: u.uid });
              } catch (e) {
                console.error("Failed to set admin status in separate collection");
              }
            }
            
            setProfile(newProfile);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return { user, profile, loading };
}
