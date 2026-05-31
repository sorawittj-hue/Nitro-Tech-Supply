import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.css')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // Replace font-size: 10px -> 12px, 11px -> 13px, 12px -> 14px in css and tsx (inline styles)
  // For css: font-size: 10px;
  // For tsx: fontSize: '10px'
  
  const replacements = [
    { from: /font-size:\s*10px/g, to: 'font-size: 12px' },
    { from: /font-size:\s*11px/g, to: 'font-size: 13px' },
    { from: /font-size:\s*12px/g, to: 'font-size: 14px' },
    { from: /fontSize:\s*'10px'/g, to: "fontSize: '12px'" },
    { from: /fontSize:\s*'11px'/g, to: "fontSize: '13px'" },
    { from: /fontSize:\s*'12px'/g, to: "fontSize: '14px'" },
  ];
  
  replacements.forEach(r => {
    if (r.from.test(content)) {
      content = content.replace(r.from, r.to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated font sizes in:', file);
  }
});
