#!/usr/bin/env node

import PocketBase from 'pocketbase';
import { createInterface } from 'readline';

const pb = new PocketBase('http://127.0.0.1:8090');

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupGoogleOAuth() {
  try {
    console.log('🔐 Setting up Google OAuth for PocketBase...\n');
    
    // Authenticate as admin
    console.log('🔑 Authenticating as admin...');
    const adminEmail = await question('Admin email: ');
    const adminPassword = await question('Admin password: ');
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    console.log('✅ Admin authentication successful\n');

    // Get Google OAuth credentials from user
    console.log('📝 Please provide your Google OAuth credentials:');
    console.log('   (Get these from: https://console.cloud.google.com/apis/credentials)\n');
    
    const clientId = await question('Google Client ID: ');
    const clientSecret = await question('Google Client Secret: ');
    
    if (!clientId || !clientSecret) {
      console.log('❌ Both Client ID and Client Secret are required');
      process.exit(1);
    }

    // Get current settings
    console.log('\n🔧 Configuring Google OAuth...');
    const settings = await pb.settings.getAll();
    
    // Configure Google OAuth
    settings.googleAuth = {
      enabled: true,
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim()
    };

    // Update settings
    await pb.settings.update(settings);
    
    console.log('✅ Google OAuth configured successfully!');
    console.log('\n📋 Configuration:');
    console.log(`   Client ID: ${clientId.substring(0, 20)}...`);
    console.log('   Client Secret: [HIDDEN]');
    console.log('   Status: Enabled');
    
    console.log('\n🎉 Setup complete!');
    console.log('   You can now use "Continue with Google" in your app');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  } finally {
    rl.close();
  }
}

setupGoogleOAuth();