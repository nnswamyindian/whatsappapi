import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  organizations: Organization[];
  activeOrg: Organization | null;
  token: string | null;
  isLoading: boolean;
  switchOrganization: (orgId: string) => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (fullName: string, email: string, pass: string, orgName: string) => Promise<void>;
  logout: () => void;
  refreshOrg: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('gw_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    const savedToken = localStorage.getItem('gw_token');
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
      setOrganizations(data.organizations);

      const savedOrgId = localStorage.getItem('gw_active_org_id');
      const targetOrg = data.organizations.find((o: Organization) => o.id === savedOrgId) || data.organizations[0] || null;

      setActiveOrg(targetOrg);
      if (targetOrg) {
        localStorage.setItem('gw_active_org_id', targetOrg.id);
      }
    } catch (err) {
      console.error('Session expired or invalid:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, [token]);

  const switchOrganization = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      setActiveOrg(org);
      localStorage.setItem('gw_active_org_id', org.id);
      window.location.reload();
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password: pass });
      localStorage.setItem('gw_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setOrganizations(data.organizations);
      setActiveOrg(data.activeOrganization);
      if (data.activeOrganization) {
        localStorage.setItem('gw_active_org_id', data.activeOrganization.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (fullName: string, email: string, pass: string, orgName: string) => {
    setIsLoading(true);
    try {
      const data = await api.post('/auth/register', {
        fullName,
        email,
        password: pass,
        organizationName: orgName,
      });
      localStorage.setItem('gw_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setOrganizations([data.organization]);
      setActiveOrg(data.organization);
      localStorage.setItem('gw_active_org_id', data.organization.id);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('gw_token');
    localStorage.removeItem('gw_active_org_id');
    setToken(null);
    setUser(null);
    setOrganizations([]);
    setActiveOrg(null);
  };

  const refreshOrg = async () => {
    if (!token) return;
    try {
      const data = await api.get('/organizations/current');
      setActiveOrg(data.organization);
    } catch (err) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organizations,
        activeOrg,
        token,
        isLoading,
        switchOrganization,
        login,
        register,
        logout,
        refreshOrg,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
