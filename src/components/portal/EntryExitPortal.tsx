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
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-md mx-auto space-y-4">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                Entry-Exit Portal
              </h1>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-sm px-3 py-1"
              >
                Logout
              </Button>
            </div>

            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Enter UID"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                className="flex-1 text-sm"
              />
              <Button
                onClick={fetchUserData}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Search
              </Button>
            </div>

            {status && <p className="text-red-500 text-sm mb-4">{status}</p>}

            {userData && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">{userData.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <p className="font-medium capitalize">{userData.type}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Payment Status:</span>
                      <p
                        className={`font-medium ${
                          userData.paymentStatus === "paid"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {userData.paymentStatus}
                      </p>
                    </div>
                  </div>

                  {userData.type === "participant" &&
                    userData.events.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-gray-600 text-sm">Events:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {userData.events.map((event, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              {event}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleAction("payment")}
                    disabled={userData.paymentStatus === "paid"}
                    className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                  >
                    Fees Paid
                  </Button>
                  <Button
                    onClick={() => handleAction("gate-in")}
                    disabled={
                      userData.paymentStatus !== "paid" || userData.gateIn
                    }
                    className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                  >
                    Gate In
                  </Button>
                  <Button
                    onClick={() => handleAction("check-in")}
                    disabled={!userData.gateIn || userData.insideCampus}
                    className="bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50"
                  >
                    Check In
                  </Button>
                  <Button
                    onClick={() => handleAction("check-out")}
                    disabled={!userData.insideCampus || userData.checkOut}
                    className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
                  >
                    Check Out
                  </Button>
                  <Button
                    onClick={() => handleAction("gate-out")}
                    disabled={!userData.checkOut || userData.gateOut}
                    className="col-span-2 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                  >
                    Gate Out
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {loggedInUser.role === "admin" && (
          <div className="mt-4">
            <CSVUpload user={loggedInUser} />
          </div>
        )}
      </div>
    </div>
  );
};
export default EntryExitPortal;
