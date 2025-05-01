import api from './api';
import { User } from '../types';

export const userService = {
  async updateProfile(data: Partial<User>): Promise<User> {
    const { data: updatedUser } = await api.put('/users/profile', data);
    return updatedUser;
  },

  async updateSettings(settings: any): Promise<void> {
    await api.put('/users/settings', settings);
  },

  async getSettings(): Promise<any> {
    const { data } = await api.get('/users/settings');
    return data;
  }
};