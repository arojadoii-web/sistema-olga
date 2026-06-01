import * as fs from 'fs';

const content = fs.readFileSync('signed_test.xml', 'utf8');
const lines = content.split('\n');
const line = lines.find(l => l.includes('cbc:UBLVersionID'));
if (line) {
  console.log("Found line:", JSON.stringify(line));
  console.log("Length:", line.length);
  const chars = [];
  for (let i = 0; i < line.length; i++) {
    chars.push({ char: line[i], hex: line.charCodeAt(i).toString(16).toUpperCase() });
  }
  console.log("Character breakdown:");
  console.log(chars);
} else {
  console.log("Lines containing cbc:UBLVersionID not found!");
}
