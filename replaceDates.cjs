const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const files = walkSync('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace new Date(X).toLocaleDateString('ar-SA') with formatHijriDate(X)
  const regex1 = /new Date\(([^)]+)\)\.toLocaleDateString\('ar-SA'\)/g;
  if (regex1.test(content)) {
    content = content.replace(regex1, 'formatHijriDate($1)');
    changed = true;
  }

  // Replace new Date().toLocaleDateString('ar-SA') with formatHijriDate(new Date())
  const regex2 = /new Date\(\)\.toLocaleDateString\('ar-SA'\)/g;
  if (regex2.test(content)) {
    content = content.replace(regex2, 'formatHijriDate(new Date())');
    changed = true;
  }
  
  // Replace new Date(X).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
  // with formatHijriDateTime(X) or just the time part? The prompt says "في شاشة التوثيق (Audit Trail): اعرض التاريخ بالهجري، وبجانبه الوقت بصيغة 12 ساعة".
  // For other places, maybe just keep it or replace it? Let's check where toLocaleTimeString is used.

  if (changed) {
    // Add import if not present
    if (!content.includes('formatHijriDate') && !content.includes('formatHijriDateTime')) {
       // Wait, the regex already added formatHijriDate.
    }
    if (content.includes('formatHijriDate') && !content.includes("import { formatHijriDate")) {
      // Find the last import statement
      const importRegex = /import .* from '.*';/g;
      let match;
      let lastIndex = 0;
      while ((match = importRegex.exec(content)) !== null) {
        lastIndex = importRegex.lastIndex;
      }
      
      // Calculate relative path to src/utils/dateUtils
      const depth = file.split(path.sep).length - 2; // src/pages/File.tsx -> depth 1
      const prefix = depth === 0 ? './' : '../'.repeat(depth);
      const importStmt = `\nimport { formatHijriDate } from '${prefix}utils/dateUtils';`;
      
      content = content.slice(0, lastIndex) + importStmt + content.slice(lastIndex);
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
