import * as dotenv from 'dotenv';
dotenv.config();

console.log("SUNAT Env variables on server:");
for (const key of Object.keys(process.env)) {
  if (key.startsWith("SUNAT_")) {
    const val = process.env[key];
    console.log(`${key}: ${val ? (val.length > 4 ? val.substring(0, 3) + '...' + val.substring(val.length - 2) : '***') : 'undefined'}`);
  }
}
