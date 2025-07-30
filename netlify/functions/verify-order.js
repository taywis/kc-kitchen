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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
    const orderId = event.queryStringParameters?.orderId;
    
    console.log('Event queryStringParameters:', event.queryStringParameters);
    console.log('OrderId:', orderId);
    
    if (!orderId) {
      return {
        statusCode: 400,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'orderId parameter is required'
        })
      };
    }

    console.log('Verifying order:', orderId);
    
    // Try to retrieve the order from Square
    const orderResponse = await client.orders.get(orderId);
    
    if (orderResponse && orderResponse.order) {
      console.log('Order found:', orderResponse.order.id);
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          orderExists: true,
          orderId: orderResponse.order.id,
          orderStatus: orderResponse.order.state,
          orderTotal: orderResponse.order.totalMoney,
          orderLineItems: orderResponse.order.lineItems,
          orderCreatedAt: orderResponse.order.createdAt,
          orderUpdatedAt: orderResponse.order.updatedAt
        })
      };
    } else {
      return {
        statusCode: 404,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          orderExists: false,
          error: 'Order not found'
        })
      };
    }

  } catch (error) {
    console.error('Error verifying order:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        orderExists: false,
        error: error.message,
        details: error.stack
      })
    };
  }
}; 