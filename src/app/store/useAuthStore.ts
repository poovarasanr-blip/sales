import { create } from "zustand";
import { setSession, getSession, clearSession } from "../../shared/utils/sessionStorage";

export interface UIRole {
  Role: {
    Code: string;
    Name: string;
    Id: number;
    Roletype: number;
    Description: string | null;
    Status: number;
    [key: string]: unknown;
  };
  AccessControls: unknown[];
  UserInterfaceControls: unknown[];
  UIControlMappingList: unknown[];
  WebMenuItemList: unknown[];
  [key: string]: unknown;
}

export interface SessionData {
  Company: {
    Code: string;
    Name: string;
    Id: number;
    OrganizationId: number;
    [key: string]: unknown;
  };
  EmployeeId: number;
  HierarchyRole: {
    RoleCode: string;
    RoleId: number;
    IsMobile: boolean;
    [key: string]: unknown;
  };
  Key: string;
  Vector: string;
  Token: string;
  UserSession: {
    UserId: number;
    PersonId: number;
    PersonName: string;
    EmailId: string;
    MobileNumber: string;
    Token: string;
    [key: string]: unknown;
  };
  UserDetails: {
    UserName: string;
    EmailId: string;
    UserId: number;
    Status: boolean;
    [key: string]: unknown;
  };
  Implementation: {
    Code: string;
    Name: string;
    Id: number;
    [key: string]: unknown;
  };
  ImplementationId: number;
  ImplementationCompanyId: number;
  ClientList: Array<{
    Code: string;
    Name: string;
    CompanyId: number;
    ClientId: number;
    [key: string]: unknown;
  }>;
  ClientContractList: Array<{
    Code: string;
    Name: string;
    ClientId: number;
    [key: string]: unknown;
  }>;
  UIRoles: UIRole[];
  IsSystemAdmin: boolean;
  IsActive: boolean;
  [key: string]: unknown;
}

interface AuthState {
  sessionData: SessionData | null;
  isAuthenticated: boolean;
  hydrate: () => void;
  setSessionData: (data: SessionData) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  sessionData: null,
  isAuthenticated: false,

  hydrate: () => {
    const data = getSession<SessionData>();
    if (data) {
      set({ sessionData: data, isAuthenticated: true });
    }
  },

  setSessionData: (data: SessionData) => {
    setSession(JSON.stringify(data));
    set({ sessionData: data, isAuthenticated: true });
  },

  logout: () => {
    clearSession();
    set({ sessionData: null, isAuthenticated: false });
  },
}));
