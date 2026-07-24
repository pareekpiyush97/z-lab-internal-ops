import bcrypt from 'bcryptjs';

// Usage: npm run hash-password -- "your-new-password"
// Prints a bcrypt hash you can paste straight into data/db.json for an
// admin user's passwordHash field (or use to update one via the API).

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash-password -- "your-new-password"');
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  console.log(hash);
});
