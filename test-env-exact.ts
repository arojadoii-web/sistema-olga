import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();

console.log("=== Environment Variables Exact Check ===");
const vars = ['SUNAT_RUC', 'SUNAT_USERNAME', 'SUNAT_PASSWORD', 'SUNAT_ENVIRONMENT'];
for (const v of vars) {
  const value = process.env[v];
  if (value === undefined) {
    console.log(`${v}: undefined`);
  } else {
    console.log(`${v}: length=${value.length}, value=${JSON.stringify(value)}`);
  }
}

console.log("\n=== Working Directory Check ===");
console.log("process.cwd():", process.cwd());
const certRelativePath = path.join(process.cwd(), 'certs', 'certificate.p12');
console.log("certRelativePath:", certRelativePath);
console.log("fs.existsSync(certRelativePath):", fs.existsSync(certRelativePath));

if (fs.existsSync(path.join(process.cwd(), 'certs'))) {
  console.log("Contents of certs folder:", fs.readdirSync(path.join(process.cwd(), 'certs')));
} else {
  console.log("certs folder does not exist at", path.join(process.cwd(), 'certs'));
}

