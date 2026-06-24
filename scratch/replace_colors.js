const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  files = fs.readdirSync(dir);
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

const files = walkSync('C:/Users/pc/Downloads/saccosphere-platform/apps/member-app/app');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace consts
  content = content.replace(/const GREEN = '#0d7a4e'/g, "const NAVY = '#0a192f'");
  content = content.replace(/const GREEN = '#0D7A4E'/g, "const NAVY = '#0a192f'");
  content = content.replace(/const GREEN_LIGHT = '#e6f7f1'/g, "const MINT_LIGHT = '#d1fae5'");
  
  // Replace usages of GREEN
  content = content.replace(/\bGREEN\b/g, 'NAVY');
  content = content.replace(/\bGREEN_LIGHT\b/g, 'MINT_LIGHT');
  
  // Replace inline hex codes
  content = content.replace(/'#0d7a4e'/gi, "'#0a192f'");
  content = content.replace(/'#e6f7f1'/gi, "'#d1fae5'");
  content = content.replace(/'#084d32'/gi, "'#020617'");
  content = content.replace(/'#5dcaa5'/gi, "'#10b981'"); // Active state mint
  content = content.replace(/'#f0faf6'/gi, "'#ede9fe'"); // Violet light
  
  fs.writeFileSync(file, content, 'utf8');
});
console.log('Done replacing colors in member-app/app');
