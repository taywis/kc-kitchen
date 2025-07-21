const { SquareClient, SquareEnvironment, SquareError } = require('square');

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
    const limit = 50; // Number of orders per page
    const allOrders = [];

    // Get orders with pagination using the correct API
    let orderPager = await client.orders.list({
      limit,
      sortField: "CREATED_AT",
      sortOrder: "DESC"
    });

    // Iterate through all pages
    for await (const order of orderPager) {
      allOrders.push({
        id: order.id,
        referenceId: order.referenceId,
        status: order.fulfillmentStatus,
        totalMoney: order.totalMoney,
        createdAt: order.createdAt,
        note: order.note,
        lineItems: order.lineItems?.map(item => ({
          name: item.name,
          quantity: item.quantity,
          basePriceMoney: item.basePriceMoney
        })) || []
      });
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        orders: allOrders,
        count: allOrders.length
      })
    };

  } catch (error) {
    console.error('Error listing orders:', error);
    
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
        error: error.message || 'Failed to list orders'
      })
    };
  }
}; 