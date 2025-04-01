import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/services/firebase";
import { User } from "@/types";

/**
 * Props for the Login component
 */
interface LoginProps {
  /** Callback function called when login is successful */
  onLogin: (user: User) => void;
}

/**
 * Login component that handles user authentication
 *
 * This component provides a form for users to enter their email and password.
 * Upon successful login, it calls the onLogin callback with the user data.
 */
const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  /**
   * Handles the login form submission
   * Attempts to sign in the user with provided credentials
   */
  const handleLogin = async () => {
    try {
      const user = await signIn(email, password);
      onLogin(user);
      setStatus("");
    } catch (error) {
      setStatus("Invalid credentials");
      console.error(error);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <Card className="mb-4 shadow-lg">
        <CardContent>
          <h1 className="text-2xl font-bold mb-2">Volunteer Login</h1>
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-2"
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-2"
          />
          <Button onClick={handleLogin} className="mb-2">
            Login
          </Button>
          {status && <p className="text-red-500">{status}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
