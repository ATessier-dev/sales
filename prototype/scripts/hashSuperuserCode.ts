import { hashCode } from "../lib/auth-utils";

// Génère la valeur à mettre dans SUPERUSER_CODE_HASH (voir lib/auth/superuserCode.ts)
// pour un code superuser donné. Usage : npm run hash:superuser-code -- MonCode123
const code = process.argv[2];

if (!code) {
  console.error("Usage: npm run hash:superuser-code -- <code>");
  process.exitCode = 1;
} else {
  hashCode(code).then((hash) => {
    console.log(hash);
  });
}
