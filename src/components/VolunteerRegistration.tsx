import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { registerVolunteer } from "../services/firebase.ts"; // Adjust the import path as necessary

const auth = getAuth();

const PublicRegistration: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [formErrors, setFormErrors] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setFormErrors(null);

    // Validate email
    const email = formData.email;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormErrors("Please enter a valid email address.");
      return;
    }
    try {
      // Create a new user with email and password
      await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      // Save the user data to your database
      await registerVolunteer(
        formData.name,
        formData.email,
        "volunteer" 
      );
      setStatus({
      type: "success",
      message: "Registration successful! Please save your BID.",
      });
      setFormData({ name: "", email: "", password: ""});
    } catch (error: any) {
      setStatus({
      type: "error",
      message: error.message || "Registration failed. Please try again.",
      });
      console.error("Error during registration:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Volunteer Registration
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

            <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name || ""}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({ ...formData, name });
                  }}
                  className="mt-1"
                  placeholder="Enter your name"
                />
              </div>


              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    const email = e.target.value;
                    setFormData({ ...formData, email });
                  }}
                  onBlur={(e) => {
                    const email = e.target.value;
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                      alert("Please enter a valid email address.");
                    }
                  }}
                  className="mt-1"
                  placeholder="Enter your email"
                />
              </div>


              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password || ""}
                  onChange={(e) => {
                    const password = e.target.value;
                    setFormData({ ...formData, password });
                  }}
                  className="mt-1"
                  placeholder="Enter your password"
                />
              </div>

              <Button type="submit" className="w-full">
                Register
              </Button>
            </form>

            {formErrors && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                <p className="text-sm">{formErrors}</p>
              </div>
            )}

            {status && (
              <div
                className={`mt-4 p-4 rounded-md ${
                  status.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {status.message}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicRegistration;
