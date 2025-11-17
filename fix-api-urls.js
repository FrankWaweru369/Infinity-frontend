const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  './pages/profile/[username].js',
  './pages/dashboard.js',
  './pages/register.js', 
  './pages/login.js',
  './pages/reels.js',
  './context/PostsContext.js',
  './services/reelService.js'
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace hardcoded API URLs with config import and usage
    if (file === './services/reelService.js') {
      // Special handling for reelService.js
      if (!content.includes("import config from '../src/config'")) {
        content = content.replace(
          "import axios from 'axios';",
          "import axios from 'axios';\nimport config from '../src/config';"
        );
        content = content.replace(
          "const API_BASE = 'http://localhost:5000/api';",
          "const API_BASE = config.apiUrl;"
        );
      }
    } else {
      // For other files, replace localhost URLs with config.apiUrl
      content = content.replace(/'http:\/\/localhost:5000\/api'/g, "config.apiUrl");
      content = content.replace(/"http:\/\/localhost:5000\/api"/g, "config.apiUrl");
      content = content.replace(/`http:\/\/localhost:5000\/api/g, "`${config.apiUrl}");
      
      // Add config import if not present
      if (content.includes('config.apiUrl') && !content.includes("import config from '../src/config'")) {
        // Find a good place to add the import (usually after existing imports)
        const importMatch = content.match(/(import.*from.*\n)+/);
        if (importMatch) {
          content = content.replace(
            importMatch[0],
            importMatch[0] + "import config from '../src/config';\n"
          );
        }
      }
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Updated: ${file}`);
  } else {
    console.log(`❌ File not found: ${file}`);
  }
});

console.log('\n🎉 All files updated! Please verify the changes manually.');
