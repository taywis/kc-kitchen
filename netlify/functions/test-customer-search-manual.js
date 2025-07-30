const { SquareClient, SquareEnvironment } = require('square');
const { randomUUID } = require('crypto');

// Initialize Square client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

// Helper function to handle BigInt serialization
function jsonReplacer(key, value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  };

  try {
    console.log('=== TESTING MANUAL CUSTOMER SEARCH ===');
    
    // Get email from query parameters or use a test email
    const email = event.queryStringParameters?.email || 'manual.search@example.com';
    console.log('Searching for customer with email:', email);
    
    // Step 1: List all customers using SDK
    console.log('Step 1: Listing all customers using SDK...');
    console.log('SDK client methods:', Object.getOwnPropertyNames(client.customers));
    console.log('SDK customers client:', typeof client.customers);
    console.log('SDK customers list method:', typeof client.customers.list);
    
    let result;
    try {
      result = await client.customers.list();
      console.log('Raw SDK result:', JSON.stringify(result, jsonReplacer, 2));
    } catch (error) {
      console.log('SDK list failed:', error.message);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'SDK list failed',
          message: error.message
        })
      };
    }
    
    console.log('List customers response:', {
      hasCustomers: !!result.data,
      customerCount: result.data?.length || 0,
      cursor: result.cursor
    });
    
    // Step 2: Filter through customers to find matching email
    console.log('Step 2: Filtering customers for email match...');
    let matchingCustomer = null;
    let allCustomers = [];
    
    if (result.data && result.data.length > 0) {
      allCustomers = result.data;
      
      // Search for exact email match (case-insensitive)
      matchingCustomer = result.data.find(customer => 
        customer.emailAddress && customer.emailAddress.toLowerCase() === email.toLowerCase()
      );
      
      if (matchingCustomer) {
        console.log('✅ Found matching customer:', {
          id: matchingCustomer.id,
          email: matchingCustomer.emailAddress,
          name: `${matchingCustomer.givenName || ''} ${matchingCustomer.familyName || ''}`.trim(),
          phone: matchingCustomer.phoneNumber || 'N/A'
        });
      } else {
        console.log('❌ No matching customer found');
        
        // Show all customer emails for debugging
        console.log('All customer emails:');
        result.data.forEach((customer, index) => {
          console.log(`${index + 1}. ${customer.emailAddress || 'NO EMAIL'} (ID: ${customer.id})`);
        });
      }
    } else {
      console.log('No customers found in response');
    }
    
    // Step 3: Return results
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        searchEmail: email,
        totalCustomers: allCustomers.length,
        matchingCustomer: matchingCustomer ? {
          id: matchingCustomer.id,
          email: matchingCustomer.emailAddress,
          givenName: matchingCustomer.givenName,
          familyName: matchingCustomer.familyName,
          phoneNumber: matchingCustomer.phoneNumber,
          createdAt: matchingCustomer.createdAt,
          updatedAt: matchingCustomer.updatedAt
        } : null,
        allCustomers: allCustomers.map(customer => ({
          id: customer.id,
          email: customer.emailAddress,
          givenName: customer.givenName,
          familyName: customer.familyName,
          phoneNumber: customer.phoneNumber,
          createdAt: customer.createdAt
        })),
        message: matchingCustomer ? 'Customer found' : 'No matching customer found'
      })
    };
    
  } catch (error) {
    console.error('Error in manual customer search:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
}; 