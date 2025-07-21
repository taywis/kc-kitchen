# Square Integration Setup Guide

## Prerequisites
1. A Square Developer account
2. A Square application created in the Square Developer Dashboard

## Environment Variables
You'll need to set these environment variables in your Netlify deployment:

### Required Variables:
- `SQUARE_ACCESS_TOKEN` - Your Square API access token
- `SQUARE_ENVIRONMENT` - Either `sandbox` (for testing) or `production` (for live)
- `SQUARE_LOCATION_ID` - Your Square location ID (required for creating orders)

### Optional Variables:
- None currently

## Getting Your Square Credentials

### 1. Create a Square Application
1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Click "New Application"
3. Give your app a name (e.g., "KC Kitchen Catering")
4. Select "Web Payments" as the application type

### 2. Get Your Access Token
1. In your Square application dashboard, go to "Credentials"
2. Copy your **Access Token**
3. For testing, use the **Sandbox Access Token**
4. For production, use the **Production Access Token**

### 3. Get Your Location ID
1. In your Square application dashboard, go to "Locations"
2. Copy your **Location ID** (this is required for creating orders)
3. If you have multiple locations, choose the one you want to use for catering orders

### 4. Set Environment Variables in Netlify
1. Go to your Netlify site dashboard
2. Navigate to "Site settings" > "Environment variables"
3. Add the following variables:
   - `SQUARE_ACCESS_TOKEN`: Your access token from step 2
   - `SQUARE_ENVIRONMENT`: `sandbox` for testing, `production` for live
   - `SQUARE_LOCATION_ID`: Your location ID from step 3

## Testing the Integration

### Sandbox Testing
1. Set `SQUARE_ENVIRONMENT=sandbox`
2. Use the sandbox access token
3. Submit a test quote through your form
4. Check your Square Dashboard > Invoices to see the draft invoice

### Production Deployment
1. Set `SQUARE_ENVIRONMENT=production`
2. Use the production access token
3. Deploy to Netlify
4. Test with real data

## How It Works

When a user submits a quote request:

1. The form data is sent to the Netlify function `/api/create-invoice`
2. The function creates a draft order in Square with all the line items (packages, entrees, services)
3. The function then creates a draft invoice from that order with:
   - Customer information (name, email, phone)
   - Event details (date, time, location)
   - Package and menu selections
   - Pricing breakdown
4. The invoice is created as a draft, so you can review and adjust before sending to the customer
5. You can then send the invoice to the customer through Square's dashboard

## Troubleshooting

### Common Issues:
1. **CORS errors**: The function includes CORS headers, but make sure your domain is allowed
2. **Authentication errors**: Double-check your access token and environment setting
3. **Invoice creation fails**: Verify your Square account has invoice permissions enabled

### Testing Locally:
You can test the function locally using Netlify CLI:
```bash
npm install -g netlify-cli
netlify dev
```
