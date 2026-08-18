const fs = require('fs');

const openapiPath = `C:\\Users\\rasal mm\\.gemini\\antigravity-ide\\brain\\ec18855a-7406-46ed-8000-4f57d6591f6d\\.system_generated\\steps\\632\\content.md`;
const content = fs.readFileSync(openapiPath, 'utf8');

const jsonStart = content.indexOf('{', content.indexOf('---'));
const jsonStr = content.substring(jsonStart);
const data = JSON.parse(jsonStr);

// Search for schema details related to pdf-to-markdown or response types
const keys = Object.keys(data.components.schemas);
console.log("Searching schemas...");
keys.forEach(k => {
  if (k.toLowerCase().includes('markdown') || k.toLowerCase().includes('convert')) {
    console.log(`Schema found: ${k}`);
    console.log(JSON.stringify(data.components.schemas[k], null, 2));
  }
});
