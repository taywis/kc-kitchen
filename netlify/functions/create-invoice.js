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
      package: selectedPackage,
      guestCount,
      entrees: selectedEntrees,
      sides: selectedSides,
      additionalServices: selectedServices,
      totalPrice,
      contactInfo
    } = data;

    // Create order line items
    const orderLineItems = [];

    // Add package base price
    if (selectedPackage) {
      orderLineItems.push({
        name: `${selectedPackage.name} - Base Package`,
        quantity: guestCount.toString(),
        basePriceMoney: {
          amount: BigInt(Math.round(selectedPackage.price * 100)), // Convert to cents as BigInt
          currency: 'USD'
        }
      });
    }

    // Add entree items
    selectedEntrees.forEach(entree => {
      orderLineItems.push({
        name: entree.name,
        quantity: guestCount.toString(),
        basePriceMoney: {
          amount: BigInt(Math.round(entree.price * 100)), // Convert to cents as BigInt
          currency: 'USD'
        }
      });
    });

    // Add per-person services
    selectedServices
      .filter(service => service.type === 'per_person')
      .forEach(service => {
        orderLineItems.push({
          name: service.name,
          quantity: guestCount.toString(),
          basePriceMoney: {
            amount: BigInt(Math.round(service.price * 100)), // Convert to cents as BigInt
            currency: 'USD'
          }
        });
      });

    // Add quote-based services as line items with $0 price (to be updated later)
    selectedServices
      .filter(service => service.type === 'quote_based')
      .forEach(service => {
        orderLineItems.push({
          name: `${service.name} (Quote Required)`,
          quantity: '1',
          basePriceMoney: {
            amount: BigInt(0), // BigInt zero
            currency: 'USD'
          }
        });
      });

    // Generate idempotency key for order creation
    const orderIdempotencyKey = randomUUID();

    // First, create a draft order using the correct API
    const orderRequest = {
      idempotencyKey: orderIdempotencyKey,
      order: {
        locationId: process.env.SQUARE_LOCATION_ID || 'default',
        lineItems: orderLineItems,
        referenceId: `KKC-${Date.now()}`,
        note: `Catering event for ${guestCount} guests on ${contactInfo?.eventDate ?? 'TBD'} at ${contactInfo?.location ?? 'Unknown location'}`,
        customerId: null // We'll create a customer or use existing one
      }
    };

    const orderResponse = await client.orders.create(orderRequest);
        
    // Check for the correct response structure
    if (!orderResponse || !orderResponse.order) {
      throw new Error(`Order creation failed. Response: ${JSON.stringify(orderResponse, jsonReplacer)}`);
    }
    
    const orderId = orderResponse.order.id;

    // Create customer for the invoice
    let customerId = null;
    
    // Only attempt customer creation if we have basic contact info
    if (contactInfo?.firstName || contactInfo?.lastName || contactInfo?.email || contactInfo?.phone) {
      const { customersApi } = client;
      
      try {
        const requestBody = {
          idempotencyKey: randomUUID(),
          givenName: contactInfo?.firstName || 'Guest',
          familyName: contactInfo?.lastName || 'Customer',
          ...(contactInfo?.email && { emailAddress: contactInfo.email }),
          ...(contactInfo?.phone && { phoneNumber: contactInfo.phone })
        };

        console.log('Creating customer with request:', JSON.stringify(requestBody, jsonReplacer, 2));
        
        const { result } = await customersApi.createCustomer(requestBody);
        console.log('Customer created successfully:', result.customer.id);
        customerId = result.customer.id;
      } catch (error) {
        console.log('Customer creation failed:', error);
        
        // Try alternative approach - create customer with just email
        try {
          console.log('Trying alternative customer creation with just email...');
          const altBody = {
            idempotencyKey: randomUUID(),
            ...(contactInfo?.email && { emailAddress: contactInfo.email })
          };
          
          const { result } = await customersApi.createCustomer(altBody);
          console.log('Alternative customer created successfully:', result.customer.id);
          customerId = result.customer.id;
        } catch (altError) {
          console.log('Alternative customer creation also failed:', altError);
          console.log('Proceeding without customer - will create invoice without customer');
        }
      }
    } else {
      console.log('No contact info provided - creating invoice without customer');
    }

    // Create invoice with or without customer
    const invoiceIdempotencyKey = randomUUID();
    
    // Create invoice title with event details
    const createInvoiceTitle = () => {
      const customerName = contactInfo?.firstName && contactInfo?.lastName 
        ? `${contactInfo.firstName} ${contactInfo.lastName}`
        : contactInfo?.firstName || contactInfo?.lastName || 'Guest';
      
      const eventDate = contactInfo?.eventDate 
        ? new Date(contactInfo.eventDate + 'T00:00:00').toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })
        : 'TBD';
      
      const location = contactInfo?.location || 'TBD';
      
      return `Catering Invoice - ${customerName} - ${eventDate} at ${location}`;
    };

    const invoiceRequest = {
      idempotencyKey: invoiceIdempotencyKey,
      invoice: {
        orderId: orderId,
        title: createInvoiceTitle(),
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
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
            reminderSchedule: {
              initialReminderDays: 3,
              reminderDays: [7, 14, 21]
            }
          }
        ],
        // Description will be set after creation
        description: '',
        // Set service date during creation
        sale_or_service_date: contactInfo?.eventDate || undefined
      }
    };

    // Add customer if we have one
    if (customerId) {
      invoiceRequest.invoice.customerId = customerId;
    }
    
    // Create comprehensive message with all selection details
    const createSelectionSummary = () => {
      let summary = `CATERING EVENT DETAILS\n`;
      summary += `================================\n\n`;
      
      // Event Information
      summary += `EVENT INFORMATION\n`;
      summary += `------------------\n`;
      summary += `Date: ${contactInfo?.eventDate ? new Date(contactInfo.eventDate + 'T00:00:00').toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : 'TBD'}\n`;
      summary += `Time: ${contactInfo?.time || 'TBD'}\n`;
      summary += `Location: ${contactInfo?.location || 'TBD'}\n`;
      summary += `Guest Count: ${guestCount} guests\n`;
      summary += `Delivery Method: ${contactInfo?.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'}\n\n`;
      
      // Selected Services - Build from order line items
      summary += `SELECTED SERVICES\n`;
      summary += `-----------------\n`;
      
      // Process order line items to categorize them
      const lineItems = orderResponse.order.lineItems;
      
      // Base Package (usually the first item)
      const basePackageItem = lineItems.find(item => item.name.includes('Base Package'));
      if (basePackageItem) {
        const pricePerGuest = parseInt(basePackageItem.basePriceMoney.amount) / 100;
        summary += `BASE PACKAGE:\n`;
        summary += `• ${basePackageItem.name} - $${pricePerGuest}/guest\n\n`;
      }
      
      // Entrees (items that are not base package, beverages, or quote-based)
      const entreeItems = lineItems.filter(item => 
        !item.name.includes('Base Package') && 
        !item.name.includes('Beverage') && 
        !item.name.includes('Quote Required') &&
        parseInt(item.basePriceMoney.amount) > 0
      );
      
      if (entreeItems.length > 0) {
        summary += `ENTREES:\n`;
        entreeItems.forEach(item => {
          const pricePerGuest = parseInt(item.basePriceMoney.amount) / 100;
          summary += `• ${item.name} - $${pricePerGuest}/guest\n`;
        });
        summary += `\n`;
      }
      
      // Beverages
      const beverageItems = lineItems.filter(item => item.name.includes('Beverage'));
      if (beverageItems.length > 0) {
        summary += `BEVERAGES:\n`;
        beverageItems.forEach(item => {
          const pricePerGuest = parseInt(item.basePriceMoney.amount) / 100;
          summary += `• ${item.name} - $${pricePerGuest}/guest\n`;
        });
        summary += `\n`;
      }
      
      // Quote-based services
      const quoteItems = lineItems.filter(item => item.name.includes('Quote Required'));
      if (quoteItems.length > 0) {
        summary += `QUOTE REQUIRED SERVICES:\n`;
        quoteItems.forEach(item => {
          summary += `• ${item.name} - Quote required\n`;
        });
        summary += `\n`;
      }
      
      // Contact Information
      summary += `CONTACT INFORMATION\n`;
      summary += `-------------------\n`;
      summary += `Name: ${contactInfo?.firstName || ''} ${contactInfo?.lastName || ''}\n`;
      summary += `Email: ${contactInfo?.email || 'TBD'}\n`;
      summary += `Phone: ${contactInfo?.phone || 'TBD'}\n\n`;
      
      // Special Instructions
      if (contactInfo?.specialInstructions) {
        summary += `SPECIAL INSTRUCTIONS\n`;
        summary += `--------------------\n`;
        summary += `${contactInfo.specialInstructions}\n\n`;
      }
      
      // Additional Notes
      summary += `ADDITIONAL NOTES\n`;
      summary += `-----------------\n`;
      summary += `• This is a draft invoice for your catering event\n`;
      summary += `• Final pricing for quote-required services will be provided separately\n`;
      summary += `• Please review all details and contact us with any questions\n`;
      summary += `• Payment is due 30 days from invoice date\n`;
      
      return summary;
    };

    // Add the comprehensive message to the invoice
    const selectionSummary = createSelectionSummary();
    invoiceRequest.invoice.description = selectionSummary;
  

    console.log('Creating invoice:', JSON.stringify(invoiceRequest, jsonReplacer, 2));
    
    try {
      const invoiceResponse = await client.invoices.create(invoiceRequest);
      console.log('Invoice created successfully without customer:', JSON.stringify(invoiceResponse, jsonReplacer, 2));
      
      // No update needed - service date is set during creation
      const updatedInvoice = invoiceResponse;
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success: true,
          orderId: orderId,
          invoiceId: updatedInvoice.invoice.id,
          customerId: customerId,
          message: 'Draft invoice created successfully with comprehensive event details',
          eventDetails: {
            date: contactInfo?.eventDate || 'TBD',
            time: contactInfo?.time || 'TBD',
            location: contactInfo?.location || 'TBD',
            deliveryMethod: contactInfo?.deliveryMethod || 'TBD',
            guestCount: guestCount,
            customerName: customerId ? `${contactInfo?.firstName || 'Guest'} ${contactInfo?.lastName || 'Customer'}` : null
          },
          selectionSummary: selectionSummary,
          invoiceDescription: updatedInvoice.invoice.description || 'Not set'
        })
      };
    } catch (invoiceError) {
      console.error('Invoice creation without customer failed:', invoiceError);
      
      // Log the error details more safely
      try {
        console.error('Invoice error details:', JSON.stringify(invoiceError, jsonReplacer, 2));
      } catch (serializeError) {
        console.error('Could not serialize invoice error:', serializeError.message);
      }
      
      throw new Error('Unable to create invoice. Please check Square API configuration and try again.');
    }



  } catch (error) {
    console.error('Error creating invoice:', error);
    console.error('Error stack:', error.stack);
    
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
        error: error.message || 'Failed to create invoice',
        details: error.stack
      })
    };
  }
}; 