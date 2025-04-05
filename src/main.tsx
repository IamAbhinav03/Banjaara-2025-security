import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import PublicRegistration from "./components/PublicRegistration.tsx";
import VolunteerRegistration from "./components/VolunteerRegistration.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/register",
    element: <PublicRegistration />,
  },
  {
    path: "/volunteer",
    element: <VolunteerRegistration />,
  }
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
