export const translateAction = (action: string): string => {
    const actions: { [key: string]: string } = {
        'LOGIN': 'Giriş Yapıldı',
        'CREATE_CAR': 'Araç Eklendi',
        'UPDATE_CAR': 'Araç Güncellendi',
        'DELETE_CAR': 'Araç Silindi',
        'CANCEL_BOOKING': 'Rezervasyon İptal Edildi',
        'START_BOOKING': 'Kiralama Başlatıldı',
        'CREATE_MANUAL_BOOKING': 'Manuel Rezervasyon Oluşturuldu',
        'UPDATE_BOOKING_DATES': 'Rezervasyon Tarihleri Güncellendi',
        'COMPLETE_BOOKING': 'Kiralama Tamamlandı',
        'CREATE_USER': 'Kullanıcı Oluşturuldu',
        'DELETE_USER': 'Kullanıcı Silindi',
        'UPDATE_USER_ROLE': 'Kullanıcı Rolü Değiştirildi',
        'CREATE_CAMPAIGN': 'Kampanya Oluşturuldu',
        'UPDATE_CAMPAIGN': 'Kampanya Güncellendi',
        'DELETE_CAMPAIGN': 'Kampanya Silindi',
        'CREATE_INSURANCE': 'Sigorta Kaydı Eklendi',
        'DELETE_INSURANCE': 'Sigorta Kaydı Silindi',
        'UPDATE_FRANCHISE_STATUS': 'Franchise Başvuru Durumu Güncellendi',
        'MARK_ALL_NOTIFICATIONS_READ': 'Tüm Bildirimler Okundu Olarak İşaretlendi',
    };
    return actions[action] || action;
};

export const formatDetails = (action: string, details: string | null | undefined): string => {
    if (!details) return '-';
    try {
        const data = JSON.parse(details);

        switch (action) {
            case 'LOGIN':
                return `${data.email} adresi ile giriş yapıldı`;
            case 'CREATE_CAR':
                return `${data.brand} ${data.model} aracı sisteme eklendi`;
            case 'UPDATE_CAR':
                return `Araç güncellendi: ${data.brand} ${data.model} (${data.plate || data.carId})`;
            case 'DELETE_CAR':
                return `Araç sistemden silindi: ${data.brand} ${data.model} (${data.plate || data.carId})`;
            case 'CANCEL_BOOKING':
                return `${data.code} kodlu rezervasyon iptal edildi`;
            case 'START_BOOKING':
                return `${data.code} kodlu kiralama başlatıldı (Araç Teslim Edildi)`;
            case 'CREATE_MANUAL_BOOKING':
                return `${data.code} kodlu manuel rezervasyon oluşturuldu`;
            case 'UPDATE_BOOKING_DATES':
                return `Rezervasyon tarihleri güncellendi: ${data.bookingId}`;
            case 'COMPLETE_BOOKING':
                return `${data.code} kodlu kiralama tamamlandı (Araç Teslim Alındı)`;
            case 'CREATE_USER':
                return `${data.email} e-posta adresiyle yeni kullanıcı (${data.role === 'ADMIN' ? 'Yönetici' : 'Personel'}) oluşturuldu`;
            case 'DELETE_USER':
                return `Kullanıcı silindi: ${data.targetName} (${data.targetEmail || data.targetUserId})`;
            case 'UPDATE_USER_ROLE':
                const roleText = data.newRole === 'ADMIN' ? 'Yönetici' : 'Personel';
                return `Kullanıcı rolü "${roleText}" olarak güncellendi: ${data.targetName} (${data.targetEmail || data.targetUserId})`;
            case 'CREATE_CAMPAIGN':
                return `Yeni kampanya oluşturuldu: ${data.title}`;
            case 'UPDATE_CAMPAIGN':
                return `Kampanya güncellendi: ${data.title || data.campaignId}`;
            case 'DELETE_CAMPAIGN':
                return `Kampanya silindi: ${data.title || data.campaignId}`;
            case 'CREATE_INSURANCE':
                return `${data.companyName} firmasından ${data.policyNumber} nolu sigorta kaydı eklendi`;
            case 'DELETE_INSURANCE':
                return `Sigorta kaydı silindi: ${data.companyName} (${data.policyNumber})`;
            case 'UPDATE_FRANCHISE_STATUS':
                const statusMap: { [key: string]: string } = {
                    'APPROVED': 'Onaylandı',
                    'REJECTED': 'Reddedildi',
                    'PENDING': 'Beklemede'
                };
                const statusText = statusMap[data.newStatus] || data.newStatus;
                const identifier = data.companyName || data.applicantName || data.applicationId;
                return `Franchise başvurusu (${identifier}) durumu "${statusText}" olarak güncellendi`;
            default:
                return details;
        }
    } catch (e) {
        return details;
    }
};
