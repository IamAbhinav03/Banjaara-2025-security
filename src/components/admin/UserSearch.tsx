import React, { useState } from "react";
import { External } from "@/types"; // Ensure the correct External type is imported
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchUsers } from "@/services/firebase";
import { Loader } from "lucide-react";

const UserSearcher: React.FC = () => {
    const [results, setResults] = useState<External[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setError("Please enter a search query");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const users = await searchUsers(searchQuery);
            setResults(users);
        } catch (err) {
            setError("Failed to fetch users");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <Card className="mb-4 shadow-lg">
                <CardContent>
                    <h1 className="text-2xl font-bold mb-2">Search Users</h1>
                    <Input
                        type="text"
                        placeholder="Enter name, email, or ID"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button
                        onClick={handleSearch}
                        className="w-full p-2 flex justify-center items-center"
                    >
                        {loading ? <Loader className="animate-spin" /> : "Search"}
                    </Button>
                    {error && <p className="mt-2 text-red-500">{error}</p>}
                    <div className="mt-4">
                        {results.length > 0 ? (
                            <ul className="space-y-2">
                                {results.map((user) => (
                                    <li
                                        key={user.bid}
                                        className="p-2 border rounded shadow-sm bg-gray-50"
                                    >
                                        <p>
                                            <strong>BID:</strong> {user.bid}
                                        </p>
                                        <p>
                                            <strong>Name:</strong> {user.name}
                                        </p>
                                        <p>
                                            <strong>Email:</strong> {user.email}
                                        </p>
                                        <p>
                                            <strong>Phone:</strong> {user.phone}
                                        </p>
                                        <p>
                                            <strong>Payment Status:</strong> {user.paymentStatus}
                                        </p>
                                        <p>
                                            <strong>Type:</strong> {user.type}
                                        </p>
                                        <p>
                                            <strong>Gate In:</strong> {user.gateIn ? "Yes" : "No"}
                                        </p>
                                        <p>
                                            <strong>Gate Out:</strong> {user.gateOut ? "Yes" : "No"}
                                        </p>
                                        <p>
                                            <strong>Check In:</strong> {user.checkIn ? "Yes" : "No"}
                                        </p>
                                        <p>
                                            <strong>Check Out:</strong> {user.checkOut ? "Yes" : "No"}
                                        </p>
                                        <p>
                                            <strong>Inside Campus:</strong>{" "}
                                            {user.insideCampus ? "Yes" : "No"}
                                        </p>
                                        <p>
                                            <strong>Last Entry:</strong>{" "}
                                            {user.lastEntry
                                                ? user.lastEntry.toLocaleString()
                                                : "N/A"}
                                        </p>
                                        <p>
                                            <strong>Last Exit:</strong>{" "}
                                            {user.lastExit ? user.lastExit.toLocaleString() : "N/A"}
                                        </p>
                                        <p>
                                            <strong>Events:</strong> {user.events.join(", ")}
                                        </p>
                                        <p>
                                            <strong>Status:</strong> {user.status}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            !loading && <p className="text-gray-500">No results found</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserSearcher;
