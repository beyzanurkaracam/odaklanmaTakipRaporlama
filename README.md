# Odaklanma Takibi ve Raporlama Uygulaması

**BSM 447 - Mobil Uygulama Geliştirme Dersi Dönem Projesi**

## 📱 Proje Hakkında

Dijital dikkat dağınıklığıyla mücadele etmek için tasarlanmış bir React Native (Expo) mobil uygulaması. Kullanıcıların odaklanma seanslarını takip eder, dikkat dağınıklığı anlarını tespit eder ve detaylı raporlar sunar.

## ✨ Özellikler

### Ana Sayfa (Zamanlayıcı)
- ⏱️ **Özelleştirilebilir Zamanlayıcı**: 15, 25, 30, 45 veya 60 dakika seçenekleri
- 🎯 **Kategori Seçimi**: Ders Çalışma, Kodlama, Proje, Kitap Okuma
- ▶️ **Başlat/Duraklat/Sıfırla Butonları**: Tam kontrol
- 📱 **Dikkat Dağınıklığı Takibi**: Uygulamadan ayrıldığınızda otomatik tespit
- 💾 **Otomatik Kayıt**: Seans bilgileri otomatik olarak kaydedilir

### Raporlar Ekranı
- 📊 **Genel İstatistikler**:
  - Bugün toplam odaklanma süresi
  - Tüm zamanların toplam süresi
  - Toplam dikkat dağınıklığı sayısı
  - Toplam seans sayısı

- 📈 **Çubuk Grafik**: Son 7 günün odaklanma süreleri
- 🥧 **Pasta Grafik**: Kategorilere göre süre dağılımı
- 📝 **Son Seanslar**: Detaylı seans geçmişi

## 🛠️ Teknolojiler

- **React Native** - Mobil uygulama framework'ü
- **Expo** - Geliştirme ve build platformu
- **TypeScript** - Tip güvenliği
- **AsyncStorage** - Yerel veri depolama
- **React Native Chart Kit** - Grafik görselleştirme
- **AppState API** - Dikkat dağınıklığı takibi
- **Expo Router** - Navigasyon

## 📦 Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- npm veya yarn
- Expo CLI
- Expo Go uygulaması (telefonda test için)

### Adımlar

1. **Projeyi Klonlayın**
```bash
git clone [repository-url]
cd odaklanma-takip
```

2. **Bağımlılıkları Yükleyin**
```bash
npm install
```

3. **Uygulamayı Başlatın**
```bash
npx expo start
```

4. **Uygulamayı Test Edin**
   - Android: Expo Go uygulamasında QR kodu tarayın
   - iOS: Camera uygulamasıyla QR kodu tarayın
   - Web: Tarayıcıda `w` tuşuna basın
   - Android Emulator: `a` tuşuna basın
   - iOS Simulator: `i` tuşuna basın

## 📁 Proje Yapısı

```
odaklanma-takip/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab Navigator yapılandırması
│   │   ├── index.tsx         # Ana Sayfa (Zamanlayıcı)
│   │   └── explore.tsx       # Raporlar Ekranı
│   ├── _layout.tsx           # Root Layout
│   └── modal.tsx
├── components/
│   ├── themed-text.tsx       # Özelleştirilmiş metin bileşeni
│   ├── themed-view.tsx       # Özelleştirilmiş view bileşeni
│   └── ui/                   # UI bileşenleri
├── constants/
│   └── theme.ts              # Tema ve renk tanımlamaları
├── hooks/
│   ├── use-color-scheme.ts   # Dark/Light mode hook
│   └── use-theme-color.ts    # Tema renk hook
├── services/
│   └── storage.ts            # AsyncStorage servisi
├── types/
│   └── session.ts            # TypeScript tip tanımlamaları
├── app.json                  # Expo yapılandırması
├── package.json              # Proje bağımlılıkları
└── tsconfig.json             # TypeScript yapılandırması
```

## 🎯 Kullanım

### Odaklanma Seansı Başlatma

