import React from "react";
import { Routes, Route } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import CampusGuide from "./CampusGuide.jsx";
import Dashboard from "./Dashboard.jsx";
import ResourceDetail from "./components/ResourceDetail.jsx";
import Login from "./Login.jsx";
import SignUp from "./SignUp.jsx";

export default function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<CampusGuide />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/resources/:resourceId" element={<ResourceDetail />} />
      <Route
        path="/login"
        element={
          <Login
            onSubmit={(data) => {
              console.log("login submit", data);
              const userName = data.email?.split("@")[0] || "User";
              navigate("/dashboard", { state: { name: userName } });
            }}
            onNavigateToSignUp={() => navigate("/signup")}
          />
        }
      />
      <Route
        path="/signup"
        element={
          <SignUp
            onSubmit={(data) => {
              console.log("signup submit", data);
              navigate("/dashboard", { state: { name: data.name || "User" } });
            }}
            onNavigateToLogin={() => navigate("/login")}
          />
        }
      />
    </Routes>
  );
}
