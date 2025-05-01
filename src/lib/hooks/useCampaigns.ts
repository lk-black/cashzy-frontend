import { useState, useEffect, useCallback } from 'react';
import { Campaign, campaignSchema } from '../../types';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export function useCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCampaigns();
    } else {
      setCampaigns([]);
      setLoading(false);
    }
  }, [user]);

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });

      if (error) throw error;

      // Process and validate data
      const processedData = (data || []).map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
        adSpend: Number(campaign.ad_spend) || 0,
        revenue: Number(campaign.revenue) || 0,
        creativesCost: Number(campaign.creatives_cost) || 0,
        assetsCost: Number(campaign.assets_cost) || 0,
        date: campaign.date,
        categoryId: campaign.category_id
      }));

      setCampaigns(processedData);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const updateCampaigns = useCallback(async (newCampaign: Omit<Campaign, 'id'>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // Validate and parse numeric fields
      const validatedData = campaignSchema.parse({
        ...newCampaign,
        adSpend: Number(newCampaign.adSpend) || 0,
        revenue: Number(newCampaign.revenue) || 0,
        creativesCost: Number(newCampaign.creativesCost) || 0,
        assetsCost: Number(newCampaign.assetsCost) || 0
      });

      // Insert campaign
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          name: validatedData.name,
          platform: validatedData.platform,
          ad_spend: validatedData.adSpend,
          revenue: validatedData.revenue,
          creatives_cost: validatedData.creativesCost,
          assets_cost: validatedData.assetsCost,
          date: validatedData.date,
          category_id: validatedData.categoryId
        })
        .select()
        .single();

      if (error) throw error;

      // Process returned data
      const processedCampaign: Campaign = {
        id: data.id,
        name: data.name,
        platform: data.platform,
        adSpend: Number(data.ad_spend) || 0,
        revenue: Number(data.revenue) || 0,
        creativesCost: Number(data.creatives_cost) || 0,
        assetsCost: Number(data.assets_cost) || 0,
        date: data.date,
        categoryId: data.category_id
      };

      // Update local state
      setCampaigns(prev => [processedCampaign, ...prev]);
      toast.success('Campanha adicionada com sucesso');
      return { success: true };
    } catch (error: any) {
      console.error('Error updating campaigns:', error);
      toast.error(error.message || 'Erro ao adicionar campanha');
      throw error;
    }
  }, [user]);

  return [campaigns, updateCampaigns] as const;
}