
import { User, Company, IncidentReport, Training, Certificate, InventoryItem, UserRole, IncidentStatus, SSTDocument, SSTDocumentType, WarehouseRequest, RequestStatus, ReturnStatus, NewsItem, TrainingAttempt, Vehicle, VehicleStatus } from '../types';

// Initial Seed Data
const INITIAL_COMPANIES: Company[] = [
  {
    id: 'c1',
    name: 'Minería del Sur S.A.C.',
    ruc: '20555111222',
    address: 'Av. Los Andes 123, Arequipa',
    phone: '054-222333',
    domain: 'zelcon-minasur.com', // Updated Domain Format
    modules: { sst: true, training: true, warehouse: true, operations: true }
  },
  {
    id: 'c2',
    name: 'Constructora Global',
    ruc: '20100200300',
    address: 'Jr. La Torre 456, Lima',
    phone: '01-4445555',
    domain: 'zelcon-conglobal.com', // Updated Domain Format
    modules: { sst: true, training: false, warehouse: true, operations: true }
  }
];

const INITIAL_USERS: User[] = [
  // Super Admin - Pre-verified
  { id: 'u1', name: 'Admin General', email: 'admin@zelcon.com', role: UserRole.SUPER_ADMIN, isActive: true, termsAccepted: true, profileCompleted: true },
  
  // Company 1 Users - Pre-verified for demo
  { id: 'u2', name: 'Carlos Gerente', email: 'gerente@zelcon-minasur.com', role: UserRole.COMPANY_ADMIN, companyId: 'c1', isActive: true, area: 'Gerencia', termsAccepted: true, profileCompleted: true },
  { id: 'u3', name: 'Ana Supervisor', email: 'ana@zelcon-minasur.com', role: UserRole.SUPERVISOR, companyId: 'c1', isActive: true, area: 'SST', termsAccepted: true, profileCompleted: true },
  { id: 'u4', name: 'Luis Almacén', email: 'luis@zelcon-minasur.com', role: UserRole.ALMACENERO, companyId: 'c1', isActive: true, area: 'Logística', termsAccepted: true, profileCompleted: true },
  
  // Worker
  { id: 'u5', name: 'Pepe Minero', email: 'pepe@zelcon-minasur.com', role: UserRole.TRABAJADOR, companyId: 'c1', isActive: true, position: 'Operador Maquinaria', area: 'Mina Subterránea', termsAccepted: true, profileCompleted: true },

  // Company 2 Users
  { id: 'u6', name: 'Maria CEO', email: 'ceo@zelcon-conglobal.com', role: UserRole.COMPANY_ADMIN, companyId: 'c2', isActive: true, termsAccepted: true, profileCompleted: true },
];

const INITIAL_INCIDENTS: IncidentReport[] = [
  {
    id: 'i1',
    companyId: 'c1',
    userId: 'u5',
    userName: 'Pepe Minero',
    date: '2023-10-25',
    description: 'Caída de rocas menores en el sector 4 durante la excavación. Se detuvo la operación por 20 minutos.',
    status: IncidentStatus.PENDING
  }
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { 
    id: 'inv1', companyId: 'c1', name: 'Casco de Seguridad', stock: 50, minStock: 10, category: 'EPP', requiresReturn: false, unit: 'UND', lastRestock: '2023-10-01',
    sku: 'EPP-001', brand: 'MSA', model: 'V-Gard', location: 'Estante A-1', supplier: 'Seguridad Industrial SAC'
  },
  { 
    id: 'inv2', companyId: 'c1', name: 'Guantes de Cuero', stock: 5, minStock: 20, category: 'EPP', requiresReturn: false, unit: 'PAR', lastRestock: '2023-09-15',
    sku: 'EPP-002', brand: 'Steelpro', location: 'Estante A-2'
  },
  { 
    id: 'inv3', companyId: 'c1', name: 'Taladro Percutor', stock: 3, minStock: 2, category: 'Herramientas', requiresReturn: true, unit: 'UND', lastRestock: '2023-08-20',
    sku: 'HER-105', brand: 'Bosch', model: 'GBH 2-26', location: 'Jaula H-1'
  },
  { 
    id: 'inv4', companyId: 'c1', name: 'Alicate de Presión', stock: 10, minStock: 5, category: 'Herramientas', requiresReturn: true, unit: 'UND', lastRestock: '2023-10-10',
    sku: 'HER-202', brand: 'Stanley', location: 'Cajón 4'
  },
  { 
    id: 'inv5', companyId: 'c1', name: 'Respirador Media Cara', stock: 20, minStock: 8, category: 'EPP', requiresReturn: false, unit: 'UND', lastRestock: '2023-10-22',
    sku: 'EPP-050', brand: '3M', model: '6200', location: 'Estante B-1'
  },
  { 
    id: 'inv6', companyId: 'c1', name: 'Aceite Hidráulico ISO 68', stock: 200, minStock: 50, category: 'Insumos', requiresReturn: false, unit: 'LITROS', lastRestock: '2023-10-25',
    sku: 'INS-900', brand: 'Mobil', location: 'Patio de Aceites', expirationDate: '2025-10-01'
  },
];

