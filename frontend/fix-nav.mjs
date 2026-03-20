import fs from 'fs';
import { execSync } from 'child_process';

const paths = ['Register.tsx', 'Profile.tsx', 'Login.tsx'];
for (const p of paths) {
  const fullPath = `src/_pages/${p}`;
  
  try {
    let orig = execSync(`git show HEAD:frontend/src/pages/${p}`).toString();
    
    if (!orig.includes('"use client"')) {
        orig = '"use client";\n' + orig;
    }
    
    orig = orig.replace(/useNavigate\(\)/g, 'useRouter()');
    orig = orig.replace(/import \{.*?(useNavigate).*?\} from 'react-router-dom';/g, "import { useRouter } from 'next/navigation';\nimport { Link } from 'react-router-dom'; // keep if needed");
    
    // Some manual cleanup if Link is used but react-router-dom is gone
    orig = orig.replace(/<Link to=/g, '<Link href=');
    orig = orig.replace(/import \{ Link \} from 'react-router-dom';/g, "import Link from 'next/link';");
    orig = orig.replace(/import \{.*?Link.*?\} from 'react-router-dom';/g, "import Link from 'next/link';");
    
    orig = orig.replace(/navigate\((['"`].*?['"`]),\s*\{\s*replace:\s*true\s*\}\)/g, (match, p1) => `navigate.replace(${p1})`);
    orig = orig.replace(/navigate\((['"`].*?['"`])\)/g, (match, p1) => `navigate.push(${p1})`);
    
    orig = orig.replace(/navigate\.replace\(\)/g, "navigate.replace('/')");
    orig = orig.replace(/navigate\.push\(\)/g, "navigate.push('/')");
    
    fs.writeFileSync(fullPath, orig);
    console.log('Fixed ' + fullPath);
  } catch(e) {
    console.error('Failed on ' + p, e.message);
  }
}
