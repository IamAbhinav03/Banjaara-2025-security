import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut, getExternalByUid, logAction } from "@/services/firebase";
import { User, External, ActionLog } from "@/types";
import Login from "../auth/Login";
import CSVUpload from "../admin/CSVUpload";
import UserSearcher from "../admin/UserSearch";
import { Loader } from "lucide-react";
import {
  updateExternalStatus,
  fetchExternalsWithStatus,
} from "@/services/firebase";

const EntryExitPortal: React.FC = () => {
  const [uid, setUid] = useState("");
  const [userData, setUserData] = useState<External | null>(null);
  const [status, setStatus] = useState("");
  const [feepaidloading, setFeepaidloading] = useState(false);
  const [gateinloading, setGateinloading] = useState(false);
  const [checkinloading, setCheckinloading] = useState(false);
  const [checkoutloading, setCheckoutloading] = useState(false);
  const [gateoutloading, setGateoutloading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  // const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [statusCounts, setStatusCounts] = useState({
    gatedIn: 0,
    checkedIn: 0,
    checkedOut: 0,
    gateOut: 0,
  });
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    event: "",
    college: "",
    gender: "",
  });

  // Function to fetch live counts
  const fetchLiveCounts = async () => {
    try {
      const gatedIn = await fetchExternalsWithStatus("gated in");
      const checkedIn = await fetchExternalsWithStatus("checked in");
      const checkedOut = await fetchExternalsWithStatus("checked out");
      const gateOut = await fetchExternalsWithStatus("gate out");

      setStatusCounts({
        gatedIn: gatedIn.length,
        checkedIn: checkedIn.length,
        checkedOut: checkedOut.length,
        gateOut: gateOut.length,
      });
    } catch (error) {
      console.error("Error fetching live counts:", error);
    }
  };

  // Start the timer to fetch data every 8 minutes
  useEffect(() => {
    fetchLiveCounts();
    const interval = setInterval(fetchLiveCounts, 8 * 60 * 1000);
    setTimer(interval);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  // Manually fetch data and restart the timer
  const handleManualFetch = () => {
    if (timer) clearInterval(timer);
    fetchLiveCounts();
    const interval = setInterval(fetchLiveCounts, 8 * 60 * 1000);
    setTimer(interval);
  };

  // Enhanced CSV download logic
  const handleDownloadCSV = async () => {
    try {
      const response = await fetchExternalsWithStatus(
        filters.status as External["status"]
      );
      if (!response) {
        throw new Error("Network response was not ok");
      }
      const data = response.filter((external: External) => {
        return (
          (!filters.event || external.events.includes(filters.event)) &&
          (!filters.college || external.college === filters.college)
          // (!filters.gender || external.gender === filters.gender)
        );
      });

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [
          [
            "BID",
            "Name",
            "Type",
            "Phone",
            "Email",
            "Status",
            "Event",
            "College",
          ].join(","),
          ...data.map((external: External) =>
            [
              external.bid,
              external.name,
              external.type,
              external.phone,
              external.email,
              external.status,
              external.events.join("; "),
              external.college,
            ].join(",")
          ),
        ].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `externals_data_${filters.status}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading data:", error);
    }
  };

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
      if (action === "payment") {
        setFeepaidloading(true);
      } else if (action === "gate-in") {
        setGateinloading(true);
      } else if (action === "check-in") {
        setCheckinloading(true);
      } else if (action === "check-out") {
        setCheckoutloading(true);
      } else if (action === "gate-out") {
        setGateoutloading(true);
      }

      await logAction(uid, action, loggedInUser);

      let newStatus: External["status"] = userData.status;
      const newtime: string = new Date().toISOString();
      if (action === "gate-in") newStatus = "gated in";
      else if (action === "check-in") newStatus = "checked in";
      else if (action === "check-out") newStatus = "checked out";
      else if (action === "gate-out") newStatus = "gate out";

      // Update user data with the new status
      await updateExternalStatus(uid, newStatus, newtime);
    } catch (error) {
      setStatus("Action failed");
      console.error(error);
    } finally {
      setFeepaidloading(false);
      setGateinloading(false);
      setCheckinloading(false);
      setCheckoutloading(false);
      setGateoutloading(false);
      fetchUserData();
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
                placeholder="Enter BID"
                value={uid}
                onChange={(e) => setUid(e.target.value.toUpperCase())}
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
                          userData.paymentStatus === "paid" ||
                          userData.paymentStatus === "Paid"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {userData.paymentStatus}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <p className="font-medium capitalize">
                        {userData.status}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">College:</span>
                      <p className="font-medium">{userData.college}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <p className="font-medium">{userData.phone}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{userData.email}</p>
                    </div>
                    <div></div>
                    <div>
                      <span className="text-gray-600">Last TimeStamp:</span>
                      <p className="font-medium">
                        {new Date(userData.lastTime).toLocaleString()}
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
                    onClick={() => handleAction("gate-in")}
                    disabled={userData.gateIn}
                    className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                  >
                    {gateinloading ? (
                      <Loader className="animate-spin" />
                    ) : (
                      "Gate In"
                    )}
                  </Button>
                  <Button
                    onClick={() => handleAction("payment")}
                    disabled={
                      userData.paymentStatus === "paid" ||
                      userData.paymentStatus === "Paid"
                    }
                    className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                  >
                    {feepaidloading ? (
                      <Loader className="animate-spin" />
                    ) : (
                      "Fees Paid"
                    )}
                  </Button>
                  <Button
                    onClick={() => handleAction("check-in")}
                    disabled={!userData.gateIn || userData.insideCampus}
                    className="bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50"
                  >
                    {checkinloading ? (
                      <Loader className="animate-spin" />
                    ) : (
                      "Check In"
                    )}
                  </Button>
                  <Button
                    onClick={() => handleAction("check-out")}
                    disabled={!userData.insideCampus || userData.checkOut}
                    className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
                  >
                    {checkoutloading ? (
                      <Loader className="animate-spin" />
                    ) : (
                      "Check Out"
                    )}
                  </Button>
                  <Button
                    onClick={() => handleAction("gate-out")}
                    disabled={!userData.checkOut || userData.gateOut}
                    className="col-span-2 bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                  >
                    {gateoutloading ? (
                      <Loader className="animate-spin" />
                    ) : (
                      "Gate Out"
                    )}
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
        {loggedInUser.role === "admin" && (
          <div className="mt-4">
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-bold mb-2">Live Counts</h2>
              <div className="grid grid-cols-2 gap-4">
                <p>Gated In: {statusCounts.gatedIn}</p>
                <p>Checked In: {statusCounts.checkedIn}</p>
                <p>Checked Out: {statusCounts.checkedOut}</p>
                <p>Gate Out: {statusCounts.gateOut}</p>
              </div>
              <Button
                onClick={handleManualFetch}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
              >
                Refresh Counts
              </Button>
            </div>

            <div className="mt-4">
              <h2 className="text-lg font-bold mb-2">Download Data</h2>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <option value="">Select Status</option>
                  <option value="not arrived">Not Arrived</option>
                  <option value="gated in">Gated In</option>
                  <option value="checked in">Checked In</option>
                  <option value="checked out">Checked Out</option>
                  <option value="gate out">Gate Out</option>
                </select>
                <Input
                  placeholder="Event"
                  value={filters.event}
                  onChange={(e) =>
                    setFilters({ ...filters, event: e.target.value })
                  }
                  className="text-sm"
                />
                <Input
                  placeholder="College"
                  value={filters.college}
                  onChange={(e) =>
                    setFilters({ ...filters, college: e.target.value })
                  }
                  className="text-sm"
                />
                {/* <Input
                  placeholder="Gender"
                  value={filters.gender}
                  onChange={(e) =>
                    setFilters({ ...filters, gender: e.target.value })
                  }
                  className="text-sm"
                /> */}
              </div>
              <Button
                onClick={handleDownloadCSV}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
              >
                Download Filtered Data
              </Button>
            </div>
          </div>
        )}
      </div>
      <UserSearcher></UserSearcher>
    </div>
  );
};
export default EntryExitPortal;
