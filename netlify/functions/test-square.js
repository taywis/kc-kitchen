const { SquareClient, SquareEnvironment, SquareError } = require('square');
const { randomUUID } = require('crypto');

// Custom JSON replacer to handle BigInt serialization
function jsonReplacer(key, value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Initialize Square client
    const client = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    });

    // Test basic client functionality
    const testResults = {
      environment: process.env.SQUARE_ENVIRONMENT,
      hasToken: !!process.env.SQUARE_ACCESS_TOKEN,
      locationId: process.env.SQUARE_LOCATION_ID,
      clientInitialized: !!client
    };

    // Test order creation with proper patterns
    if (process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID) {
      try {
        const idempotencyKey = randomUUID();
        
        const testOrderRequest = {
          idempotencyKey: idempotencyKey,
          order: {
            locationId: process.env.SQUARE_LOCATION_ID,
            lineItems: [
              {
                name: 'Test Item',
                quantity: '1',
                basePriceMoney: {
                  amount: BigInt(1000), // $10.00 in cents as BigInt
                  currency: 'USD'
                }
              }
            ],
            referenceId: `TEST-${Date.now()}`,
            note: 'Test order from KC Kitchen'
          }
        };

        const orderResponse = await client.orders.create(testOrderRequest);
        
        testResults.orderCreated = true;
        testResults.orderId = orderResponse.order.id;
        testResults.orderVersion = orderResponse.order.version;
        testResults.orderTotal = orderResponse.order.totalMoney;

        // Test invoice creation
        const invoiceIdempotencyKey = randomUUID();
        
        const testInvoiceRequest = {
          idempotencyKey: invoiceIdempotencyKey,
          invoice: {
            orderId: orderResponse.order.id,
            primaryRecipient: {
              givenName: 'Test',
              familyName: 'Customer',
              emailAddress: 'test@example.com'
            },
            deliveryMethod: 'EMAIL',
            acceptedPaymentMethods: {
              card: true,
              squareGiftCard: false,
              bankAccount: false,
              buyNowPayLater: false
            },
            status: 'DRAFT',
            timezone: 'America/New_York'
          }
        };

        const invoiceResponse = await client.invoices.create(testInvoiceRequest);
        
        testResults.invoiceCreated = true;
        testResults.invoiceId = invoiceResponse.invoice.id;
        testResults.invoiceStatus = invoiceResponse.invoice.status;

      } catch (orderError) {
        testResults.orderError = orderError.message;
        if (orderError instanceof SquareError) {
          testResults.squareErrorCategory = orderError.category;
          testResults.squareErrorCode = orderError.code;
        }
      }
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Square SDK test completed',
        results: testResults
      }, jsonReplacer)
    };

  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  }
}; 