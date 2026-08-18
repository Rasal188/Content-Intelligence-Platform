const fs = require('fs');

const openapiPath = `C:\\Users\\rasal mm\\.gemini\\antigravity-ide\\brain\\ec18855a-7406-46ed-8000-4f57d6591f6d\\.system_generated\\steps\\632\\content.md`;
const content = fs.readFileSync(openapiPath, 'utf8');

const jsonStart = content.indexOf('{', content.indexOf('---'));
const jsonStr = content.substring(jsonStart);
const data = JSON.parse(jsonStr);

const targetPaths = [
  '/v1/aeo/page-audit',
  '/v1/aeo/citation-readiness',
  '/v1/extract/document',
  '/v1/text/similarity',
  '/v1/actors/ats/detect'
];

targetPaths.forEach(p => {
  const pathObj = data.paths[p];
  if (pathObj) {
    console.log(`==========================================\nPATH: ${p}\n==========================================`);
    console.log(JSON.stringify(pathObj, null, 2));
  } else {
    console.log(`Path not found: ${p}`);
  }
});
