# Panduan Sistem Keamanan Lokasi SDM

## Overview

Sistem keamanan lokasi SDM dirancang untuk melindungi integritas data presensi dengan mendeteksi dan mencegah penggunaan lokasi palsu (fake GPS) serta aktivitas mencurigakan lainnya.

## Fitur Utama

### 1. Real-time Location Monitoring

- **Monitoring Kontinyu**: Pemantauan lokasi secara real-time selama proses presensi
- **High Accuracy GPS**: Menggunakan GPS dengan akurasi tinggi untuk presisi maksimal
- **Location History**: Menyimpan riwayat pergerakan untuk analisis pola

### 2. Deteksi Fake GPS

#### A. Mock Location Detection

- **Android Detection**: Mendeteksi aplikasi mock location yang aktif
- **iOS Detection**: Mendeteksi simulator lokasi dan developer tools
- **System Flag Check**: Mengecek flag sistem yang menandakan mock location

#### B. Movement Pattern Analysis

- **Speed Validation**: Mendeteksi kecepatan tidak realistis (>120 km/h)
- **Instant Jump Detection**: Mendeteksi perpindahan lokasi yang tidak natural
- **Trajectory Analysis**: Menganalisis pola pergerakan untuk konsistensi

#### C. GPS Signal Validation

- **Accuracy Threshold**: Memvalidasi akurasi GPS (min. 50 meter)
- **Altitude Consistency**: Mengecek konsistensi data altitude
- **Signal Strength**: Menganalisis kekuatan sinyal GPS

#### D. Time-based Verification

- **Timestamp Validation**: Memvalidasi kesesuaian timestamp
- **Time Drift Detection**: Mendeteksi perbedaan waktu yang mencurigakan
- **Temporal Consistency**: Mengecek konsistensi temporal data lokasi

### 3. Security Scoring System

#### Confidence Level (0-100%)

- **90-100%**: Sangat Aman - Lokasi terverifikasi penuh
- **70-89%**: Aman - Lokasi dapat dipercaya
- **50-69%**: Moderate - Perlu perhatian
- **30-49%**: Tidak Aman - Berpotensi palsu
- **0-29%**: Sangat Tidak Aman - Kemungkinan besar palsu

#### Risk Level

- **LOW**: Tidak ada indikasi aktivitas mencurigakan
- **MEDIUM**: Ada beberapa indikator yang perlu diperhatikan
- **HIGH**: Terdeteksi aktivitas mencurigakan, presensi diblokir

### 4. Monitoring Dashboard Admin

#### Real-time Statistics

- Total aktivitas harian
- Distribusi risk level
- Confidence level rata-rata
- Pegawai dengan aktivitas mencurigakan

#### Historical Analysis

- Trend mingguan keamanan
- Analisis pola jam kerja
- Lokasi dengan risk tinggi
- Perbandingan departemen

## Konfigurasi

### Environment Variables

```env
# Koordinat kantor
NEXT_PUBLIC_OFFICE_LAT=-7.9797
NEXT_PUBLIC_OFFICE_LNG=112.6304
NEXT_PUBLIC_OFFICE_RADIUS=100

# Security thresholds
SECURITY_MIN_CONFIDENCE_LEVEL=60
SECURITY_MAX_GPS_ACCURACY=50
SECURITY_MAX_SPEED_KMH=120
SECURITY_AUTO_BLOCK_HIGH_RISK=true
```

### Database Configuration

```sql
-- Jalankan script ini untuk setup tabel security
source database/create_security_logs_table.sql;
```

## Implementasi

### 1. Frontend Integration

#### useLocationSecurity Hook

```javascript
import useLocationSecurity from "@/hooks/useLocationSecurity";

const {
	currentLocation,
	isLocationValid,
	securityStatus,
	startWatching,
	stopWatching,
} = useLocationSecurity({
	enableHighAccuracy: true,
	timeout: 10000,
	speedThreshold: 120,
	accuracyThreshold: 30,
});
```

#### SecureLocationMap Component

```javascript
import SecureLocationMap from "@/components/SecureLocationMap";

<SecureLocationMap
	onLocationVerified={setIsLocationValid}
	onSecurityStatusChange={handleSecurityStatusChange}
/>;
```

### 2. Backend Integration

#### API Attendance dengan Security

