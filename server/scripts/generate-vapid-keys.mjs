import webpush from 'web-push';

const args = process.argv.slice(2);
const subjectArg = args.find((arg) => arg.startsWith('--subject='));
const envArg = args.find((arg) => arg.startsWith('--env='));
const jsonOutput = args.includes('--json');

const subject = subjectArg
  ? subjectArg.slice('--subject='.length)
  : 'mailto:dev@example.com';
const envName = envArg ? envArg.slice('--env='.length) : 'local';

const keys = webpush.generateVAPIDKeys();

if (jsonOutput) {
  console.log(JSON.stringify({
    environment: envName,
    subject,
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
    client: {
      VITE_VAPID_PUBLIC_KEY: keys.publicKey,
    },
    server: {
      VAPID_PUBLIC_KEY: keys.publicKey,
      VAPID_PRIVATE_KEY: keys.privateKey,
      VAPID_SUBJECT: subject,
    },
  }, null, 2));
  process.exit(0);
}

console.log(`Generated VAPID keys for ${envName}`);
console.log('');
console.log('Client env');
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log('');
console.log('Server env');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=${subject}`);
console.log('');
console.log('Guidance');
console.log('- Run this command once for local development and again for production.');
console.log('- Keep the private key only on the server.');
console.log('- Use a production-owned subject such as mailto:notifications@yourdomain.com.');
