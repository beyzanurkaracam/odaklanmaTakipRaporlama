import AsyncStorage from '@react-native-async-storage/async-storage';
import { FocusSession } from '@/types/session';

const SESSIONS_KEY = '@focus_sessions';

export const storageService = {
  // Tüm seansları getir
  async getAllSessions(): Promise<FocusSession[]> {
    try {
      const data = await AsyncStorage.getItem(SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
      return [];
    }
  },

  // Yeni seans kaydet
  async saveSession(session: FocusSession): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      sessions.push(session);
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Seans kaydedilirken hata:', error);
      throw error;
    }
  },

  // Bugünün seanslarını getir
  async getTodaySessions(): Promise<FocusSession[]> {
    const sessions = await this.getAllSessions();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    return sessions.filter(session => session.startTime >= todayTimestamp);
  },

  // Son 7 günün seanslarını getir
  async getLastWeekSessions(): Promise<FocusSession[]> {
    const sessions = await this.getAllSessions();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weekAgoTimestamp = weekAgo.getTime();

    return sessions.filter(session => session.startTime >= weekAgoTimestamp);
  },

  // Kategoriye göre seansları getir
  async getSessionsByCategory(category: string): Promise<FocusSession[]> {
    const sessions = await this.getAllSessions();
    return sessions.filter(session => session.category === category);
  },

  // Tüm verileri sil (test için)
  async clearAllSessions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSIONS_KEY);
    } catch (error) {
      console.error('Veriler silinirken hata:', error);
      throw error;
    }
  },
};
