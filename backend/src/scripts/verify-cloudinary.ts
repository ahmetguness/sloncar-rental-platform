import cloudinary from '../lib/cloudinary.js';

async function verifyConnection() {
    console.log('🔄 Cloudinary Bağlantısı Kontrol Ediliyor...');
    console.log('----------------------------------------');
    try {
        // Ping Cloudinary API
        const result = await cloudinary.api.ping();
        console.log('✅ BAŞARILI: Cloudinary bağlantısı sağlandı.');
        console.log('API Yanıtı:', result);

        // Check Cloud Configuration (Masked)
        const config = cloudinary.config();
        console.log('\nAktif Konfigürasyon:');
        console.log(`Cloud Name: ${config.cloud_name}`);
        console.log(`API Key:    ${config.api_key ? config.api_key.substring(0, 4) + '****' : 'YOK'}`);
        console.log(`API Secret: ${config.api_secret ? '****' + config.api_secret.substring(config.api_secret.length - 4) : 'YOK'}`);

    } catch (error: any) {
        console.error('❌ HATA: Cloudinary bağlantısı başarısız.');
        console.error('Ayrıntılar:', error.message || error);
        console.error('\nOlası Sebepler:');
        console.error('1. API Key veya API Secret yanlış.');
        console.error('2. Cloud Name yanlış.');
        console.error('3. İnternet bağlantısı yok.');
    }
}

verifyConnection();
