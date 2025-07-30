const { SquareClient, SquareEnvironment } = require('square');

// Initialize Square client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('Testing customer creation...');
    
    // Check what's available on the client
    console.log('Client object keys:', Object.keys(client));
    console.log('Client properties:', Object.getOwnPropertyNames(client));
    
    // Check if customers property exists
    console.log('client.customers exists:', !!client.customers);
    if (client.customers) {
      console.log('Customers client methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(client.customers)));
      console.log('Customers client keys:', Object.keys(client.customers));
    }
    
    // Try to create a customer using the correct Square API structure
    const customerRequest = {
      idempotency_key: require('crypto').randomUUID(),
      given_name: 'Test',
      family_name: 'Customer',
      email_address: 'test@example.com',
      reference_id: `TEST-${Date.now()}`,
      note: 'Test customer'
    };
    
    console.log('Customer request:', customerRequest);
    
    let customerId = null;
    let error = null;
    
    // Method 1: Try client.customers.create
    try {
      console.log('Trying client.customers.create...');
      if (client.customers) {
        const customerResult = await client.customers.create(customerRequest);
        console.log('Customer created via client.customers.create:', customerResult.result.customer.id);
        customerId = customerResult.result.customer.id;
      } else {
        console.log('client.customers does not exist');
        error = 'client.customers does not exist';
      }
    } catch (apiError) {
      console.log('client.customers.create failed:', apiError.message);
      error = apiError.message;
    }
    
    // Method 2: Try raw HTTP request
    if (!customerId) {
      try {
        console.log('Trying raw HTTP request...');
        const response = await fetch('https://connect.squareup.com/v2/customers', {
          method: 'POST',
          headers: {
            'Square-Version': '2025-07-16',
            'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(customerRequest)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Customer created via HTTP:', result.customer.id);
          customerId = result.customer.id;
        } else {
          console.log('HTTP request failed:', response.status, response.statusText);
          const errorText = await response.text();
          console.log('Error details:', errorText);
          error = `HTTP ${response.status}: ${errorText}`;
        }
      } catch (httpError) {
        console.log('Raw HTTP request failed:', httpError.message);
        error = httpError.message;
      }
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: !!customerId,
        customerId: customerId,
        error: error,
        clientKeys: Object.keys(client),
        clientProperties: Object.getOwnPropertyNames(client),
        customersExists: !!client.customers,
        message: customerId ? 'Customer created successfully' : 'Customer creation failed'
      })
    };

  } catch (error) {
    console.error('Error testing customer creation:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        clientKeys: client ? Object.keys(client) : null
      })
    };
  }
}; 