const fs = require('fs');

const openapiPath = `C:\\Users\\rasal mm\\.gemini\\antigravity-ide\\brain\\ec18855a-7406-46ed-8000-4f57d6591f6d\\.system_generated\\steps\\632\\content.md`;
const content = fs.readFileSync(openapiPath, 'utf8');

const jsonStart = content.indexOf('{', content.indexOf('---'));
const jsonStr = content.substring(jsonStart);
const data = JSON.parse(jsonStr);

['/v1/convert/pdf-to-markdown', '/v1/convert/docx-to-markdown'].forEach(p => {
  const pathObj = data.paths[p];
  if (pathObj && pathObj.post && pathObj.post.responses && pathObj.post.responses['200']) {
    console.log(`==========================================\nPATH: ${p} RESPONSE\n==========================================`);
    console.log(JSON.stringify(pathObj.post.responses['200'], null, 2));
  } else {
    console.log(`No details for path: ${p}`);
  }
});
