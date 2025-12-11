export interface Category {
  id: string;
  name: string;
  companyId: string;
  company?: {
    id: string;
    name: string;
  };
}
