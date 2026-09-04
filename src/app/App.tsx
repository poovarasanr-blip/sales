import { BrowserRouter } from "react-router-dom";
import AppRoutes from "../modules/sales-incentive/routes";
import Sidebar from "../shared/components/layout/Sidebar/Sidebar";
import Header from "../shared/components/layout/Header/Header";
import { ToastContainer } from "../shared/components/ui/CustomToast/CustomToastMessage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-scroll scrollbar-hide">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden bg-bgcolor">
          <Header />
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <AppRoutes />
            <ToastContainer />
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
