import api from './api';
import { Campaign } from '../types';

export const campaignService = {
  async getCampaigns(): Promise<Campaign[]> {
    const { data } = await api.get('/campaigns');
    return data;
  },

  async createCampaign(campaign: Omit<Campaign, 'id'>): Promise<Campaign> {
    const { data } = await api.post('/campaigns', campaign);
    return data;
  },

  async updateCampaign(id: string, campaign: Partial<Campaign>): Promise<Campaign> {
    const { data } = await api.put(`/campaigns/${id}`, campaign);
    return data;
  },

  async deleteCampaign(id: string): Promise<void> {
    await api.delete(`/campaigns/${id}`);
  }
};