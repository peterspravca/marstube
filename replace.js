const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.0[568]\)/g, 'var(--button-bg)');
      content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.15?\)/g, 'var(--button-bg-hover)');
      content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.1\)/g, 'var(--border-glass-solid)');
      content = content.replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.2\)/g, 'var(--border-glass)');
      
      content = content.replace(/'white'/g, '"var(--text-primary)"');
      content = content.replace(/"white"/g, '"var(--text-primary)"');

      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir('src/components');
