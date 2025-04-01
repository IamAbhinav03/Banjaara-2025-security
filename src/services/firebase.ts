import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  Timestamp,
  addDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { User, External, ActionLog, CSVRow } from "../types";

// Authentication
export const signIn = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    // First, authenticate with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Then, fetch the user's profile from Firestore
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

    if (!userDoc.exists()) {
      throw new Error(
        "User profile not found. Please contact an administrator."
      );
    }

    const userData = userDoc.data() as User;
    return userData;
  } catch (error: any) {
    console.error("Login error:", error);
    if (error.code === "auth/user-not-found") {
      throw new Error("No user found with this email.");
    } else if (error.code === "auth/wrong-password") {
      throw new Error("Incorrect password.");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address.");
    } else if (error.code === "permission-denied") {
      throw new Error("Access denied. Please contact an administrator.");
    } else {
      throw new Error("Login failed. Please try again.");
    }
  }
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

// External Management
export const getExternalByUid = async (
  uid: string
): Promise<External | null> => {
  const docRef = doc(db, "externals", uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    return null;
  }
  return docSnap.data() as External;
};

export const createExternal = async (data: CSVRow): Promise<string> => {
  const uid = Math.floor(100000 + Math.random() * 900000).toString();
  const external: External = {
    uid,
    ...data,
    registrationDate: new Date(),
  };
  await setDoc(doc(db, "externals", uid), external);
  return uid;
};

export const uploadCSVData = async (rows: CSVRow[]): Promise<string[]> => {
  const uids: string[] = [];
  for (const row of rows) {
    const uid = await createExternal(row);
    uids.push(uid);
  }
  return uids;
};

// Action Logging
export const logAction = async (
  externalUid: string,
  action: ActionLog["action"],
  volunteer: User
): Promise<void> => {
  const actionLog: Omit<ActionLog, "id"> = {
    externalUid,
    action,
    timestamp: new Date(),
    volunteerUid: volunteer.uid,
    volunteerName: volunteer.name,
  };
  await addDoc(collection(db, "actionLogs"), actionLog);

  // Update external's last entry/exit
  const externalRef = doc(db, "externals", externalUid);
  const updateData: Partial<External> = {};

  if (action === "gate-in") {
    updateData.lastEntry = new Date();
  } else if (action === "gate-out") {
    updateData.lastExit = new Date();
  }

  await setDoc(externalRef, updateData, { merge: true });
};

// Admin Functions
export const getActionLogs = async (): Promise<ActionLog[]> => {
  const querySnapshot = await getDocs(collection(db, "actionLogs"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ActionLog[];
};

export const getExternalsByType = async (
  type: External["type"]
): Promise<External[]> => {
  const q = query(collection(db, "externals"), where("type", "==", type));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as External);
};
