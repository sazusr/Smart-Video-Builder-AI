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
          
          // Fetch or create profile
          const userDocRef = doc(db, 'users', u.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
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

            await setDoc(userDocRef, newProfile);
            
            if (isFirstUser) {
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
