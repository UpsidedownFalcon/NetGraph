import bcrypt from "bcryptjs";

// Usage: npm run hash-password "your-password-here"
// Prints a base64-encoded bcrypt hash to paste into .env.local.
const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash-password "your-password-here"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
// Base64-encode the hash so the $ characters in it can't be mangled by shells
// or .env parsers.
const b64 = Buffer.from(hash, "utf8").toString("base64");
console.log("\nAdd this line to your .env.local (no quotes needed):\n");
console.log(`APP_PASSWORD_HASH_B64=${b64}\n`);
