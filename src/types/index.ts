// Single source of truth is now the Postgres enum in schema.prisma — this
// re-export keeps every existing `import type { ProposalStatus } from
// "@/types"` in the app working unchanged.
import type { ProposalStatus } from "@prisma/client";
export type { ProposalStatus };

export interface CompanySettings {
  id: string;
  companyName: string;
  logoUrl: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  bankBranch: string | null;
  authorizedSignatory: string | null;
  signatureUrl: string | null;
  defaultTaxPercent: number;
  currency: string;
  proposalPrefix: string;
  footerText: string | null;
  termsAndConditions: string | null;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Material {
  id: string;
  materialCode: string;
  materialName: string;
  subCategory: string | null;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: string | null;
  category: Category | null;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  clientName: string;
  company: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  // Computed by the API, not stored columns
  totalProposals: number;
  totalRevenue: number;
  lastProposalDate: string | null;
  statusDistribution?: Record<ProposalStatus, number>;
  proposals?: Proposal[];
}

export interface ProposalItem {
  id: string;
  proposalId?: string;
  materialId: string | null;
  materialName: string;
  description: string | null;
  unit: string;
  sellingPrice: number;
  quantity: number;
  amount: number;
  sortOrder: number;
}

export interface Proposal {
  id: string;
  proposalNumber: string;
  status: ProposalStatus;
  clientId: string | null;
  clientName: string;
  company: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  eventName: string;
  eventDate: string | null;
  venue: string | null;
  proposalDate: string;
  salesPersonId: string | null;
  salesPersonName: string | null;
  notes: string | null;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  subtotal: number;
  roundOff: number;
  grandTotal: number;
  termsAndConditions: string | null;
  createdAt: string;
  updatedAt: string;
  items: ProposalItem[];
  // whether an admin has reviewed this proposal
  isReviewed?: boolean;
}

export interface DashboardStats {
  totalProposals: number;
  drafts: number;
  approved: number;
  rejected: number;
  totalProposalValue: number;
  recentProposals: Proposal[];
}