const INITIAL_REQUESTS: WarehouseRequest[] = [
  { 
    id: 'req1', 
    companyId: 'c1', 
    userId: 'u5', 
    userName: 'Pepe Minero',
    userArea: 'Mina Subterránea', 
    itemId: 'inv1', 
    itemName: 'Casco de Seguridad', 
    quantity: 1, 
    date: '2023-10-26', 
    status: RequestStatus.PENDING,
    returnStatus: ReturnStatus.NOT_REQUIRED
  }
];

const INITIAL_TRAININGS: Training[] = [
  { 
    id: 't1', 
    companyId: 'c1', 
    title: 'Trabajo en Altura', 
    description: 'Normativa y seguridad para trabajos sobre 1.8m. Uso correcto de arnés y línea de vida.', 
    durationHours: 4, 
    date: '2023-11-01',
    questions: [
      { id: 'q1', question: '¿A partir de qué altura se considera trabajo en altura?', options: ['1.0 metros', '1.5 metros', '1.8 metros', '2.0 metros'], correctOptionIndex: 2 },
      { id: 'q2', question: '¿Cuál es el EPP principal para evitar caídas?', options: ['Casco', 'Arnés de cuerpo entero', 'Guantes', 'Botas'], correctOptionIndex: 1 },
      { id: 'q3', question: 'Antes de usar el arnés, debo:', options: ['Lavarlo con agua', 'Inspeccionarlo visualmente', 'Pintarlo', 'Guardarlo'], correctOptionIndex: 1 }
    ]
  },
];

const INITIAL_NEWS: NewsItem[] = [
  { id: 'n1', companyId: 'c1', title: 'Campaña de Manos Seguras', content: 'Durante este mes estaremos reforzando el uso de guantes y cuidado de manos. Reporten cualquier herramienta defectuosa.', date: '2023-10-20', priority: 'Alta', authorName: 'Ana Supervisor' },
  { id: 'n2', companyId: 'c1', title: 'Mantenimiento de Comedor', content: 'El comedor estará cerrado por mantenimiento el sábado de 2pm a 4pm.', date: '2023-10-25', priority: 'Normal', authorName: 'Carlos Gerente' }
];

const INITIAL_DOCUMENTS: SSTDocument[] = [
  { id: 'd1', companyId: 'c1', type: SSTDocumentType.IPERC, title: 'Matriz IPERC - Zona Chancado', createdAt: '2023-10-01', status: 'Approved', createdBy: 'Carlos Gerente' },
  { id: 'd2', companyId: 'c1', type: SSTDocumentType.PETS, title: 'PETS-001 Operación de Cargador', createdAt: '2023-09-15', status: 'Approved', createdBy: 'Ana Supervisor' },
  { id: 'd3', companyId: 'c1', type: SSTDocumentType.ATS, title: 'ATS - Limpieza de Tolvas', createdAt: '2023-10-26', status: 'Pending', createdBy: 'Pepe Minero' },
];

