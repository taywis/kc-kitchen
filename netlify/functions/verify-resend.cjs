const { Resend } = require('resend');

async function verifyResend() {
  try {
    console.log('Verifying Resend API key...');
    console.log('API Key (first 10 chars):', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
    
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not found in environment variables');
      return;
    }
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Test 1: Try to get domains (this should work if API key is valid)
    try {
      console.log('\nTest 1: Checking domains...');
      const domains = await resend.domains.list();
      console.log('Domains response:', domains);
    } catch (error) {
      console.log('Domains test failed:', error.message);
    }
    
    // Test 2: Try to send a simple email
    try {
      console.log('\nTest 2: Sending test email...');
      const result = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: ['hosting@wgmtx.com'],
        subject: 'Resend API Test',
        html: '<p>This is a test email to verify the Resend API is working.</p>'
      });
      
      console.log('Email send result:', result);
      console.log('Result type:', typeof result);
      console.log('Result keys:', Object.keys(result || {}));
      console.log('Full result:', JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.log('Email send test failed:', error.message);
      console.log('Error details:', error);
    }
    
  } catch (error) {
    console.error('Verification failed:', error);
  }
}

verifyResend(); 