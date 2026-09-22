import { BrowserRouter } from "react-router-dom";
import AppRoutes from "../modules/sales-incentive/routes";
import Sidebar from "../shared/components/layout/Sidebar/Sidebar";
import Header from "../shared/components/layout/Header/Header";
import { ToastContainer } from "../shared/components/ui/CustomToast/CustomToastMessage";
import SessionDetails from "../assets/json/SessionResponce/SessionDetails.json";
import { setSession, getSession } from "../shared/utils/sessionStorage";
import { useAuthStore, type SessionData } from "./store/useAuthStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function initSession() {
  setSession(JSON.stringify(SessionDetails));
  const existing = getSession<SessionData>();
  useAuthStore.setState({
    sessionData: existing as SessionData,
    isAuthenticated: true,
  });
}

initSession();

const queryClient = new QueryClient();

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </BrowserRouter>
  );
}
