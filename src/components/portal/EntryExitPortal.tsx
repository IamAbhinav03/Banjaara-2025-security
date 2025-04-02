import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut, getExternalByUid, logAction } from "@/services/firebase";
import { User, External, ActionLog } from "@/types";
import Login from "../auth/Login";
import CSVUpload from "../admin/CSVUpload";

/**
 * EntryExitPortal component that manages user entry and exit
 *
 * This component provides functionality for:
 * - User authentication
 * - Searching for users by UID
 * - Recording entry/exit events (gate-in, check-in, check-out, gate-out)
 * - Payment status management
 * - CSV upload for admin users
 */
const EntryExitPortal: React.FC = () => {
  const [uid, setUid] = useState("");
  const [userData, setUserData] = useState<External | null>(null);
  const [status, setStatus] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  /**
   * Fetches user data for the given UID
   */
  const fetchUserData = async () => {
    try {
      const data = await getExternalByUid(uid);
      if (data) {
        setUserData(data);
        console.log("User data fetched:", data);
        setStatus("");
      } else {
        setStatus("User not found");
      }
    } catch (error) {
      setStatus("Error fetching user data");
      console.error(error);
    }
  };

  /**
   * Handles entry/exit actions for a user
   * @param action - The type of action to perform (gate-in, check-in, check-out, gate-out)
   */
  const handleAction = async (action: ActionLog["action"]) => {
    if (!loggedInUser || !userData) return;
    try {
      await logAction(uid, action, loggedInUser);
      setStatus(`${action} successful`);
      fetchUserData();
    } catch (error) {
      setStatus("Action failed");
      console.error(error);
    }
  };

  /**
   * Handles user logout
   */
  const handleLogout = async () => {
    try {
      await signOut();
      setLoggedInUser(null);
    } catch (error) {
      setStatus("Logout failed");
      console.error(error);
    }
  };

  if (!loggedInUser) {
    return <Login onLogin={setLoggedInUser} />;
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <Card className="mb-4 shadow-lg">
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Entry-Exit Portal</h1>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
          <Input
            placeholder="Enter UID"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            className="mb-2"
          />
          <Button onClick={fetchUserData} className="mb-2">
            Search
          </Button>
          {status && <p className="text-red-500">{status}</p>}
          {userData && (
            <div className="mt-4">
              <p>
                <strong>Name:</strong> {userData.name}
              </p>
              <p>
                <strong>Type:</strong> {userData.type}
              </p>
              <p>
                <strong>Payment Status:</strong>
                {userData.paymentStatus}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={() => handleAction("payment")}
                  disabled={userData.paymentStatus === "paid" ? true : false}
                >
                  Fees Paid
                </Button>
                <Button
                  onClick={() => handleAction("gate-in")}
                  disabled={
                    userData.paymentStatus === "paid" && !userData.gateIn
                      ? false
                      : true
                  }
                >
                  Gate In
                </Button>
                <Button
                  onClick={() => handleAction("check-in")}
                  disabled={
                    userData.gateIn && !userData.insideCampus ? false : true
                  }
                >
                  Check In
                </Button>
                <Button
                  onClick={() => handleAction("check-out")}
                  disabled={
                    userData.insideCampus && !userData.checkOut ? false : true
                  }
                >
                  Check Out
                </Button>
                <Button
                  onClick={() => handleAction("gate-out")}
                  disabled={
                    userData.checkOut && !userData.gateOut ? false : true
                  }
                >
                  Gate Out
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {loggedInUser.role === "admin" && <CSVUpload user={loggedInUser} />}
    </div>
  );
};

export default EntryExitPortal;
