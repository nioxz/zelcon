

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  COMPANY_ADMIN = 'company_admin',
  SUPERVISOR = 'supervisor',
  ALMACENERO = 'almacenero',
  TRABAJADOR = 'trabajador'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In a real app, hashed
  role: UserRole;
  companyId?: string; // Null for super_admin
  isActive: boolean;
  
  // Profile & Onboarding Fields (Fiscalización Compliant)
  dni?: string;
  birthDate?: string; // YYYY-MM-DD
  birthPlace?: string; // Ciudad o Provincia
  address?: string;
  position?: string;
  area?: string;
  phone?: string;
  age?: number;
  secondaryEmail?: string; // Security email
  
  // Security & Verification
  parentName?: string; // Verification Data (Father or Mother name)
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  
  // Legal & Security
  termsAccepted: boolean;
  termsAcceptedAt?: string;
  profileCompleted: boolean;
}

export interface Company {
  id: string;
  name: string;
  ruc: string;
  address: string;
  phone: string;
  domain?: string; // e.g., 'consa.com'
  logoUrl?: string;
  modules: {
    sst: boolean;
    training: boolean;
    warehouse: boolean;
    operations: boolean; // Future module
  };
}

export enum IncidentStatus {
  PENDING = 'Pendiente',
  IN_REVIEW = 'En Revisión',
  RESOLVED = 'Resuelto'
}

export interface IncidentReport {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  date: string;
  description: string;
  status: IncidentStatus;
  aiAnalysis?: string; // For Gemini output
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Training {
  id: string;
  companyId: string;
  title: string;
  description: string;
  durationHours: number;
  date: string;
  questions?: QuizQuestion[]; // Added quiz support
}

export interface TrainingAttempt {
  id: string;
  trainingId: string;
  userId: string;
  userName: string;
  score: number; // 0 to 100
  date: string;
  status: 'Aprobado' | 'Desaprobado';
}

export interface NewsItem {
  id: string;
  companyId: string;
  title: string;
  content: string;
  date: string;
  priority: 'Normal' | 'Alta' | 'Urgente';
  authorName: string;
}

export interface Certificate {
  id: string;
  userId: string;
  trainingId: string;
  trainingTitle: string;
  issueDate: string;
  code: string;
}

export interface InventoryItem {
  id: string;
  companyId: string;
  name: string;
  sku: string; // Unique Product Code
  brand?: string;
  model?: string;
  location?: string; // Shelf A, Bin 2, etc.
  supplier?: string;
  stock: number;
  minStock: number;
  category: string;
  requiresReturn: boolean; // True for tools (loans), False for consumables
  unit: string; // kg, liters, units, etc.
  image?: string; // Base64 or URL
  lastRestock?: string; // Date of entry
  expirationDate?: string; // For chemicals or specific PPE
}

export enum RequestStatus {
  PENDING = 'Pendiente',
  APPROVED = 'Aprobado',
  REJECTED = 'Rechazado',
  DELIVERED = 'Entregado' // Pickup completed
}

export enum ReturnStatus {
  NOT_REQUIRED = 'No Requiere',
  PENDING_RETURN = 'En Préstamo',
  RETURNED = 'Devuelto'
}

export interface WarehouseRequest {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  userArea?: string;
  itemId: string;
  itemName: string;
  quantity: number;
  date: string;
  status: RequestStatus;
  
  // Logistics Flow Fields
  approvalComment?: string;
  pickupTime?: string;
  pickupLocation?: string;
  
  // Request Details
  justification?: string;
  priority?: 'Alta' | 'Media' | 'Baja';
  projectCode?: string; // OT or Project

  // Return Logic
  returnStatus: ReturnStatus;
  returnDate?: string;
}

export enum SSTDocumentType {
  IPERC = 'IPERC',
  ATS = 'ATS',
  CHECKLIST = 'Checklist',
  PETS = 'PETS',
  PETAR = 'PETAR'
}

export interface SSTDocument {
  id: string;
  companyId: string;
  type: SSTDocumentType;
  title: string;
  createdAt: string;
  status: 'Draft' | 'Approved' | 'Archived' | 'Pending' | 'Rejected';
  createdBy: string;
  data?: any; 
  approvalComment?: string;
  approvedBy?: string;
}

export enum VehicleStatus {
  OPERATIVO = 'Operativo',
  MANTENIMIENTO = 'En Mantenimiento',
  INOPERATIVO = 'Inoperativo'
}

export interface Vehicle {
  id: string;
  companyId: string;
  name: string; // e.g. "Camión Volquete 01"
  code: string; // e.g. "CV-01"
  brand: string;
  model: string;
  type: string; // e.g. "Linea Amarilla", "Transporte", "Liviano"
  status: VehicleStatus;
  currentHours: number;
  nextMaintenanceHours: number;
  maintenanceAlert: 'Normal' | 'Vencido' | 'Próximo';
  image?: string;
}