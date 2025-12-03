import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { storageService } from '@/services/storage';
import { FocusSession } from '@/types/session';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useFocusEffect } from 'expo-router';

const COLORS = {
  light: '#F5F5F5',
  white: '#FFFFFF',
  dark: '#333333',
  gray: '#9E9E9E',
  primary: '#4CAF50',
  danger: '#F44336',
};

const CATEGORY_COLORS: { [key: string]: string } = {
  'Ders Çalışma': '#2196F3',
  'Kodlama': '#9C27B0',
  'Proje': '#FF9800',
  'Kitap Okuma': '#4CAF50',
};

export default function ReportsScreen() {
  const [allSessions, setAllSessions] = useState<FocusSession[]>([]);
  const [todaySessions, setTodaySessions] = useState<FocusSession[]>([]);
  const [weekSessions, setWeekSessions] = useState<FocusSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const all = await storageService.getAllSessions();
      const today = await storageService.getTodaySessions();
      const week = await storageService.getLastWeekSessions();

      setAllSessions(all);
      setTodaySessions(today);
      setWeekSessions(week);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    }
    setIsLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}s ${minutes}d`;
    }
    return `${minutes} dakika`;
  };

  // İstatistikler
  const todayTotalDuration = todaySessions.reduce((sum, session) => sum + session.duration, 0);
  const allTimeTotalDuration = allSessions.reduce((sum, session) => sum + session.duration, 0);
  const totalDistractions = allSessions.reduce((sum, session) => sum + session.distractionCount, 0);

  // Son 7 gün için veri hazırla
  const getLast7DaysData = () => {
    const days = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' });
      days.push(dayName);
      
      const daySessions = weekSessions.filter(
        session => session.startTime >= date.getTime() && session.startTime < nextDate.getTime()
      );
      
      const totalMinutes = Math.round(
        daySessions.reduce((sum, session) => sum + session.duration, 0) / 60
      );
      data.push(totalMinutes || 0);
    }
    
    return { days, data };
  };

  // Kategori bazlı veri hazırla
  const getCategoryData = () => {
    const categoryMap: { [key: string]: number } = {};
    
    allSessions.forEach(session => {
      if (!categoryMap[session.category]) {
        categoryMap[session.category] = 0;
      }
      categoryMap[session.category] += session.duration;
    });

    return Object.keys(categoryMap).map((category) => ({
      name: category,
      duration: Math.round(categoryMap[category] / 60),
      color: CATEGORY_COLORS[category] || '#9E9E9E',
      legendFontColor: '#333',
      legendFontSize: 14,
    }));
  };

  const { days, data: weekData } = getLast7DaysData();
  const categoryData = getCategoryData();

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#e0e0e0',
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: 'bold',
    },
  };

  const handleClearData = () => {
    Alert.alert(
      'Verileri Sil',
      'Tüm seans verileriniz silinecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.clearAllSessions();
              loadData();
              Alert.alert('Başarılı', 'Tüm veriler silindi.');
            } catch (error) {
              Alert.alert('Hata', 'Veriler silinemedi.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (allSessions.length === 0) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>📊 Raporlar</Text>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Henüz hiç seans kaydı yok</Text>
            <Text style={styles.emptySubtext}>
              Ana sayfadan bir odaklanma seansı başlatın!
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>📊 Raporlar</Text>

        {/* Genel İstatistikler */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Genel İstatistikler</Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.statIcon}>📅</Text>
              <Text style={styles.statValue}>{formatDuration(todayTotalDuration)}</Text>
              <Text style={styles.statLabel}>Bugün Toplam</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statValue}>{formatDuration(allTimeTotalDuration)}</Text>
              <Text style={styles.statLabel}>Tüm Zamanlar</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
              <Text style={styles.statIcon}>📱</Text>
              <Text style={styles.statValue}>{totalDistractions}</Text>
              <Text style={styles.statLabel}>Toplam Dikkat Dağınıklığı</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statValue}>{allSessions.length}</Text>
              <Text style={styles.statLabel}>Toplam Seans</Text>
            </View>
          </View>
        </View>

        {/* Son 7 Gün Çubuk Grafik */}
        {weekData.some(d => d > 0) && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Son 7 Gün Odaklanma Süreleri</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chartContainer}>
                <BarChart
                  data={{
                    labels: days,
                    datasets: [{ data: weekData.length > 0 ? weekData : [0] }],
                  }}
                  width={Dimensions.get('window').width - 60}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix="dk"
                  chartConfig={chartConfig}
                  style={styles.chart}
                  fromZero
                  showValuesOnTopOfBars
                  verticalLabelRotation={0}
                />
              </View>
            </ScrollView>
          </View>
        )}

        {/* Kategori Pasta Grafik */}
        {categoryData.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Kategorilere Göre Dağılım</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={categoryData}
                width={Dimensions.get('window').width - 60}
                height={220}
                chartConfig={chartConfig}
                accessor="duration"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 0]}
                hasLegend={false}
              />
            </View>
            
            {/* Legend */}
            <View style={styles.legendContainer}>
              {categoryData.map((item, index) => {
                const total = categoryData.reduce((sum, cat) => sum + cat.duration, 0);
                const percentage = ((item.duration / total) * 100).toFixed(0);
                return (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>
                      {item.name}: {item.duration} dk ({percentage}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Son Seanslar */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Son Seanslar</Text>
          {allSessions.slice(-5).reverse().map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionTitleRow}>
                  <View 
                    style={[
                      styles.sessionCategoryDot, 
                      { backgroundColor: CATEGORY_COLORS[session.category] || '#9E9E9E' }
                    ]} 
                  />
                  <Text style={styles.sessionCategory}>{session.category}</Text>
                </View>
                <Text style={styles.sessionDate}>
                  {new Date(session.startTime).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.sessionDetails}>
                <View style={styles.sessionDetail}>
                  <Text style={styles.sessionDetailIcon}>⏱️</Text>
                  <Text style={styles.sessionDetailText}>{formatDuration(session.duration)}</Text>
                </View>
                <View style={styles.sessionDetail}>
                  <Text style={styles.sessionDetailIcon}>📱</Text>
                  <Text style={styles.sessionDetailText}>{session.distractionCount} dikkat dağınıklığı</Text>
                </View>
                {session.completed && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>✓ Tamamlandı</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Verileri Sil Butonu */}
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearData}
        >
          <Text style={styles.clearButtonText}>🗑️ Tüm Verileri Sil</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.gray,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    padding: 20,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  chartSection: {
    marginBottom: 25,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  legendContainer: {
    marginTop: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '500',
  },
  recentSection: {
    marginBottom: 20,
  },
  sessionCard: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionCategoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  sessionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  sessionDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  sessionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  sessionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  sessionDetailIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  sessionDetailText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  completedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: COLORS.danger,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  clearButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
