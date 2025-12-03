import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { storageService } from '@/services/storage';
import { SESSION_CATEGORIES, SessionCategory } from '@/types/session';

const COLORS = {
  light: '#F5F5F5',
  white: '#FFFFFF',
  dark: '#333333',
  gray: '#9E9E9E',
  primary: '#4CAF50',
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
};

const CATEGORY_COLORS = {
  'Ders Çalışma': '#2196F3',
  'Kodlama': '#9C27B0',
  'Proje': '#FF9800',
  'Kitap Okuma': '#4CAF50',
};

const CATEGORY_ICONS = {
  'Ders Çalışma': '📚',
  'Kodlama': '💻',
  'Proje': '📁',
  'Kitap Okuma': '📖',
};

export default function HomeScreen() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SessionCategory>('Ders Çalışma');
  const [distractions, setDistractions] = useState(0);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<any>(null);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const totalDuration = useRef(25 * 60);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSessionComplete = useCallback(async () => {
    setIsRunning(false);
    
    const completedDuration = totalDuration.current - timeLeft;
    const summary = {
      category: selectedCategory,
      duration: completedDuration,
      distractions,
      completed: timeLeft === 0,
    };

     try {
      await storageService.saveSession({
        id: Date.now().toString(),
        category: selectedCategory,
        duration: completedDuration,
        distractionCount: distractions,
        startTime: sessionStartTime || Date.now() - completedDuration * 1000,
        endTime: Date.now(),
        completed: timeLeft === 0,
      });
    } catch (error) {
      console.error('Seans kaydetme hatası:', error);
      Alert.alert('Hata', 'Seans kaydedilemedi. Lütfen tekrar deneyin.');
    }

    setSessionSummary(summary);
    setShowSummary(true);
  }, [timeLeft, selectedCategory, distractions, sessionStartTime]);

   useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, handleSessionComplete]); // handleSessionComplete eklendi


  // AppState Listener - Dikkat Dağınıklığı Takibi
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        isRunning &&
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        setDistractions((prev) => prev + 1);
        setIsRunning(false);
        Alert.alert(
          'Dikkat Dağınıklığı!',
          'Uygulamadan çıktınız. Zamanlayıcı durakladı.',
          [{ text: 'Tamam' }]
        );
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isRunning]);

  const handleStart = () => {
    if (timeLeft === 0) {
      Alert.alert('Uyarı', 'Lütfen önce zamanlayıcıyı sıfırlayın.');
      return;
    }
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(totalDuration.current);
    setDistractions(0);
    setSessionStartTime(null);
  };

  const handleSaveAndReset = () => {
    setShowSummary(false);
    handleReset();
  };

  const handleCategorySelect = (category: SessionCategory) => {
    setSelectedCategory(category);
    setShowCategoryModal(false);
  };

  const handleDurationChange = (minutes: number) => {
    const newDuration = minutes * 60;
    setCustomMinutes(minutes);
    setTimeLeft(newDuration);
    totalDuration.current = newDuration;
  };

  const progress = ((totalDuration.current - timeLeft) / totalDuration.current) * 100;
  const hasStarted = timeLeft < totalDuration.current;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Odaklanma Takibi</Text>

      {/* Kategori Seçici */}
      <TouchableOpacity
        style={[styles.categoryButton, { backgroundColor: CATEGORY_COLORS[selectedCategory] }]}
        onPress={() => setShowCategoryModal(true)}
        disabled={isRunning}
      >
        <Text style={styles.categoryIcon}>{CATEGORY_ICONS[selectedCategory]}</Text>
        <Text style={styles.categoryText}>{selectedCategory}</Text>
      </TouchableOpacity>

      {/* Süre Ayarlayıcı */}
      {!isRunning && (
        <View style={styles.durationSelector}>
          <Text style={styles.durationLabel}>Süre Ayarla:</Text>
          <View style={styles.durationButtons}>
            {[15, 25, 45, 60].map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={[
                  styles.durationButton,
                  customMinutes === minutes && styles.durationButtonActive,
                ]}
                onPress={() => handleDurationChange(minutes)}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    customMinutes === minutes && styles.durationButtonTextActive,
                  ]}
                >
                  {minutes}dk
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Zamanlayıcı */}
      <View style={styles.timerContainer}>
        <View style={[styles.progressRing, { borderColor: CATEGORY_COLORS[selectedCategory] }]}>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          <Text style={styles.timerStatus}>
            {isRunning ? 'ÇALIŞIYOR' : 'DURAKLAT İLDI'}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${progress}%`, 
                backgroundColor: CATEGORY_COLORS[selectedCategory] 
              }
            ]} 
          />
        </View>
      </View>

      {/* Dikkat Dağınıklığı Sayacı */}
      <View style={styles.distractionsContainer}>
        <Text style={styles.distractionsLabel}>Dikkat Dağınıklığı</Text>
        <Text style={styles.distractionsCount}>{distractions}</Text>
      </View>

      {/* Kontrol Butonları */}
      <View style={styles.controls}>
        {!isRunning ? (
          <TouchableOpacity style={[styles.button, styles.startButton]} onPress={handleStart}>
            <Text style={styles.buttonText}>▶ Başlat</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.button, styles.pauseButton]} onPress={handlePause}>
            <Text style={styles.buttonText}>⏸ Duraklat</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={handleReset}>
          <Text style={styles.buttonText}>↻ Sıfırla</Text>
        </TouchableOpacity>
      </View>

      {/* Seansı Bitir Butonu */}
      {hasStarted && timeLeft > 0 && (
        <TouchableOpacity 
          style={styles.completeButton} 
          onPress={handleSessionComplete}
          activeOpacity={0.7}
        >
          <Text style={styles.completeButtonText}>✓ Seansı Bitir ve Kaydet</Text>
        </TouchableOpacity>
      )}

      {/* Kategori Seçim Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kategori Seç</Text>
            <ScrollView>
              {SESSION_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[styles.categoryOption, { backgroundColor: CATEGORY_COLORS[category] }]}
                  onPress={() => handleCategorySelect(category)}
                >
                  <Text style={styles.categoryOptionIcon}>{CATEGORY_ICONS[category]}</Text>
                  <Text style={styles.categoryOptionText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Seans Özeti Modal */}
      <Modal
        visible={showSummary}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSummary(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>
              {sessionSummary?.completed ? '🎉 Tebrikler!' : '📊 Seans Özeti'}
            </Text>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Kategori:</Text>
              <Text style={styles.summaryValue}>{sessionSummary?.category}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Süre:</Text>
              <Text style={styles.summaryValue}>
                {sessionSummary ? Math.floor(sessionSummary.duration / 60) : 0} dakika
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Dikkat Dağınıklığı:</Text>
              <Text style={styles.summaryValue}>{sessionSummary?.distractions}</Text>
            </View>
            <TouchableOpacity style={styles.summaryButton} onPress={handleSaveAndReset}>
              <Text style={styles.summaryButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    width: '100%',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 30,
    marginRight: 10,
  },
  categoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  durationSelector: {
    width: '100%',
    marginBottom: 20,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 10,
  },
  durationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.gray,
    alignItems: 'center',
  },
  durationButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  durationButtonTextActive: {
    color: COLORS.white,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 30,
    width: '100%',
  },
  progressRing: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  timerText: {
    fontSize: 52,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  timerStatus: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.white,
    borderRadius: 4,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  distractionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    justifyContent: 'space-between',
  },
  distractionsLabel: {
    fontSize: 16,
    color: COLORS.gray,
  },
  distractionsCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  },
  button: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  startButton: {
    backgroundColor: COLORS.success,
  },
  pauseButton: {
    backgroundColor: COLORS.warning,
  },
  resetButton: {
    backgroundColor: COLORS.gray,
  },
  completeButton: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  completeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: COLORS.dark,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  categoryOptionIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  categoryOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  closeButton: {
    backgroundColor: COLORS.gray,
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  closeButtonText: {
    color: COLORS.white,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 30,
    width: '85%',
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: COLORS.dark,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  summaryLabel: {
    fontSize: 16,
    color: COLORS.gray,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  summaryButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  summaryButtonText: {
    color: COLORS.white,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
