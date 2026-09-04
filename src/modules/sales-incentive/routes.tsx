import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import ProductList from "./pages/Products/ProductList/ProductList";
import BulkUpload from "./pages/Products/BulkUpload/BulkUpload";

const NotFound = () => {
  return <div>404 - Page Not Found</div>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/product" element={<ProductList />} />
      <Route path="/bulkUpload" element={<BulkUpload />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