const INITIAL_FLEET: Vehicle[] = [
  {
    id: 'v1',
    companyId: 'c1',
    name: 'Excavadora 336D',
    code: 'EX-05',
    brand: 'Caterpillar',
    model: '336D2 L',
    type: 'Línea Amarilla',
    status: VehicleStatus.OPERATIVO,
    currentHours: 12450,
    nextMaintenanceHours: 12500,
    maintenanceAlert: 'Próximo'
  },
  {
    id: 'v2',
    companyId: 'c1',
    name: 'Camión Volquete',
    code: 'VJ-02',
    brand: 'Volvo',
    model: 'FMX 460',
    type: 'Transporte Pesado',
    status: VehicleStatus.MANTENIMIENTO,
    currentHours: 8005,
    nextMaintenanceHours: 8000,
    maintenanceAlert: 'Vencido'
  },
  {
    id: 'v3',
    companyId: 'c1',
    name: 'Cargador Frontal',
    code: 'CF-10',
    brand: 'Komatsu',
    model: 'WA470',
    type: 'Línea Amarilla',
    status: VehicleStatus.OPERATIVO,
    currentHours: 5000,
    nextMaintenanceHours: 5250,
    maintenanceAlert: 'Normal'
  }
];

// Helper to manage LocalStorage
const getStorage = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
};

