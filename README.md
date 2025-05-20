# InboxIntel Backend

This is the backend service for InboxIntel, providing email processing, summarization, and thread management capabilities.

## Features

- Email processing and thread management
- AI-powered email summarization
- Thread urgency analysis
- Daily digest emails
- Gmail integration

## Prerequisites

- Node.js 18+
- Supabase account
- Gmail API credentials
- OpenAI API key
- Resend API key

## Environment Variables

Create a `.env` file with the following variables:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REDIRECT_URI=your_gmail_redirect_uri
OPENAI_API_KEY=your_openai_api_key
RESEND_API_KEY=your_resend_api_key
PORT=3000
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

### Railway Deployment

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add the required environment variables
4. Deploy

## API Endpoints

- `GET /api/email/:userId/summary` - Get email summaries
- `POST /api/email/:userId/reply` - Send email reply
- `GET /api/email/:userId/threads/summarize` - Summarize threads
- `GET /api/email/:userId/threads/summaries` - Get thread summaries

## Frontend Integration

The frontend should be configured to use the deployed backend URL. Update the API base URL in your frontend environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app
``` 