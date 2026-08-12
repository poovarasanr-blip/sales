import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";

const About = () => {
  return <div>About Page</div>;
};

const NotFound = () => {
  return <div>404 - Page Not Found</div>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/product" element={<About />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
