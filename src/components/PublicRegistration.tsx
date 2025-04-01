import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createExternal } from "@/services/firebase";
import { ExternalType } from "@/types";

const PublicRegistration: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [generatedUid, setGeneratedUid] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setGeneratedUid(null);

    try {
      const uid = await createExternal({
        ...formData,
        type: "on-the-spot" as ExternalType,
        feePaid: false,
      });
      setGeneratedUid(uid);
      setStatus({
        type: "success",
        message: "Registration successful! Please save your UID.",
      });
      setFormData({ name: "", email: "", phone: "" });
    } catch (error) {
      setStatus({
        type: "error",
        message: "Registration failed. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                On-the-Spot Registration
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Fill out this form to get your entry pass
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Enter your full name"
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
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Enter your phone number"
                />
              </div>

              <Button type="submit" className="w-full">
                Register
              </Button>
            </form>

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

            {generatedUid && (
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h3 className="text-lg font-medium text-blue-900">
                  Your Entry Pass UID
                </h3>
                <p className="mt-2 text-2xl font-bold text-blue-700">
                  {generatedUid}
                </p>
                <p className="mt-2 text-sm text-blue-600">
                  Please save this UID. You'll need it for entry and exit.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicRegistration;