const setStorage = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Database Service
export const db = {
  users: {
    getAll: () => getStorage<User[]>('zelcon_users', INITIAL_USERS),
    create: (user: User) => {
      const users = getStorage<User[]>('zelcon_users', INITIAL_USERS);
      users.push(user);
      setStorage('zelcon_users', users);
    },
    update: (updatedUser: User) => {
      let users = getStorage<User[]>('zelcon_users', INITIAL_USERS);
      users = users.map(u => u.id === updatedUser.id ? updatedUser : u);
      setStorage('zelcon_users', users);
    },
    delete: (userId: string) => {
      let users = getStorage<User[]>('zelcon_users', INITIAL_USERS);
      users = users.filter(u => u.id !== userId);
      setStorage('zelcon_users', users);
    },
    getByEmail: (email: string) => getStorage<User[]>('zelcon_users', INITIAL_USERS).find(u => u.email === email),
    getByCompany: (companyId: string) => getStorage<User[]>('zelcon_users', INITIAL_USERS).filter(u => u.companyId === companyId),
  },
  companies: {
    getAll: () => getStorage<Company[]>('zelcon_companies', INITIAL_COMPANIES),
    create: (company: Company) => {
      const list = getStorage<Company[]>('zelcon_companies', INITIAL_COMPANIES);
      list.push(company);
      setStorage('zelcon_companies', list);
    },
    update: (updatedCompany: Company) => {
      let list = getStorage<Company[]>('zelcon_companies', INITIAL_COMPANIES);
      list = list.map(c => c.id === updatedCompany.id ? updatedCompany : c);
      setStorage('zelcon_companies', list);
    },
    getById: (id: string) => getStorage<Company[]>('zelcon_companies', INITIAL_COMPANIES).find(c => c.id === id),
  },
  incidents: {
    getAll: () => getStorage<IncidentReport[]>('zelcon_incidents', INITIAL_INCIDENTS),
    getByCompany: (companyId: string) => getStorage<IncidentReport[]>('zelcon_incidents', INITIAL_INCIDENTS).filter(i => i.companyId === companyId),
    create: (incident: IncidentReport) => {
      const list = getStorage<IncidentReport[]>('zelcon_incidents', INITIAL_INCIDENTS);
      list.unshift(incident); // Add to top
      setStorage('zelcon_incidents', list);
    },
    update: (updated: IncidentReport) => {
      let list = getStorage<IncidentReport[]>('zelcon_incidents', INITIAL_INCIDENTS);
      list = list.map(i => i.id === updated.id ? updated : i);
      setStorage('zelcon_incidents', list);
    }
  },
  inventory: {
    getByCompany: (companyId: string) => getStorage<InventoryItem[]>('zelcon_inventory', INITIAL_INVENTORY).filter(i => i.companyId === companyId),
    create: (item: InventoryItem) => {
      const list = getStorage<InventoryItem[]>('zelcon_inventory', INITIAL_INVENTORY);
      list.push(item);
      setStorage('zelcon_inventory', list);
    },
    updateStock: (id: string, newStock: number) => {
      let list = getStorage<InventoryItem[]>('zelcon_inventory', INITIAL_INVENTORY);
      list = list.map(i => i.id === id ? { ...i, stock: newStock } : i);
      setStorage('zelcon_inventory', list);
    },
    requests: {
      getByCompany: (companyId: string) => getStorage<WarehouseRequest[]>('zelcon_requests', INITIAL_REQUESTS).filter(r => r.companyId === companyId),
      create: (req: WarehouseRequest) => {
        const list = getStorage<WarehouseRequest[]>('zelcon_requests', INITIAL_REQUESTS);
        list.unshift(req);
        setStorage('zelcon_requests', list);
      },
      update: (req: WarehouseRequest) => {
        let list = getStorage<WarehouseRequest[]>('zelcon_requests', INITIAL_REQUESTS);
        list = list.map(r => r.id === req.id ? req : r);
        setStorage('zelcon_requests', list);
      },
      updateStatus: (id: string, status: RequestStatus) => {
        let list = getStorage<WarehouseRequest[]>('zelcon_requests', INITIAL_REQUESTS);
        list = list.map(r => r.id === id ? { ...r, status } : r);
        setStorage('zelcon_requests', list);
      }
    }
  },
  trainings: {
    getByCompany: (companyId: string) => getStorage<Training[]>('zelcon_trainings', INITIAL_TRAININGS).filter(t => t.companyId === companyId),
    create: (t: Training) => {
      const list = getStorage<Training[]>('zelcon_trainings', INITIAL_TRAININGS);
      list.unshift(t);
      setStorage('zelcon_trainings', list);
    },
    results: {
      getAll: () => getStorage<TrainingAttempt[]>('zelcon_training_results', []),
      getByCompany: (companyId: string) => {
        return getStorage<TrainingAttempt[]>('zelcon_training_results', []);
      },
      add: (attempt: TrainingAttempt) => {
        const list = getStorage<TrainingAttempt[]>('zelcon_training_results', []);
        list.push(attempt);
        setStorage('zelcon_training_results', list);
      }
    }
  },
  news: {
    getByCompany: (companyId: string) => getStorage<NewsItem[]>('zelcon_news', INITIAL_NEWS).filter(n => n.companyId === companyId),
    create: (news: NewsItem) => {
      const list = getStorage<NewsItem[]>('zelcon_news', INITIAL_NEWS);
      list.unshift(news);
      setStorage('zelcon_news', list);
    }
  },
  documents: {
    getByCompany: (companyId: string) => getStorage<SSTDocument[]>('zelcon_documents', INITIAL_DOCUMENTS).filter(d => d.companyId === companyId),
    create: (doc: SSTDocument) => {
      const list = getStorage<SSTDocument[]>('zelcon_documents', INITIAL_DOCUMENTS);
      list.unshift(doc);
      setStorage('zelcon_documents', list);
    },
    update: (doc: SSTDocument) => {
      let list = getStorage<SSTDocument[]>('zelcon_documents', INITIAL_DOCUMENTS);
      list = list.map(d => d.id === doc.id ? doc : d);
      setStorage('zelcon_documents', list);
    },
    delete: (docId: string) => {
       let list = getStorage<SSTDocument[]>('zelcon_documents', INITIAL_DOCUMENTS);
       list = list.filter(d => d.id !== docId);
       setStorage('zelcon_documents', list);
    }
  },
  fleet: {
    getByCompany: (companyId: string) => getStorage<Vehicle[]>('zelcon_fleet', INITIAL_FLEET).filter(v => v.companyId === companyId),
    create: (vehicle: Vehicle) => {
      const list = getStorage<Vehicle[]>('zelcon_fleet', INITIAL_FLEET);
      list.push(vehicle);
      setStorage('zelcon_fleet', list);
    },
    update: (updated: Vehicle) => {
      let list = getStorage<Vehicle[]>('zelcon_fleet', INITIAL_FLEET);
      list = list.map(v => v.id === updated.id ? updated : v);
      setStorage('zelcon_fleet', list);
    }
  },
  reset: () => {
    localStorage.clear();
    window.location.reload();
  }
};
