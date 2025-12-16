
import { db as mockDb } from './mockDb';
import { supabase, isProduction } from './supabaseClient';
import { User, Company, IncidentReport, InventoryItem, WarehouseRequest, SSTDocument } from '../types';

/**
 * ZELCON API SERVICE LAYER
 * Este archivo actúa como un "puente". 
 * Si configuramos Supabase, usa la DB real.
 * Si no, usa el mockDb (localStorage).
 */

export const api = {
    auth: {
        login: async (email: string) => {
            if (isProduction() && supabase) {
                // Real Auth Logic via Supabase Magic Link or Password
                // const { data, error } = await supabase.auth.signInWithPassword(...)
                console.log("Modo Producción: Implementar Supabase Auth aquí");
                return null;
            } else {
                return mockDb.users.getByEmail(email);
            }
        },
        getCurrentUser: async () => {
             if (isProduction() && supabase) {
                const { data: { user } } = await supabase.auth.getUser();
                if(!user) return null;
                // Fetch profile
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                return data as User;
             } else {
                 const storedId = localStorage.getItem('zelcon_current_user_id');
                 if(!storedId) return null;
                 return mockDb.users.getAll().find(u => u.id === storedId) || null;
             }
        }
    },
    
    companies: {
        list: async () => {
            if (isProduction() && supabase) {
                const { data } = await supabase.from('companies').select('*');
                return data as Company[] || [];
            }
            return mockDb.companies.getAll();
        }
    },

    inventory: {
        list: async (companyId: string) => {
            if (isProduction() && supabase) {
                const { data } = await supabase.from('inventory_items').select('*').eq('company_id', companyId);
                return data as InventoryItem[] || [];
            }
            return mockDb.inventory.getByCompany(companyId);
        },
        create: async (item: InventoryItem) => {
            if (isProduction() && supabase) {
                // Map frontend type to DB columns
                const { error } = await supabase.from('inventory_items').insert([{
                    company_id: item.companyId,
                    name: item.name,
                    sku: item.sku,
                    stock_current: item.stock,
                    category: item.category
                    // ... map other fields
                }]);
                if(error) console.error(error);
                return;
            }
            mockDb.inventory.create(item);
        }
    },

    incidents: {
        create: async (incident: IncidentReport) => {
            if (isProduction() && supabase) {
                await supabase.from('incidents').insert([{
                    company_id: incident.companyId,
                    reporter_id: incident.userId,
                    description: incident.description,
                    date_occurrence: incident.date,
                    status: 'Pendiente'
                }]);
                return;
            }
            mockDb.incidents.create(incident);
        }
    }
};
