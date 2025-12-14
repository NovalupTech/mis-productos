import { create } from 'zustand';

export interface AttributeValue {
  id: string;
  value: string;
}

export interface Attribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect';
  values: AttributeValue[];
}

export interface Page {
  id: string;
  type: 'HOME' | 'CATALOG' | 'INFO';
  slug: string;
  title: string;
  enabled: boolean;
  isLanding: boolean;
}

export interface CompanySocial {
  id: string;
  type: 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'X' | 'LINKEDIN' | 'YOUTUBE' | 'WHATSAPP' | 'WEBSITE';
  url: string;
  label: string | null;
  enabled: boolean;
  order: number;
}

export interface Company {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  logo?: string | null;
  attributes?: Attribute[];
  pages?: Page[];
  socials?: CompanySocial[];
}

interface State {
  company: Company | null;
  setCompany: (company: Company | null) => void;
  clearCompany: () => void;
}

export const useCompanyStore = create<State>((set) => ({
  company: null,
  setCompany: (company) => set({ company }),
  clearCompany: () => set({ company: null }),
}));
