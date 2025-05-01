import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  completedAt?: string;
  progress: number;
  maxProgress: number;
  category: 'financial' | 'engagement' | 'milestone';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    if (user) {
      loadAchievements();
    } else {
      setAchievements([]);
      setTotalPoints(0);
      setLoading(false);
    }
  }, [user]);

  const loadAchievements = async () => {
    try {
      const { data: userAchievements, error: achievementsError } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', user?.id)
        .eq('type', 'achievements')
        .single();

      if (achievementsError && achievementsError.code !== 'PGRST116') {
        throw achievementsError;
      }

      const savedAchievements = userAchievements?.data?.achievements || [];
      setAchievements(savedAchievements);

      // Calculate total points
      const points = savedAchievements.reduce((total: number, achievement: Achievement) => {
        return total + (achievement.completed ? achievement.points : 0);
      }, 0);
      setTotalPoints(points);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAchievement = async (achievementId: string, progress: number) => {
    if (!user) return;

    try {
      const achievement = achievements.find(a => a.id === achievementId);
      if (!achievement) return;

      const updatedAchievement = {
        ...achievement,
        progress: Math.min(progress, achievement.maxProgress),
        completed: progress >= achievement.maxProgress,
        completedAt: progress >= achievement.maxProgress ? new Date().toISOString() : undefined
      };

      const updatedAchievements = achievements.map(a => 
        a.id === achievementId ? updatedAchievement : a
      );

      await supabase
        .from('user_data')
        .upsert({
          user_id: user.id,
          type: 'achievements',
          data: { achievements: updatedAchievements },
          updated_at: new Date().toISOString()
        });

      setAchievements(updatedAchievements);

      // Update total points
      const newPoints = updatedAchievements.reduce((total, achievement) => {
        return total + (achievement.completed ? achievement.points : 0);
      }, 0);
      setTotalPoints(newPoints);

      return { success: true };
    } catch (error) {
      console.error('Error updating achievement:', error);
      throw error;
    }
  };

  return {
    achievements,
    totalPoints,
    loading,
    updateAchievement
  };
}