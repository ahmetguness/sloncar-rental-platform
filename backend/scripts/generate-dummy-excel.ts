import ExcelJS from 'exceljs';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

// Add the token here when we run the script or we can just mock a request to the backend bypassing auth if we do it directly using Supertest?
// Instead, let's create a temp file, and use curl or standard fetch.

async function generateDummyExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sigortalar');

    worksheet.columns = [
        { header: 'AY', key: 'month' },
        { header: 'BAŞLANGIÇ TARİHİ', key: 'startDate' },
        { header: 'TC', key: 'tcNo' },
        { header: 'İSİM / SOYİSİM', key: 'fullName' },
        { header: 'MESLEK', key: 'profession' },
        { header: 'CEP', key: 'phone' },
        { header: 'PLAKA', key: 'plate' },
        { header: 'SERİ NO / SIRA NO', key: 'serialOrOrderNo' },
        { header: 'TL', key: 'amount' },
        { header: 'BRANŞ', key: 'branch' },
        { header: 'ŞİRKET', key: 'company' },
        { header: 'POLİÇE NO', key: 'policyNo' },
        { header: 'AÇIKLAMA', key: 'description' },
    ];

    worksheet.addRow({
        month: 'OCAK',
        startDate: '2026-01-01T00:00:00.000Z',
        tcNo: '12345678901',
        fullName: 'Ahmet Yılmaz',
        profession: 'Mühendis',
        phone: '5551234567',
        plate: '34ABC123',
        serialOrOrderNo: 'Sira 123',
        amount: 1500.50,
        branch: 'KASKO',
        company: 'Anadolu Sigorta',
        policyNo: 'POL12345',
        description: 'Test policy 1',
    });

    worksheet.addRow({
        month: 'ŞUBAT',
        startDate: '2026-02-01T00:00:00.000Z',
        tcNo: '10987654321',
        fullName: 'Mehmet Demir',
        profession: 'Öğretmen',
        phone: '5559876543',
        plate: '06XYZ987',
        serialOrOrderNo: 'Sira 456',
        amount: 800.00,
        branch: 'TRAFIK',
        company: 'Allianz',
        policyNo: 'POL09876',
        description: 'Test policy 2',
    });

    // Invalid row (missing policyNo) 
    worksheet.addRow({
        month: 'MART',
        startDate: '2026-03-01',
        tcNo: '11111111111',
        fullName: 'Hatalı Kayıt',
        profession: '',
        phone: '',
        plate: '',
        serialOrOrderNo: '',
        amount: 500,
        branch: 'DASK',
        company: 'Güneş Sigorta',
        policyNo: '', // Missing
        description: 'Should fail',
    });

    const filePath = './test-insurance.xlsx';
    await workbook.xlsx.writeFile(filePath);
    console.log('Dummy Excel file created at', filePath);
}

generateDummyExcel().catch(console.error);
