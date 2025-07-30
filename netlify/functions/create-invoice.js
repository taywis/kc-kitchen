const { SquareClient, SquareEnvironment } = require('square');
const { randomUUID } = require('crypto');
const { sendNotificationEmail } = require('./send-notification-email');

// Initialize Square client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

// Helper function to handle BigInt serialization
function jsonReplacer(key, value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

// Create order line items from selected package and options
function createOrderLineItems(selectedPackage, guestCount, selectedEntrees, selectedSides, additionalServices) {
  const lineItems = [];
  
  // Add base package
  if (selectedPackage) {
    lineItems.push({
      name: `${selectedPackage.name} - Base Package`,
      quantity: guestCount.toString(),
      basePriceMoney: {
        amount: BigInt(selectedPackage.price * 100), // Convert to cents
        currency: 'USD'
      }
    });
  }
  
  // Add entrees (if any have prices)
  selectedEntrees.forEach(entree => {
    if (entree.price > 0) {
      lineItems.push({
        name: entree.name,
        quantity: guestCount.toString(),
        basePriceMoney: {
          amount: BigInt(entree.price * 100),
          currency: 'USD'
        }
      });
    }
  });
  
  // Add sides (if any have prices)
  selectedSides.forEach(side => {
    if (side.price > 0) {
      lineItems.push({
        name: side.name,
        quantity: guestCount.toString(),
        basePriceMoney: {
          amount: BigInt(side.price * 100),
          currency: 'USD'
        }
      });
    }
  });
  
  // Add additional services
  additionalServices.forEach(service => {
    if (service.price > 0) {
      lineItems.push({
        name: service.name,
        quantity: '1', // Services are typically per event, not per guest
        basePriceMoney: {
          amount: BigInt(service.price * 100),
          currency: 'USD'
        }
      });
    }
  });
  
  return lineItems;
}

// Look up existing customer by email using SDK
async function findCustomerByEmail(email) {
  if (!email) return null;
  
  try {
    console.log('Searching for existing customer with email:', email);
    
    // Use SDK to list all customers and search manually (more reliable than search API)
    try {
      console.log('Listing all customers to search manually...');
      const result = await client.customers.list();
      
      console.log('List customers result:', {
        hasCustomers: !!result.data,
        customerCount: result.data?.length || 0
      });
      
      if (result.data && result.data.length > 0) {
        // Search for customer with matching email
        const matchingCustomer = result.data.find(customer => 
          customer.emailAddress && customer.emailAddress.toLowerCase() === email.toLowerCase()
        );
        
        if (matchingCustomer) {
          console.log('Found existing customer by manual search:', matchingCustomer.id);
          return matchingCustomer;
        }
      }
    } catch (error) {
      console.log('Manual customer search failed:', error.message);
    }
    
    console.log('No existing customer found for email:', email);
    return null;
    
  } catch (error) {
    console.log('Customer search failed:', error.message);
    return null;
  }
}

// Create or update customer using SDK
async function upsertCustomer(contactInfo) {
  console.log('upsertCustomer function called with:', contactInfo);
  
  if (!contactInfo?.firstName && !contactInfo?.lastName && !contactInfo?.email && !contactInfo?.phone) {
    console.log('No contact info provided - skipping customer creation');
    return null;
  }

  try {
    // First, try to find existing customer by email
    let existingCustomer = null;
    if (contactInfo?.email) {
      existingCustomer = await findCustomerByEmail(contactInfo.email);
    }
    
    if (existingCustomer) {
      console.log('Using existing customer:', existingCustomer.id);
      
      // Update customer if we have new information
      const updateFields = {};
      let hasUpdates = false;
      
      if (contactInfo.firstName && contactInfo.firstName !== existingCustomer.givenName) {
        updateFields.givenName = contactInfo.firstName;
        hasUpdates = true;
      }
      
      if (contactInfo.lastName && contactInfo.lastName !== existingCustomer.familyName) {
        updateFields.familyName = contactInfo.lastName;
        hasUpdates = true;
      }
      
      // Update customer if we have changes
      if (hasUpdates) {
        try {
          console.log('Updating existing customer with fields:', updateFields);
          const updateResult = await client.customers.update(existingCustomer.id, updateFields);
          console.log('Customer updated successfully');
          return updateResult.result.customer.id;
        } catch (updateError) {
          console.log('Failed to update customer, using existing:', updateError.message);
          return existingCustomer.id;
        }
      }
      
      return existingCustomer.id;
    }
    
    // Create new customer if none exists
    console.log('Creating new customer...');
    const requestBody = {
      idempotencyKey: randomUUID(),
      givenName: contactInfo?.firstName || 'Guest',
      familyName: contactInfo?.lastName || 'Customer',
      emailAddress: contactInfo?.email,
      referenceId: `KKC-${Date.now()}`,
      note: 'Catering customer'
    };
    
                    // Add phone number if provided and valid
                if (contactInfo?.phone) {
                  let phoneNumber = contactInfo.phone.replace(/\D/g, '');
                  
                  // Square API phone number requirements: 9-16 digits with optional + prefix
                  if (phoneNumber.length >= 10 && phoneNumber.length <= 15) {
                    // Try different formats to find one that works
                    if (phoneNumber.length === 10) {
                      // For 10-digit US numbers, add +1 prefix
                      console.log('Adding 10-digit phone number with +1 prefix:', `+1${phoneNumber}`);
                      requestBody.phoneNumber = `+1${phoneNumber}`;
                    } else if (phoneNumber.length === 11 && phoneNumber.startsWith('1')) {
                      // For 11-digit numbers starting with 1, add + prefix
                      console.log('Adding 11-digit phone number with + prefix:', `+${phoneNumber}`);
                      requestBody.phoneNumber = `+${phoneNumber}`;
                    } else {
                      // For other lengths, try with + prefix
                      console.log('Adding phone number with + prefix:', `+${phoneNumber}`);
                      requestBody.phoneNumber = `+${phoneNumber}`;
                    }
                  } else {
                    console.log('Phone number format not supported, skipping:', contactInfo.phone);
                  }
                }

    console.log('Creating customer with request:', JSON.stringify(requestBody, jsonReplacer, 2));
    
    // Use SDK for customer creation
    const result = await client.customers.create(requestBody);
    console.log('Customer created successfully:', result.customer.id);
    return result.customer.id;
    
  } catch (error) {
    console.log('Customer upsert failed:', error);
    
    // Try alternative approach - create customer with just email
    if (contactInfo?.email) {
      try {
        console.log('Trying alternative customer creation with just email...');
        const altBody = {
          idempotencyKey: randomUUID(),
          emailAddress: contactInfo.email,
          referenceId: `KKC-${Date.now()}`,
          note: 'Catering customer'
        };
        
        const altResult = await client.customers.create(altBody);
        console.log('Alternative customer created successfully:', altResult.customer.id);
        return altResult.customer.id;
      } catch (altError) {
        console.log('Alternative customer creation also failed:', altError);
      }
    }
    
    console.log('Proceeding without customer - will create invoice without customer');
    return null;
  }
}

// Create order with proper customer linking
async function createOrder(orderLineItems, guestCount, contactInfo, customerId) {
  const orderIdempotencyKey = randomUUID();
  
  const orderRequest = {
    idempotencyKey: orderIdempotencyKey,
    order: {
      locationId: process.env.SQUARE_LOCATION_ID || 'default',
      lineItems: orderLineItems,
      referenceId: `KKC-${Date.now()}`,
      note: `Catering event for ${guestCount} guests on ${contactInfo?.eventDate ?? 'TBD'} at ${contactInfo?.location ?? 'Unknown location'}`,
      customerId: customerId // Link to customer if we have one
    }
  };

  console.log('Creating order:', JSON.stringify(orderRequest, jsonReplacer, 2));
  
  const orderResponse = await client.orders.create(orderRequest);
  
  if (!orderResponse || !orderResponse.order) {
    throw new Error(`Order creation failed. Response: ${JSON.stringify(orderResponse, jsonReplacer)}`);
  }
  
  console.log('Order created successfully:', orderResponse.order.id);
  return orderResponse.order;
}

// Create invoice title with event details
function createInvoiceTitle(contactInfo) {
  const customerName = contactInfo?.firstName && contactInfo?.lastName 
    ? `${contactInfo.firstName} ${contactInfo.lastName}`
    : contactInfo?.firstName || contactInfo?.lastName || 'Guest';
  
  const eventDate = contactInfo?.eventDate 
    ? new Date(contactInfo.eventDate + 'T00:00:00').toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'TBD';
  
  const location = contactInfo?.location || 'TBD';
  
  return `Catering Invoice - ${customerName} - ${eventDate} at ${location}`;
}

// Create comprehensive selection summary
function createSelectionSummary(orderResponse, guestCount, contactInfo) {
  const customerName = contactInfo?.firstName && contactInfo?.lastName 
    ? `${contactInfo.firstName} ${contactInfo.lastName}`
    : contactInfo?.firstName || contactInfo?.lastName || 'Guest';
  
  const eventDate = contactInfo?.eventDate 
    ? new Date(contactInfo.eventDate + 'T00:00:00').toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'TBD';
  
  const time = contactInfo?.time || 'TBD';
  const location = contactInfo?.location || 'TBD';
  const deliveryMethod = contactInfo?.deliveryMethod || 'TBD';
  const email = contactInfo?.email || 'Not provided';
  const phone = contactInfo?.phone || 'Not provided';
  
  return `CATERING EVENT DETAILS
================================

EVENT INFORMATION
------------------
Date: ${eventDate}
Time: ${time}
Location: ${location}
Guest Count: ${guestCount} guests
Delivery Method: ${deliveryMethod.charAt(0).toUpperCase() + deliveryMethod.slice(1)}

SELECTED SERVICES
-----------------
BASE PACKAGE:
• ${orderResponse.lineItems[0]?.name || 'Package details'} - $${orderResponse.lineItems[0]?.basePriceMoney?.amount ? (Number(orderResponse.lineItems[0].basePriceMoney.amount) / 100) : 0}/guest

CONTACT INFORMATION
-------------------
Name: ${customerName}
Email: ${email}
Phone: ${phone}

ADDITIONAL NOTES
-----------------
• This is a draft invoice for your catering event
• Final pricing for quote-required services will be provided separately
• Please review all details and contact us with any questions
• Payment is due 30 days from invoice date`;
}

// Create invoice with proper linking
async function createInvoice(orderId, customerId, contactInfo, selectionSummary) {
  const invoiceRequest = {
    idempotencyKey: randomUUID(),
    invoice: {
      orderId: orderId,
      title: createInvoiceTitle(contactInfo),
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
      description: selectionSummary,
      // Set service date during creation - format as YYYY-MM-DD
      saleOrServiceDate: contactInfo?.eventDate ? new Date(contactInfo.eventDate + 'T00:00:00').toISOString().split('T')[0] : undefined
    }
  };

  // Add customer if we have one
  if (customerId) {
    invoiceRequest.invoice.primaryRecipient = {
      customerId: customerId
    };
  }

  console.log('Creating invoice:', JSON.stringify(invoiceRequest, jsonReplacer, 2));
  
  const invoiceResponse = await client.invoices.create(invoiceRequest);
  console.log('Invoice created successfully:', invoiceResponse.invoice.id);
  
  return invoiceResponse.invoice;
}

// Generate idempotency key based on form data to prevent duplicates
function generateFormIdempotencyKey(data) {
  const { contactInfo, package: selectedPackage, guestCount, entrees, sides, additionalServices, totalPrice } = data;
  
  // Create a hash of the key form fields
  const keyFields = {
    email: contactInfo?.email,
    firstName: contactInfo?.firstName,
    lastName: contactInfo?.lastName,
    eventDate: contactInfo?.eventDate,
    location: contactInfo?.location,
    time: contactInfo?.time,
    packageId: selectedPackage?.id,
    guestCount,
    totalPrice,
    // Hash of selections to detect changes
    selections: JSON.stringify({ entrees, sides, additionalServices })
  };
  
  // Create a deterministic hash
  const hash = require('crypto').createHash('sha256').update(JSON.stringify(keyFields)).digest('hex');
  return `form-${hash.substring(0, 16)}`;
}

// Main handler function
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
    
    // Generate form-based idempotency key to prevent duplicates
    const formIdempotencyKey = generateFormIdempotencyKey(data);
    console.log('Form idempotency key:', formIdempotencyKey);
    
    const {
      package: selectedPackage,
      guestCount,
      entrees: selectedEntrees,
      sides: selectedSides,
      additionalServices: selectedServices,
      totalPrice,
      contactInfo
    } = data;

    // Step 1: Create or find customer (upsert logic)
    console.log('About to upsert customer with contactInfo:', contactInfo);
    const customerId = await upsertCustomer(contactInfo);
    console.log('Customer upsert result:', customerId);
    
    // Step 2: Create order line items
    const orderLineItems = createOrderLineItems(selectedPackage, guestCount, selectedEntrees, selectedSides, selectedServices);
    
    // Step 3: Create order with customer linking
    const order = await createOrder(orderLineItems, guestCount, contactInfo, customerId);
    
    // Step 4: Create selection summary
    const selectionSummary = createSelectionSummary(order, guestCount, contactInfo);
    
    // Step 5: Create invoice
    const invoice = await createInvoice(order.id, customerId, contactInfo, selectionSummary);
    
    // Step 6: Send notification email (non-blocking)
    let emailNotification = null;
    try {
      // Create customer data object from contact info and customer ID
      const customerData = customerId ? {
        id: customerId,
        givenName: contactInfo?.firstName,
        familyName: contactInfo?.lastName,
        emailAddress: contactInfo?.email,
        phoneNumber: contactInfo?.phone
      } : null;
      
      // Send notification email
      emailNotification = await sendNotificationEmail(invoice, customerData, order);
      console.log('Email notification result:', emailNotification);
    } catch (error) {
      console.error('Email notification failed:', error);
      emailNotification = {
        success: false,
        error: error.message
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        orderId: order.id,
        invoiceId: invoice.id,
        customerId: customerId,
        formIdempotencyKey: formIdempotencyKey,
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
        invoiceDescription: invoice.description || 'Not set',
        emailNotification: emailNotification
      })
    };

  } catch (error) {
    console.error('Error creating invoice:', error);
    console.error('Error stack:', error.stack);
    
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