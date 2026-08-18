const fs = require('fs');

const openapiPath = `C:\\Users\\rasal mm\\.gemini\\antigravity-ide\\brain\\ec18855a-7406-46ed-8000-4f57d6591f6d\\.system_generated\\steps\\632\\content.md`;
const content = fs.readFileSync(openapiPath, 'utf8');

const jsonStart = content.indexOf('{', content.indexOf('---'));
const jsonStr = content.substring(jsonStart);
const data = JSON.parse(jsonStr);

['PdfToMarkdownRequest', 'DocxToMarkdownRequest'].forEach(s => {
  const schemaObj = data.components.schemas[s];
  if (schemaObj) {
    console.log(`==========================================\nSCHEMA: ${s}\n==========================================`);
    console.log(JSON.stringify(schemaObj, null, 2));
  } else {
    console.log(`Schema not found: ${s}`);
  }
});