```javascript
// Validasi security data
const securityValidation = validateSecurityData(
	securityData,
	latitude,
	longitude
);

if (!securityValidation.isValid) {
	return NextResponse.json(
		{
			message: "Presensi ditolak karena masalah keamanan lokasi",
			error: "SECURITY_VALIDATION_FAILED",
		},
		{ status: 403 }
	);
}
```

## Security Logs

### Struktur Data

```sql
CREATE TABLE security_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pegawai VARCHAR(20) NOT NULL,
    tanggal DATE NOT NULL,
    action_type ENUM('CHECKIN', 'CHECKOUT') NOT NULL,
    confidence_level INT DEFAULT 0,
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'LOW',
    warnings JSON,
    gps_accuracy DECIMAL(10,2),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Contoh Log Entry

```json
{
	"id_pegawai": "EMP001",
	"action_type": "CHECKIN",
	"confidence_level": 85,
	"risk_level": "LOW",
	"warnings": ["GPS accuracy rendah: 75m"],
	"gps_accuracy": 75.5,
	"latitude": -7.9797,
	"longitude": 112.6304
}
```

## Monitoring & Analytics

### 1. Daily Security Report

- Total aktivitas presensi
- Distribusi risk level
- Pegawai dengan aktivitas mencurigakan
- Lokasi dengan anomali

### 2. Suspicious Activity Detection

- Pegawai dengan multiple high-risk incidents
- Pattern analysis untuk detecting spoofing
- Automatic alerting untuk admin

### 3. Performance Metrics

- Accuracy rate deteksi fake GPS
- False positive rate
- Response time sistem
- Coverage area monitoring

## Best Practices

### 1. Security Configuration

- Set confidence threshold minimal 60%
- Enable auto-block untuk high-risk activities
- Regular review suspicious employees list
- Update blacklist locations secara berkala

### 2. Monitoring

- Daily check security dashboard
- Weekly review suspicious activities
- Monthly analysis trend keamanan
- Quarterly update security parameters

### 3. User Education

- Training penggunaan GPS yang benar
- Awareness tentang bahaya fake GPS
- Reporting procedure untuk masalah lokasi
- Guidelines troubleshooting GPS issues

## Troubleshooting

### Common Issues

#### 1. GPS Accuracy Rendah

**Penyebab:**

- Indoor location
- Weather conditions
- Device hardware issues

**Solusi:**

- Move to outdoor area
- Wait for better signal
- Restart GPS/location services

#### 2. False Positive Detection

**Penyebab:**

- Poor GPS signal
- Device movement during check-in
- Network latency

**Solusi:**

- Improve GPS accuracy settings
- Stay stationary during check-in
- Check network connection

#### 3. High Risk False Alarms

**Penyebab:**

- Rapid movement before check-in
- Public transportation usage
- GPS drift

**Solusi:**

- Wait 30 seconds before check-in
- Use stationary location
- Calibrate device GPS

## API Endpoints

### Security Logs

```
GET /api/admin/security-logs
- Parameters: date, risk, search, limit, offset
- Returns: Paginated security logs with employee details
```

### Security Statistics

```
GET /api/admin/security-stats
- Parameters: date
- Returns: Daily statistics, trends, risk locations
```

### Suspicious Employees

```
GET /api/admin/suspicious-employees
- Parameters: days, min_high_risk, max_confidence
- Returns: List of employees with suspicious activities
```

## Future Enhancements

### 1. Machine Learning Integration

- Pattern recognition untuk detecting sophisticated spoofing
- Behavioral analysis pegawai
- Predictive modeling untuk risk assessment

### 2. Advanced Detection Methods

- WiFi fingerprinting
- Cellular tower triangulation
- Accelerometer data analysis
- Camera-based location verification

### 3. Mobile App Enhancements

- Biometric integration
- Device attestation
- Secure element utilization
- Enhanced anti-tampering measures

## Compliance & Privacy

### Data Protection

- Minimal data collection principle
- Encrypted storage untuk sensitive data
- Regular data cleanup (90 days retention)
- Access control untuk security logs

### Privacy Considerations

- Transparency tentang data collection
- User consent untuk location tracking
- Right to explanation untuk blocked attendance
- Regular privacy impact assessments

---

**Catatan:** Sistem ini dirancang untuk balance antara security dan user experience. Regular monitoring dan adjustment diperlukan untuk optimal performance.
