import { authService } from '../services/authService';
import { toast } from 'react-hot-toast';

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  cpf: string;
  createdAt: string;
  lastSignIn: string | null;
}

// Auth response type
export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: User;
}

// Utilitário para formatar dados do usuário
const formatUser = (user: any): User => {
  return {
    id: user.id,
    email: user.email,
    name: user.name || user.email.split('@')[0],
    phone: user.phone || '',
    cpf: user.cpf || '',
    createdAt: new Date().toISOString(),
    lastSignIn: null
  };
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const user = await authService.getCurrentUser();
    return user ? formatUser(user) : null;
  } catch (error: any) {
    console.error('Error getting current user:', error);
    toast.error(error.message || 'Erro ao carregar usuário');
    return null;
  }
};

// Sign in function
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await authService.login({ email, password });
    if (!response.user) {
      throw new Error('Dados do usuário não encontrados');
    }
    return { success: true, user: formatUser(response.user) };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return { success: false, error: error.message || 'Email ou senha incorretos' };
  }
};

// Sign up function
export const signUp = async (
  email: string, 
  password: string, 
  name: string,
  phone: string,
  cpf: string
): Promise<AuthResponse> => {
  try {
    const response = await authService.register({
      email,
      password,
      name,
      phone: phone.replace(/\D/g, ''), // Remove não dígitos
      cpf: cpf.replace(/\D/g, ''), // Remove não dígitos
      birth_date: new Date().toISOString().split('T')[0] // Formato esperado pela API
    });
    if (!response.user) {
      throw new Error('Dados do usuário não encontrados');
    }
    return { success: true, user: formatUser(response.user) };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return { success: false, error: error.message || 'Erro ao criar conta. Tente novamente.' };
  }
};

// Sign out function
export const signOut = async (): Promise<void> => {
  try {
    await authService.logout();
  } catch (error: any) {
    console.error('Sign out error:', error);
    toast.error(error.message || 'Erro ao sair');
  }
};

// Update user profile
export const updateUserProfile = async (data: Partial<User>): Promise<AuthResponse> => {
  try {
    const response = await authService.getCurrentUser();
    if (!response) {
      throw new Error('Usuário não encontrado');
    }
    return { success: true, user: formatUser(response) };
  } catch (error: any) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message || 'Erro ao atualizar perfil' };
  }
};