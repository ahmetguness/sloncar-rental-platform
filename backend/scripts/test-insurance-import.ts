import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTest() {
    try {
        console.log('Logging in as admin to get token...');
        const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        console.log("Admin user found:", user);

        let loginRes;
        if (user) {
            loginRes = await axios.post('http://localhost:3000/api/auth/login', {
                email: user.email,
                password: 'sloncar'
            });
        }

        if (!loginRes) throw new Error("Could not login");
        const token = loginRes.data.data.token;
        console.log('Got token:', token.substring(0, 20) + '...');

        console.log('Uploading Excel file...');
        const form = new FormData();
        const filePath = path.resolve('test-insurance.xlsx');
        form.append('file', fs.createReadStream(filePath));

        const importRes = await axios.post('http://localhost:3000/api/admin/insurances/import', form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Import Response:', importRes.data);

        console.log('Testing Export...');
        const exportRes = await axios.get('http://localhost:3000/api/admin/insurances/export', {
            headers: {
                Authorization: `Bearer ${token}`
            },
            responseType: 'arraybuffer'
        });

        const outPath = path.resolve('exported-insurances.xlsx');
        fs.writeFileSync(outPath, exportRes.data);
        console.log('Exported file saved to:', outPath);

    } catch (err: any) {
        console.error('Test failed:', err.response?.data || err.message);
    }
}

runTest();
