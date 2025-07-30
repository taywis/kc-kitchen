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
    console.log('Testing Square API structure...');
    
    // Test 1: Check what's available on the client
    console.log('Client object keys:', Object.keys(client));
    console.log('Client API keys:', client.api ? Object.keys(client.api) : 'No api property');
    console.log('Orders client methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(client.orders)));
    console.log('Orders client keys:', Object.keys(client.orders));
    
    // Test 2: Try to create a simple order
    const orderIdempotencyKey = require('crypto').randomUUID();
    const orderRequest = {
      idempotencyKey: orderIdempotencyKey,
      order: {
        locationId: process.env.SQUARE_LOCATION_ID || 'default',
        lineItems: [
          {
            name: 'Test Item',
            quantity: '1',
            basePriceMoney: {
              amount: BigInt(1000), // $10.00
              currency: 'USD'
            }
          }
        ],
        referenceId: `TEST-${Date.now()}`,
        note: 'Test order from API'
      }
    };

    console.log('Creating test order...');
    const orderResponse = await client.orders.create(orderRequest);
    console.log('Order created successfully:', orderResponse.order.id);
    console.log('Order created successfully:', orderResponse.order.id);
    
    // Test 3: Try to retrieve the order we just created
    try {
      console.log('Attempting to retrieve order:', orderResponse.order.id);
      const retrievedOrder = await client.orders.get(orderResponse.order.id);
      console.log('Order retrieved successfully:', retrievedOrder.order.id);
    } catch (retrieveError) {
      console.log('Failed to retrieve order:', retrieveError.message);
    }
    
    // Test 4: Try to create a customer
    let customerId = null;
    try {
      console.log('Testing customer creation...');
      
      // Try different API access patterns
      const customerRequest = {
        idempotency_key: require('crypto').randomUUID(),
        given_name: 'Test',
        family_name: 'Customer',
        email_address: 'test@example.com',
        reference_id: `TEST-${Date.now()}`,
        note: 'Test customer'
      };
      
      console.log('Customer request:', customerRequest);
      
      // Method 1: Try client.customers.create
      try {
        console.log('Trying client.customers.create...');
        const customerResult = await client.customers.create(customerRequest);
        console.log('Customer created via client.customers.create:', customerResult.result.customer.id);
        customerId = customerResult.result.customer.id;
      } catch (error) {
        console.log('client.customers.create failed:', error.message);
        
        // Method 2: Try raw HTTP request
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
          }
        } catch (error3) {
          console.log('Raw HTTP request failed:', error3.message);
        }
      }
    } catch (customerError) {
      console.log('Customer creation test failed:', customerError);
    }
    
    // Test 5: Try to create an invoice
    let invoiceId = null;
    try {
      console.log('Testing invoice creation...');
      
      const invoiceRequest = {
        idempotencyKey: require('crypto').randomUUID(),
        invoice: {
          orderId: orderResponse.order.id,
          title: 'Test Invoice',
          deliveryMethod: 'EMAIL',
          acceptedPaymentMethods: {
            card: true,
            squareGiftCard: false,
            bankAccount: false,
            buyNowPayLater: false
          },
          paymentRequests: [
            {
              requestType: 'BALANCE',
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              reminderSchedule: {
                initialReminderDays: 3,
                reminderDays: [7, 14, 21]
              }
            }
          ],
          description: 'Test invoice from API',
          sale_or_service_date: new Date().toISOString().split('T')[0]
        }
      };
      
      if (customerId) {
        invoiceRequest.invoice.primaryRecipient = {
          customerId: customerId
        };
      }
      
      console.log('Creating invoice...');
      const invoiceResponse = await client.invoices.create(invoiceRequest);
      console.log('Invoice created successfully:', invoiceResponse.invoice.id);
      console.log('Invoice created successfully:', invoiceResponse.invoice.id);
      invoiceId = invoiceResponse.invoice.id;
    } catch (invoiceError) {
      console.log('Invoice creation test failed:', invoiceError);
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        clientInitialized: true,
        locationId: process.env.SQUARE_LOCATION_ID,
        orderId: orderResponse.order.id,
        orderId: orderResponse.order.id,
        customerId: customerId,
        invoiceId: invoiceId,
        message: 'Square API test completed successfully',
        clientKeys: Object.keys(client),
        apiKeys: client.api ? Object.keys(client.api) : null
      })
    };

  } catch (error) {
    console.error('Error testing Square API:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        clientInitialized: !!client,
        locationId: process.env.SQUARE_LOCATION_ID,
        clientKeys: client ? Object.keys(client) : null
      })
    };
  }
}; 