import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import ProductList from "./pages/Products/ProductList/ProductList";
import BulkUpload from "./pages/Products/BulkUpload/BulkUpload";
import EmployeeSalesTarget from "./pages/EmployeeSalesTarget/EmployeeSalesTarget";
import EmployeeSalesTargetBulkUpload from "./pages/EmployeeSalesTarget/BulkUpload/EmployeeSalesBulkUpload";
import ActualSalesList from "./pages/ActualSales/ActualSalesList/ActualSalesList";
import ActualSalesBulkUpload from "./pages/ActualSales/ActualSalesBulkUpload/ActualSalesBulkUpload";
import IncentiveList from "./pages/Incentive/IncentiveList/IncentiveList";
import SalesList from "./pages/Sales/SalesList/SalesList";

const NotFound = () => {
  return <div>404 - Page Not Found</div>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/product" element={<ProductList />} />
      <Route path="/bulkUpload" element={<BulkUpload />} />
      <Route path="/employeeSales" element={<EmployeeSalesTarget />} />
      <Route path="/bulkUpload" element={<BulkUpload />} />
      <Route
        path="/employeeSalesTarget/bulkUpload"
        element={<EmployeeSalesTargetBulkUpload />}
      />
      <Route path="/actualSales" element={<ActualSalesList />} />
      <Route
        path="/actualSales/bulkUpload"
        element={<ActualSalesBulkUpload />}
      />
      <Route path="/incentive" element={<IncentiveList />} />
      <Route path="/Sales" element={<SalesList />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
