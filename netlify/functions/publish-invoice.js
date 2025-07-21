const { SquareClient, SquareEnvironment, SquareError } = require('square');
const { randomUUID } = require('crypto');

// Initialize Square client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

// Custom JSON replacer to handle BigInt serialization
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    // Parse the request body
    const data = JSON.parse(event.body);
    
    const {
      invoiceId,
      version
    } = data;

    if (!invoiceId) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'Invoice ID is required'
        })
      };
    }

    // Generate idempotency key for invoice publish
    const idempotencyKey = randomUUID();

    // Prepare the publish request
    const publishRequest = {
      invoiceId: invoiceId,
      idempotencyKey: idempotencyKey,
      invoice: {
        status: 'PUBLISHED'
      }
    };

    // Add version for optimistic concurrency if provided
    if (version !== undefined) {
      publishRequest.invoice.version = BigInt(version); // Use BigInt
    }

    // Publish the invoice using the correct API
    const publishResponse = await client.invoices.update(publishRequest);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        invoice: {
          id: publishResponse.invoice.id,
          version: publishResponse.invoice.version,
          status: publishResponse.invoice.status,
          totalMoney: publishResponse.invoice.totalMoney
        },
        message: 'Invoice published successfully'
      }, jsonReplacer)
    };

  } catch (error) {
    console.error('Error publishing invoice:', error);
    
    // Handle Square-specific errors
    if (error instanceof SquareError) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: error.message,
          category: error.category,
          code: error.code
        })
      };
    }
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to publish invoice'
      })
    };
  }
}; 