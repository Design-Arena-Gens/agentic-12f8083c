# Dog Video Factory 🐕

AI-powered content creation factory that generates dog videos using Google's Veo 3.1 and automatically uploads them to YouTube Shorts.

## Features

- 🎬 Generate AI videos using Google Veo 3.1
- 📱 Optimized for YouTube Shorts (9:16 vertical format)
- 🤖 Auto-generate video metadata with AI
- 📤 Automatic YouTube upload
- 🎨 Beautiful, intuitive UI
- ⚡ Fast and responsive

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

Create a `.env` file with the following:

```env
# Google Cloud API Key for Veo 3.1
GOOGLE_API_KEY=your_google_api_key

# YouTube API Credentials
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/auth/callback
YOUTUBE_REFRESH_TOKEN=your_refresh_token

# OpenAI API Key (optional, for better metadata)
OPENAI_API_KEY=your_openai_key
```

### 3. Get Google Cloud API Key (Veo 3.1)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Enable the Generative Language API
4. Add the key to your `.env` file

### 4. Set Up YouTube API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials (Desktop app)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback`
6. Get your refresh token:
   - Start the dev server: `npm run dev`
   - Visit: `http://localhost:3000/api/auth/url`
   - Follow the OAuth flow
   - Copy the refresh token to your `.env` file

### 5. Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter a custom prompt or use one of the quick prompts
2. Click "Generate Video" - Veo 3.1 will create the video
3. The video will automatically upload to YouTube (if enabled)
4. View your video on YouTube or download it

## Demo Mode

The app includes a demo mode that works without API keys, showing how the interface works with sample videos.

## Deployment

Deploy to Vercel:

```bash
vercel --prod
```

Add your environment variables in the Vercel dashboard.

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Google Veo 3.1** - AI video generation
- **YouTube Data API** - Video uploads
- **OpenAI GPT-4** - Metadata generation

## License

MIT
