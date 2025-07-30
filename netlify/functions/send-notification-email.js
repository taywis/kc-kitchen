const { Resend } = require('resend');

// Initialize Resend client
let resend = null;
try {
  if (process.env.RESEND_API_KEY) {
    console.log('Initializing Resend with API key:', process.env.RESEND_API_KEY.substring(0, 10) + '...');
    resend = new Resend(process.env.RESEND_API_KEY);
  } else {
    console.log('RESEND_API_KEY not found - email notifications will be skipped');
  }
} catch (error) {
  console.log('Failed to initialize Resend client:', error.message);
}

// Send notification email to hosting@wgmtx.com
async function sendNotificationEmail(invoiceData, customerData, orderData) {
  try {
    console.log('Sending notification email for invoice:', invoiceData.id);
    
    // Check if Resend is configured
    if (!resend) {
      console.log('Resend not configured - skipping email notification');
      return {
        success: false,
        error: 'RESEND_API_KEY not configured',
        message: 'Email notifications are not configured. Please add RESEND_API_KEY to your environment variables.'
      };
    }
    
    const customerName = customerData?.givenName && customerData?.familyName 
      ? `${customerData.givenName} ${customerData.familyName}`
      : customerData?.givenName || customerData?.familyName || 'Guest Customer';
    
    const eventDate = invoiceData.saleOrServiceDate 
      ? new Date(invoiceData.saleOrServiceDate + 'T00:00:00').toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'TBD';
    
    const totalAmount = orderData?.totalMoney?.amount 
      ? `$${(Number(orderData.totalMoney.amount) / 100).toFixed(2)}`
      : 'TBD';
    
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Catering Invoice Created</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .label { font-weight: bold; color: #555; }
        .value { margin-left: 10px; }
        .highlight { background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; }
        .action-button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold; }
        .action-button:hover { background-color: #0056b3; }
        .urgent { background-color: #f8d7da; border-left: 4px solid #dc3545; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🎉 New Catering Invoice Created</h2>
            <p>A new catering invoice has been created and requires your attention.</p>
        </div>
        
        <div class="section">
            <h3>📋 Invoice Details</h3>
            <p><span class="label">Invoice ID:</span><span class="value">${invoiceData.id}</span></p>
            <p><span class="label">Invoice Title:</span><span class="value">${invoiceData.title}</span></p>
            <p><span class="label">Total Amount:</span><span class="value">${totalAmount}</span></p>
            <p><span class="label">Status:</span><span class="value">Draft</span></p>
        </div>
        
        <div class="section">
            <h3>👤 Customer Information</h3>
            <p><span class="label">Name:</span><span class="value">${customerName}</span></p>
            <p><span class="label">Email:</span><span class="value">${customerData?.emailAddress || 'Not provided'}</span></p>
            <p><span class="label">Phone:</span><span class="value">${customerData?.phoneNumber || 'Not provided'}</span></p>
            <p><span class="label">Customer ID:</span><span class="value">${customerData?.id || 'N/A'}</span></p>
        </div>
        
        <div class="section">
            <h3>📅 Event Information</h3>
            <p><span class="label">Event Date:</span><span class="value">${eventDate}</span></p>
            <p><span class="label">Order ID:</span><span class="value">${orderData?.id || 'N/A'}</span></p>
        </div>
        
        <div class="highlight urgent">
            <h3>🚨 ACTION REQUIRED</h3>
            <p><strong>Please review and approve this invoice:</strong></p>
            <a href="https://squareup.com/dashboard/sales/invoices/${invoiceData.id}" class="action-button" target="_blank">
                📋 View Invoice in Square Dashboard
            </a>
            <p style="margin-top: 15px;"><strong>Next Steps:</strong></p>
            <ol>
                <li><strong>Review</strong> the invoice details in Square Dashboard</li>
                <li><strong>Approve</strong> the invoice if everything looks correct</li>
                <li><strong>Send</strong> the invoice to the customer</li>
                <li><strong>Follow up</strong> with the customer regarding payment</li>
            </ol>
        </div>
        
        <div class="section">
            <h3>🔗 Quick Links</h3>
            <p><a href="https://squareup.com/dashboard/sales/invoices/${invoiceData.id}" target="_blank">📋 View Invoice in Square</a></p>
            <p><a href="https://squareup.com/dashboard/customers/${customerData?.id || ''}" target="_blank">👤 View Customer Profile</a></p>
            <p><a href="https://squareup.com/dashboard/orders/${orderData?.id || ''}" target="_blank">📦 View Order Details</a></p>
        </div>
        
        <div class="footer">
            <p>This notification was sent automatically by the KC Kitchen catering system.</p>
            <p>Invoice created at: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `;
    
    const emailData = {
      from: 'notifications@kcc.wgmtx.net', // Use your verified domain
      to: ['hosting@wgmtx.com'], // Now we can send to any email address
      subject: `New Catering Invoice: ${customerName} - ${eventDate}`,
      html: emailContent
    };
    
    console.log('Sending email with data:', {
      to: emailData.to,
      subject: emailData.subject,
      customerName,
      invoiceId: invoiceData.id
    });
    
    const result = await resend.emails.send(emailData);
    console.log('Email send result:', result);
    console.log('Email result type:', typeof result);
    console.log('Email result keys:', Object.keys(result || {}));
    console.log('Full result object:', JSON.stringify(result, null, 2));
    
    // Check if there was an error
    if (result && result.error) {
      console.error('Email send failed:', result.error);
      return {
        success: false,
        error: result.error.error || result.error.message || 'Unknown error',
        message: 'Failed to send notification email'
      };
    }
    
    // Handle successful response
    let emailId = 'sent';
    if (result && typeof result === 'object') {
      if (result.id) {
        emailId = result.id;
      } else if (result.data && result.data.id) {
        emailId = result.data.id;
      } else if (result.messageId) {
        emailId = result.messageId;
      } else if (result.message) {
        emailId = 'sent';
      }
    }
    
    return {
      success: true,
      emailId: emailId,
      message: 'Notification email sent successfully'
    };
    
  } catch (error) {
    console.error('Failed to send notification email:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send notification email'
    };
  }
}

module.exports = { sendNotificationEmail }; 