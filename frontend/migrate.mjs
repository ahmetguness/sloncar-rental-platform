import fs from 'fs';
import path from 'path';

const APP_DIR = path.join(process.cwd(), 'src', 'app');
const PAGES_DIR = path.join(process.cwd(), 'src', 'pages');

const routes = [
  { path: 'second-hand', component: 'SecondHand' },
  { path: 'car/[id]', component: 'CarDetail', isDynamic: true, dynamicFolder: '../..' },
  { path: 'book/[carId]', component: 'Booking', isDynamic: true, dynamicFolder: '../..' },
  { path: 'my-booking', component: 'MyBooking' },
  { path: 'franchise', component: 'Franchise' },
  { path: 'about', component: 'About' },
  { path: 'login', component: 'Login' },
  { path: 'profile', component: 'Profile' },
  { path: 'admin/login', component: 'AdminLogin', dynamicFolder: '../..' },
  { path: 'admin/dashboard', component: 'AdminDashboard', dynamicFolder: '../..' },
  { path: 'admin/cars/rental', component: 'AdminRentalCars', dynamicFolder: '../../..' },
  { path: 'admin/cars/sale', component: 'AdminSaleCars', dynamicFolder: '../../..' },
  { path: 'admin/campaigns', component: 'AdminCampaigns', dynamicFolder: '../..' },
  { path: 'admin/audit-logs', component: 'AuditLogs', dynamicFolder: '../..' },
  { path: 'admin/backup', component: 'AdminBackup', dynamicFolder: '../..' },
  { path: 'admin/users', component: 'AdminUsers', dynamicFolder: '../..' }
];

// Create layout.tsx for admin (optional) or just use the root layout
// Creating routes
routes.forEach(route => {
  const dirPath = path.join(APP_DIR, ...route.path.split('/'));
  fs.mkdirSync(dirPath, { recursive: true });
  
  const relativeImportPath = route.dynamicFolder || '..';
  const content = `import { ${route.component} } from '${relativeImportPath}/pages/${route.component}';

export default function Page() {
  return <${route.component} />;
}
`;
  fs.writeFileSync(path.join(dirPath, 'page.tsx'), content);
});

// A robust search and replace for react-router-dom
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Ensure "use client" in client components
      if (!content.includes('"use client"') && !content.includes("'use client'")) {
        // Skip index.ts, types, etc. if needed, but safe to just add it
        content = `"use client";\n` + content;
        changed = true;
      }

      if (content.includes('react-router-dom')) {
        changed = true;
        
        // Very basic replacements
        content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react-router-dom['"];?/g, (match, importsStr) => {
          const imports = importsStr.split(',').map(i => i.trim());
          let nextImports = [];
          
          if (imports.includes('Link')) {
            nextImports.push(`import Link from 'next/link';`);
          }
          
          const navImports = [];
          if (imports.includes('useNavigate')) navImports.push('useRouter');
          if (imports.includes('useLocation')) navImports.push('usePathname', 'useSearchParams');
          if (imports.includes('useParams')) navImports.push('useParams');
          
          if (navImports.length > 0) {
            nextImports.push(`import { ${navImports.join(', ')} } from 'next/navigation';`);
          }

          // If there are other things like Routes, Route, BrowserRouter, we can strip them or just ignore them since we are replacing App.tsx logic anyway.
          
          return nextImports.join('\n');
        });

        // Replace hook usage
        content = content.replace(/useNavigate\(\)/g, 'useRouter()');
        content = content.replace(/useLocation\(\)/g, 'usePathname()'); 
        
        // Replace <Link to= with <Link href=
        content = content.replace(/<Link\s+([^>]*)to=/g, '<Link $1href=');
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDirectory(path.join(process.cwd(), 'src', 'pages'));
processDirectory(path.join(process.cwd(), 'src', 'components'));

console.log('Routes migrated successfully!');
