# KC Kitchen Catering System

A modern catering quote and invoice management system built with React, TypeScript, and Square API integration.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Square Developer Account with API credentials
- Netlify account (for deployment)
- Resend account (for email notifications)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kc-kitchen
```

2. Install dependencies:
```bash
npm install
cd netlify/functions && npm install
```

3. Set up environment variables:
```bash
cp env.local.example .env.local
```

Edit `.env.local` and add your credentials:
```
# Square API Configuration
SQUARE_ACCESS_TOKEN=your_square_access_token_here
SQUARE_ENVIRONMENT=sandbox
SQUARE_LOCATION_ID=your_square_location_id_here

# Email Notification Configuration (Optional)
RESEND_API_KEY=your_resend_api_key_here
```

## Running the Application

### Option 1: Full Stack Development (Recommended)
```bash
npx netlify dev
```
This starts both the frontend and Netlify functions locally.

### Option 2: Frontend Only
```bash
npm run dev
```
This starts only the frontend. You'll need to run Netlify functions separately.

## Available Endpoints

- `POST /.netlify/functions/create-invoice` - Create new catering invoice
- `GET /.netlify/functions/list-orders` - List all orders
- `GET /.netlify/functions/list-invoices` - List all invoices
- `POST /.netlify/functions/publish-invoice` - Publish draft invoice
- `POST /.netlify/functions/update-order` - Update existing order

## Features

✅ **Customer Management**: Automatic customer creation and upsert logic
✅ **Invoice Creation**: Professional Square invoices with detailed event information
✅ **Email Notifications**: Automatic notifications to `hosting@wgmtx.com` when invoices are created
✅ **Form Validation**: Comprehensive client-side validation
✅ **Responsive Design**: Mobile-friendly interface
✅ **Duplicate Prevention**: Form idempotency to prevent duplicate submissions

## Deployment to Netlify

### Automatic Deployment (Recommended)

1. Connect your GitHub repository to Netlify
2. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

3. Add environment variables in Netlify dashboard:
   - `SQUARE_ACCESS_TOKEN`
   - `SQUARE_ENVIRONMENT`
   - `SQUARE_LOCATION_ID`
   - `RESEND_API_KEY` (optional)

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to Netlify:
```bash
npx netlify deploy --prod
```

## Email Notifications Setup

1. Sign up at [Resend.com](https://resend.com)
2. Create an API key
3. Add `RESEND_API_KEY` to your environment variables
4. Emails will be sent to `hosting@wgmtx.com` when invoices are created

## Development

The application consists of:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Netlify Functions (serverless)
- **API Integration**: Square API for payments and invoicing
- **Email Service**: Resend for notifications

## Troubleshooting

### Common Issues

1. **404 Errors**: Ensure Netlify dev server is running
2. **Square API Errors**: Verify your API credentials in `.env.local`
3. **CORS Issues**: Use `npx netlify dev` for full-stack development
4. **Email Notifications**: Check Resend API key configuration

### Environment Variables

Make sure all required environment variables are set:
- `SQUARE_ACCESS_TOKEN`: Your Square API access token
- `SQUARE_ENVIRONMENT`: `sandbox` or `production`
- `SQUARE_LOCATION_ID`: Your Square location ID
- `RESEND_API_KEY`: Your Resend API key (optional)

## Production Checklist

Before deploying to production:

- [ ] Update `SQUARE_ENVIRONMENT` to `production`
- [ ] Add `RESEND_API_KEY` for email notifications
- [ ] Test customer creation and invoice generation
- [ ] Verify email notifications are working
- [ ] Test form submission and validation
