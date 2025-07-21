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
    const limit = 50; // Number of invoices per page
    const allInvoices = [];

    // Get invoices with pagination using the correct API
    let invoicePager = await client.invoices.list({
      limit,
      sortField: "CREATED_AT",
      sortOrder: "DESC"
    });

    // Iterate through all pages
    for await (const invoice of invoicePager) {
      allInvoices.push({
        id: invoice.id,
        orderId: invoice.orderId,
        status: invoice.status,
        totalMoney: invoice.totalMoney,
        createdAt: invoice.createdAt,
        primaryRecipient: invoice.primaryRecipient ? {
          givenName: invoice.primaryRecipient.givenName,
          familyName: invoice.primaryRecipient.familyName,
          emailAddress: invoice.primaryRecipient.emailAddress,
          companyName: invoice.primaryRecipient.companyName
        } : null,
        customFields: invoice.customFields || [],
        deliveryMethod: invoice.deliveryMethod
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
        invoices: allInvoices,
        count: allInvoices.length
      })
    };

  } catch (error) {
    console.error('Error listing invoices:', error);
    
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
        error: error.message || 'Failed to list invoices'
      })
    };
  }
}; 