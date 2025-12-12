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

export interface Company {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  logo?: string | null;
  attributes?: Attribute[];
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
