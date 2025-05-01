import api from './api';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData extends LoginData {
  name: string;
  phone: string;
  cpf: string;
  birth_date: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  cpf: string;
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      console.log('🔑 Attempting login:', { email: data.email });

      const response = await api.post('auth/login/', data);

      console.log('✅ Login successful:', {
        hasToken: !!response.data.token,
        hasUser: !!response.data.user,
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ Login error:', {
        hasResponse: !!error.response,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (!error.response) {
        throw new Error('Erro de conexão. Verifique sua internet.');
      }

      if (error.response.status === 401) {
        throw new Error('Email ou senha incorretos');
      }

      throw new Error(error.response?.data?.message || 'Erro ao fazer login');
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log('📡 Enviando POST para:', api.defaults.baseURL + 'auth/register/');

      if (!data.email || !data.password || !data.name || !data.cpf || !data.phone || !data.birth_date) {
        throw new Error('Todos os campos são obrigatórios.');
      }

      const response = await api.post('auth/register/', data); // ✅ com barra final

      console.log('✅ Registration successful');
      return response.data;
    } catch (error: any) {
      console.error('❌ Registration error:', {
        hasResponse: !!error.response,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (!error.response) {
        throw new Error('Erro de conexão. Verifique sua internet.');
      }

      if (error.response.status === 422) {
        throw new Error('Dados inválidos. Verifique as informações.');
      }

      throw new Error(error.response?.data?.message || 'Erro ao criar conta');
    }
  },

  async logout(): Promise<void> {
    try {
      console.log('🚪 Attempting logout');
      await api.post('auth/logout/');
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No token found for getCurrentUser');
        return null;
      }

      console.log('👤 Fetching current user');
      const response = await api.get('auth/me/'); // ✅ com barra final
      return response.data.user;
    } catch (error: any) {
      console.error('❌ getCurrentUser error:', {
        hasResponse: !!error.response,
        status: error.response?.status,
        data: error.response?.data,
      });

      if (!error.response) {
        throw new Error('Erro de conexão.');
      }

      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        return null;
      }

      throw error;
    }
  },
};
