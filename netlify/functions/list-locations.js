const { SquareClient, SquareEnvironment } = require('square');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Initialize Square client with production credentials
    const client = new SquareClient({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT || 'production'
    });

    console.log('Listing locations for environment:', process.env.SQUARE_ENVIRONMENT);
    console.log('Using access token:', process.env.SQUARE_ACCESS_TOKEN ? 'Present' : 'Missing');

    // List all locations
    const result = await client.locations.listLocations();
    
    console.log('Locations result:', JSON.stringify(result, null, 2));

    if (result.result && result.result.locations) {
      const locations = result.result.locations.map(location => ({
        id: location.id,
        name: location.name,
        status: location.status,
        type: location.type,
        address: location.address ? {
          addressLine1: location.address.addressLine1,
          locality: location.address.locality,
          administrativeDistrictLevel1: location.address.administrativeDistrictLevel1
        } : null
      }));

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          locations: locations,
          count: locations.length
        })
      };
    } else {
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: false,
          error: 'No locations found',
          result: result
        })
      };
    }

  } catch (error) {
    console.error('Error listing locations:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      })
    };
  }
}; 