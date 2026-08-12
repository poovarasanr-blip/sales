import { BrowserRouter } from "react-router-dom";
import AppRoutes from "../modules/sales-incentive/routes";
import Sidebar from "../shared/components/layout/Sidebar/Sidebar";
import Header from "../shared/components/layout/Header/Header";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-scroll scrollbar-hide">
        <Sidebar />
        <main className="flex-1 overflow-y-auto scrollbar-hide bg-bgcolor">
          <Header />
          <AppRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}
