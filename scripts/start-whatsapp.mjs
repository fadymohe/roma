import 'dotenv/config';
import { initWhatsApp, MERCHANT_PHONE } from '../lib/whatsapp-bridge.js';

console.log('🚀 Starting WhatsApp Bridge service for merchant number +' + MERCHANT_PHONE + '...');
initWhatsApp();
