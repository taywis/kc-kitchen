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
    'Access-Control-Allow-Methods': 'PUT, OPTIONS'
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
      orderId,
      lineItems,
      note,
      version
    } = data;

    if (!orderId) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'Order ID is required'
        })
      };
    }

    // Generate idempotency key for order update
    const idempotencyKey = randomUUID();

    // Prepare the update request
    const updateRequest = {
      orderId: orderId,
      idempotencyKey: idempotencyKey,
      order: {
        locationId: process.env.SQUARE_LOCATION_ID || 'default'
      }
    };

    // Add line items if provided
    if (lineItems && Array.isArray(lineItems)) {
      updateRequest.order.lineItems = lineItems.map(item => ({
        ...item,
        basePriceMoney: {
          amount: BigInt(Math.round(item.basePriceMoney.amount * 100)), // Convert to cents as BigInt
          currency: 'USD'
        }
      }));
    }

    // Add note if provided
    if (note) {
      updateRequest.order.note = note;
    }

    // Add version for optimistic concurrency if provided
    if (version !== undefined) {
      updateRequest.order.version = BigInt(version); // Use BigInt
    }

    // Update the order using the correct API
    const updateResponse = await client.orders.update(updateRequest, {
      headers: {
        "X-Clear-Null": "true"
      }
    });

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        order: {
          id: updateResponse.result.order.id,
          version: updateResponse.result.order.version,
          totalMoney: updateResponse.result.order.totalMoney,
          lineItems: updateResponse.result.order.lineItems,
          note: updateResponse.result.order.note
        },
        message: 'Order updated successfully'
      }, jsonReplacer)
    };

  } catch (error) {
    console.error('Error updating order:', error);
    
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
        error: error.message || 'Failed to update order'
      })
    };
  }
}; 