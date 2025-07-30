const { Resend } = require('resend');

async function testResend() {
  try {
    console.log('Testing Resend API...');
    console.log('API Key (first 10 chars):', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
    
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not found in environment variables');
      console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('RESEND')));
      return;
    }
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['hosting@wgmtx.com'],
      subject: 'Test Email from KC Kitchen',
      html: '<p>This is a test email to verify Resend is working correctly.</p>'
    });
    
    console.log('Resend API Response:', result);
    console.log('Email ID:', result?.id || result?.data?.id || 'No ID found');
    console.log('Success!');
    
  } catch (error) {
    console.error('Resend API Error:', error);
    console.error('Error details:', error.message);
  }
}

testResend(); 