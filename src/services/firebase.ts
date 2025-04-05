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
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  addDoc,
  arrayUnion,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { User, External, ActionLog, CSVRow, VolunteerEntry } from "../types";

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
      gateIn: false,
      gateOut: false,
      checkIn: false,
      checkOut: false,
      insideCampus: false,
      status: "not arrived",
      lastTime: "",
    };
    await setDoc(doc(db, "externals", bid), external);
    await updateDoc(doc(db, "usedBids", "bids"), {
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
 * Generates a new bid using a 4-character alphanumeric ID
 * Excludes confusing characters (O, 0, I, 1)
 * Ensures the generated bid is unique by checking Firestore
 *
 * @returns Promise<string> - A unique bid
 */
const generateUniqueBid = async (): Promise<string> => {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789"; // No 0, 1 for avoiding confusion
  let bid = "";
  let isUnique = false;

  while (!isUnique) {
    // Generate a random 4-character bid
    bid = Array.from(
      { length: 4 },
      () => charset[Math.floor(Math.random() * charset.length)]
    ).join("");

    // Check Firestore if the bid already exists
    const docRef = doc(db, "usedBids", "bids");
    const docSnap = await getDoc(docRef);
    const usedBids = docSnap.exists() ? docSnap.data().usedBids : [];

    if (!usedBids.includes(bid)) {
      isUnique = true;
    }
  }

  return bid;
};

/**
 * On-the-spot registration for a new external user
 *
 * @param name - Name of the user
 * @param email - Email of the user
 * @param phone - Phone number of the user
 * @param college - College name of the user
 * @returns Promise<string> - The generated bid
 */
export const onSpotRegistration = async (
  name: string,
  email: string,
  phone: string,
  college: string
): Promise<string> => {
  try {
    // Generate a unique bid
    console.log("Generating unique bid...");
    const bid = await generateUniqueBid();
    console.log("Unique bid generated:", bid);
    // Create an external user object with the provided data and the generated bid
    const external: External = {
      bid,
      name,
      email,
      phone,
      college,
      type: "on-the-spot",
      paymentStatus: "not paid",
      registrationDate: new Date(),
      gateIn: false,
      gateOut: false,
      checkIn: false,
      checkOut: false,
      insideCampus: false,
      events: [],
      status: "not arrived",
      lastTime: "",
    };

    // Store the new user in Firestore
    console.log("External data being sent:", external);
    await setDoc(doc(db, "externals", bid), external);
    console.log("External data set in Firestore:", external);

    // Update the used bids in Firestore
    await updateDoc(doc(db, "usedBids", "bids"), {
      usedBids: arrayUnion(bid),
    });

    console.log("Generated Bid:", bid);
    return bid;
  } catch (error) {
    console.error("Error in on-the-spot registration:", error);
    throw new Error("Registration failed. Please try again.");
  }
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
    volunteerName: volunteer.name,
  };
  await addDoc(collection(db, "actionLogs"), actionLog);
  console.log("Action logged:", actionLog);

  // Update external's last entry/exit
  const externalRef = doc(db, "externals", externalUid);
  const updateData: Partial<External> = {};

  if (action === "gate-in") {
    updateData.gateIn = true;
  } else if (action === "check-in") {
    updateData.checkIn = true;
    updateData.insideCampus = true;
  } else if (action === "check-out") {
    updateData.checkOut = true;
  } else if (action === "gate-out") {
    updateData.gateOut = false;
    updateData.checkOut = false;
    updateData.insideCampus = false;
    updateData.gateIn = false;
    updateData.checkIn = false;
    updateData.paymentStatus = "not paid";
  } else if (action === "payment") {
    updateData.paymentStatus = "paid";
  }
  try {
    await setDoc(externalRef, updateData, { merge: true });
    console.log("External updated:", updateData);
  } catch (error) {
    console.error("Error updating external:", error);
  }
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

export const fetchExternalsWithStatus = async (
  selectedStatus: External["status"]
): Promise<External[]> => {
  const q = query(
    collection(db, "externals"),
    where("status", "==", selectedStatus)
  );
  const querySnapshot = await getDocs(q);
  // querySnapshot.forEach((doc) => {
  //   console.log(`${doc.id} =>`, doc.data());
  // });
  return querySnapshot.docs.map((doc) => doc.data() as External);
};

/**
 * Updates the status of an external user
 *
 * @param externalUid - The UID of the external user
 * @param status - The new status to set
 * @returns Promise<void>
 *
 * @example
 * await updateExternalStatus("123456", "arrived");
 * console.log("Status updated successfully");
 */
export const updateExternalStatus = async (
  externalUid: string,
  status: External["status"],
  lastTime: string
): Promise<void> => {
  try {
    const externalRef = doc(db, "externals", externalUid);
    await updateDoc(externalRef, { status , lastTime},);
    console.log(`Status of external user ${externalUid} updated to ${status}`);
  } catch (error) {
    console.error(
      `Failed to update status for external user ${externalUid}:`,
      error
    );
    throw new Error("Failed to update status. Please try again.");
  }
};

/**
 * Searches for external users by name or email
 *
 * @param searchTerm - The term to search for (name or email)
 * @returns Promise<External[]> - Array of matching external users
 *
 * @example
 * const results = await UserSearch("John");
 * console.log(`Found ${results.length} users`);
 */
export const searchUsers = async (searchTerm: string): Promise<External[]> => {
  try {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const allUsersSnapshot = await getDocs(collection(db, "externals"));
    const allUsers = allUsersSnapshot.docs.map((doc) => doc.data() as External);

    const filteredUsers = allUsers.filter(
      (user) => user.name && user.name.toLowerCase().includes(lowerCaseSearchTerm)
    );

    return filteredUsers;
  } catch (error) {
    console.error("Error searching for users:", error);
    throw new Error("Failed to search for users. Please try again.");
  }
};



/**
 * Registers a new volunteer
 *
 * @param name - Name of the volunteer
 * @param email - Email of the volunteer
 * @param role - Role of the volunteer (e.g., "volunteer", "admin")
 * @returns Promise<void>
 *
 * @example
 * await registerVolunteer("Jane Doe", "jane@example.com", "9876543210", "volunteer");
 * console.log("Volunteer registered successfully");
 */
export const registerVolunteer = async (
  name: string,
  email: string,
  role: string
): Promise<void> => {
  try {
    const volunteer: VolunteerEntry = {
      name,
      email,
      role,
    };
    console.log("Volunteer data being sent:", volunteer);
    // await setDoc(doc(db, "users"), volunteer);
    await addDoc(collection(db, "users"), volunteer);
    //   await addDoc(collection(db, "actionLogs"), actionLog);
    console.log("Volunteer registered successfully:", volunteer);
  } catch (error) {
    console.error("Error registering volunteer:", error);
    throw new Error("Failed to register volunteer. Please try again.");
  }
};