1. Ana sayfada bir kategori seçin
2. İstediğiniz süreyi seçin (varsayılan 25 dakika)
3. "Başlat" butonuna basın
4. Odaklanın! 🎯

### Dikkat Dağınıklığı

- Seans sırasında uygulamadan ayrılırsanız (başka uygulama açarsanız):
  - Dikkat dağınıklığı sayacı otomatik artar
  - Zamanlayıcı otomatik duralatılır
  - Uygulamaya döndüğünüzde "Devam Et" ile seansa devam edebilirsiniz

### Raporları İnceleme

1. Alt menüden "Raporlar" sekmesine gidin
2. Genel istatistiklerinizi görün
3. Son 7 günün grafiğini inceleyin
4. Kategorilere göre dağılımı görün
5. Son seanslarınızın detaylarını kontrol edin

## 🔧 Önemli Özellikler

### AppState API Kullanımı
```typescript
useEffect(() => {
  const subscription = AppState.addEventListener('change', nextAppState => {
    if (appStateRef.current.match(/active/) && 
        nextAppState === 'background' && 
        isRunning) {
      // Dikkat dağınıklığı tespit edildi
      setDistractionCount(prev => prev + 1);
      handlePause();
    }
    appStateRef.current = nextAppState;
  });
  return () => subscription.remove();
}, [isRunning]);
```

### Veri Depolama
```typescript
// Seans kaydetme
await storageService.saveSession({
  id: Date.now().toString(),
  category: selectedCategory,
  duration: duration,
  distractionCount: distractionCount,
  startTime: sessionStartTime,
  endTime: Date.now(),
  completed: true,
});

// Seansları getirme
const sessions = await storageService.getAllSessions();
const todaySessions = await storageService.getTodaySessions();
const weekSessions = await storageService.getLastWeekSessions();
```

## 📊 Veri Modeli

```typescript
interface FocusSession {
  id: string;
  category: string;
  duration: number;              // saniye cinsinden
  distractionCount: number;
  startTime: number;             // timestamp
  endTime: number;               // timestamp
  completed: boolean;
}
```

## 🎨 Özelleştirme

### Tema Renkleri
`constants/theme.ts` dosyasından tema renklerini özelleştirebilirsiniz:

```typescript
export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};
```

### Kategoriler
`types/session.ts` dosyasından kategorileri özelleştirebilirsiniz:

```typescript
export const SESSION_CATEGORIES: SessionCategory[] = [
  'Ders Çalışma',
  'Kodlama',
  'Proje',
  'Kitap Okuma',
];
```

## 🚀 Build

### Android APK
```bash
npx expo build:android
```

### iOS IPA
```bash
npx expo build:ios
```

### EAS Build (Önerilen)
```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

## 🐛 Bilinen Sorunlar ve Çözümler

1. **Grafiklerde veri görünmüyor**: Önce birkaç seans tamamlayın
2. **Zamanlayıcı arka planda durmuyorsa**: AppState izinlerinin verildiğinden emin olun
3. **Dark mode sorunları**: Cihazınızın tema ayarlarını kontrol edin

## 📝 Geliştirme Notları

### Yapılabilecek İyileştirmeler
- [ ] Bildirim desteği (seans bitince bildirim)
- [ ] Haftalık/Aylık hedefler
- [ ] Başarı rozetleri
- [ ] Arkadaşlarla karşılaştırma
- [ ] Özel ses efektleri
- [ ] Seans sırasında müzik çalma
- [ ] İstatistikleri dışa aktarma (CSV/PDF)
- [ ] Gün içinde en verimli saatleri gösterme

## 👥 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Proje Sahibi - [İsim]
Öğrenci No - [Numara]

## 🙏 Teşekkürler

- Expo ekibine harika platform için
- React Native topluluğuna
- BSM 447 dersi hocalarına

---

**Not**: Bu proje BSM 447 - Mobil Uygulama Geliştirme dersi için geliştirilmiştir.

Geliştirme Tarihi: Aralık 2025
