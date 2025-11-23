import { config } from '../config/env';
import { getVapidPublicKey } from '../utils/webPush';

console.log('🔍 Checking VAPID configuration...\n');

console.log('VAPID Subject:', config.vapid.subject);
console.log('VAPID Public Key:', config.vapid.publicKey ? '✅ Set' : '❌ Missing');
console.log('VAPID Private Key:', config.vapid.privateKey ? '✅ Set' : '❌ Missing');

if (!config.vapid.publicKey || !config.vapid.privateKey) {
    console.log('\n❌ VAPID keys are missing!');
    console.log('\n📝 To generate VAPID keys, run:');
    console.log('   npx web-push generate-vapid-keys');
    console.log('\nThen add them to your .env file:');
    console.log('   VAPID_PUBLIC_KEY=<your-public-key>');
    console.log('   VAPID_PRIVATE_KEY=<your-private-key>');
    console.log('   VAPID_SUBJECT=mailto:your-email@example.com');
} else {
    console.log('\n✅ VAPID keys are configured!');
    console.log('\nPublic Key (for SDK):');
    console.log(getVapidPublicKey());
}

process.exit(0);
