import fs from 'fs';
import path from 'path';

const APP_DIR = path.join(process.cwd(), 'src', 'app');

function fixDirectory(dir, depth) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixDirectory(fullPath, depth + 1);
    } else if (file === 'page.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Calculate depth from app/ directory.
      // If depth=0 (src/app/page.tsx), it needs '../pages/...'
      // If depth=1 (src/app/about/page.tsx), it needs '../../pages/...'
      // If depth=2 (src/app/admin/login/page.tsx), it needs '../../../pages/...'
      let relativePrefix = '../';
      for (let i = 0; i < depth; i++) {
        relativePrefix += '../';
      }
      
      content = content.replace(/from\s+['"].*?\/pages\//g, `from '${relativePrefix}_pages/`);
      fs.writeFileSync(fullPath, content);
      console.log(`Fixed ${fullPath} with prefix ${relativePrefix}`);
    }
  }
}

// src/app has depth 0
fixDirectory(APP_DIR, 0);
