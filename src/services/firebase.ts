/**
 * Firebase Service Layer
 *
 * This module provides a high-level service layer for Firebase operations.
 * It abstracts Firebase-specific implementation details and provides type-safe
 * functions for common operations.
 *
 * @module services/firebase
 * @requires firebase/auth
 * @requires firebase/firestore
 */

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
  arrayUnion,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { User, External, ActionLog, CSVRow } from "../types";

/**
 * Authentication Service
 */

/**
 * Signs in a user with email and password
 *
 * This function performs a two-step authentication process:
 * 1. Authenticates with Firebase Auth
 * 2. Fetches the user's profile from Firestore
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise<User> - The authenticated user's profile data
 *
 * @throws {Error} With specific error messages for different failure cases:
 * - "No user found with this email" - When email doesn't exist
 * - "Incorrect password" - When password is wrong
 * - "Invalid email address" - When email format is invalid
 * - "Access denied" - When user exists but has no profile
 * - "Login failed" - For other authentication errors
 *
 * @example
 * try {
 *   const user = await signIn("user@example.com", "password123");
 *   console.log("Logged in as:", user.name);
 * } catch (error) {
 *   console.error("Login failed:", error.message);
 * }
 */
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
  } catch (error: unknown) {
    console.error("Login error:", error);
    if (error instanceof Error && "code" in error) {
      const firebaseError = error as { code: string };
      switch (firebaseError.code) {
        case "auth/user-not-found":
          throw new Error("No user found with this email.");
        case "auth/wrong-password":
          throw new Error("Incorrect password.");
        case "auth/invalid-email":
          throw new Error("Invalid email address.");
        case "permission-denied":
          throw new Error("Access denied. Please contact an administrator.");
        default:
          throw new Error("Login failed. Please try again.");
      }
    }
    throw new Error("Login failed. Please try again.");
  }
};

/**
 * Signs out the currently authenticated user
 *
 * @returns Promise<void>
 *
 * @example
 * try {
 *   await signOut();
 *   console.log("Successfully signed out");
 * } catch (error) {
 *   console.error("Sign out failed:", error);
 * }
 */
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

/**
 * External User Management Service
 */

/**
 * Retrieves an external user by their UID
 *
 * @param uid - The unique identifier of the external user
 * @returns Promise<External | null> - The external user's data or null if not found
 *
 * @example
 * const external = await getExternalByUid("123456");
 * if (external) {
 *   console.log("Found user:", external.name);
 * } else {
 *   console.log("User not found");
 * }
 */
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

/**
 * Creates a new external user
 *
 * Uses the CSV ID as the bid and stores the user data in Firestore
 *
 * @param data - The external user's data (name, email, phone, type, feePaid)
 * @returns Promise<void>
 *
 * @example
 * const userData = {
 *   ID: "1234",
 *   Name: "John Doe",
 *   Email: "john@example.com",
 *   Mobile: "1234567890",
 *   Gender: "Male",
 *   College: "Ashoka University",
 *   PaymentStatus: "paid",
 *   Events: ["Event1", "Event2"],
 *   Type: "participant"
 * };
 * await createExternal(userData);
 */
export const createExternal = async (data: CSVRow): Promise<void> => {
  try {
    const bid = data.bid;
    const external: External = {
      ...data,
      registrationDate: new Date(),
    };
    await setDoc(doc(db, "externals", bid), external);
    await updateDoc(doc(db, "userBids", "bids"), {
      usedBids: arrayUnion(bid),
    });
  } catch (error) {
    console.error(
      `Failed to create external user with bid ${data.bid}:`,
      error
    );
    throw error; // Re-throw to handle in uploadCSVData
  }
};

/**
 * Uploads multiple external users from CSV data
 *
 * @param rows - Array of CSV row data to create external users
 * @returns Promise<number> - Number of successfully uploaded users
 *
 * @example
 * const csvData = [
 *   {
 *     ID: "1234",
 *     Name: "John Doe",
 *     Email: "john@example.com",
 *     Mobile: "1234567890",
 *     Gender: "Male",
 *     College: "Ashoka University",
 *     PaymentStatus: "paid",
 *     Events: ["Event1", "Event2"],
 *     Type: "participant"
 *   },
 *   // ... more rows
 * ];
 * const count = await uploadCSVData(csvData);
 * console.log(`Uploaded ${count} users`);
 */
export const uploadCSVData = async (rows: CSVRow[]): Promise<number> => {
  let successCount = 0;
  for (const row of rows) {
    try {
      await createExternal(row);
      successCount++;
    } catch (error) {
      console.error(`Failed to upload user with ID ${row.bid}:`, error);
    }
  }
  return successCount;
};

/**
 * Action Logging Service
 */

/**
 * Logs an entry/exit action for an external user
 *
 * Creates an action log entry and updates the external user's last entry/exit timestamp
 *
 * @param externalUid - The UID of the external user
 * @param action - The type of action (gate-in, check-in, check-out, gate-out)
 * @param volunteer - The volunteer performing the action
 * @returns Promise<void>
 *
 * @example
 * await logAction("123456", "gate-in", {
 *   uid: "vol123",
 *   name: "Volunteer Name",
 *   role: "volunteer"
 * });
 */
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

/**
 * Admin Service
 */

/**
 * Retrieves all action logs
 *
 * @returns Promise<ActionLog[]> - Array of all action logs
 *
 * @example
 * const logs = await getActionLogs();
 * logs.forEach(log => {
 *   console.log(`${log.volunteerName} performed ${log.action} for user ${log.externalUid}`);
 * });
 */
export const getActionLogs = async (): Promise<ActionLog[]> => {
  const querySnapshot = await getDocs(collection(db, "actionLogs"));
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ActionLog[];
};

/**
 * Retrieves all external users of a specific type
 *
 * @param type - The type of external users to retrieve
 * @returns Promise<External[]> - Array of external users matching the type
 *
 * @example
 * const students = await getExternalsByType("student");
 * console.log(`Found ${students.length} students`);
 */
export const getExternalsByType = async (
  type: External["type"]
): Promise<External[]> => {
  const q = query(collection(db, "externals"), where("type", "==", type));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as External);
};
