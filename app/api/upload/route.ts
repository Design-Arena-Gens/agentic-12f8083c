import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import OpenAI from 'openai'

const youtube = google.youtube('v3')

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, prompt, thumbnail } = await request.json()

    if (!videoUrl || !prompt) {
      return NextResponse.json(
        { error: 'Video URL and prompt are required' },
        { status: 400 }
      )
    }

    // Check for YouTube credentials
    const clientId = process.env.YOUTUBE_CLIENT_ID
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN

    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json(
        {
          error: 'YouTube credentials not configured. Please set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN.',
          message: 'Demo mode: Video generated but not uploaded. Configure YouTube API credentials to enable uploading.'
        },
        { status: 200 } // Return 200 so the UI doesn't show an error
      )
    }

    // Generate video metadata using OpenAI
    const openaiKey = process.env.OPENAI_API_KEY
    let title = `Amazing Dog Video - ${new Date().toLocaleDateString()}`
    let description = `Check out this amazing dog video!\n\n${prompt}\n\n#Shorts #Dogs #Pets #Cute`
    let tags = ['shorts', 'dogs', 'pets', 'cute', 'animals']

    if (openaiKey) {
      try {
        const openai = new OpenAI({ apiKey: openaiKey })

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: `Generate YouTube Shorts metadata for this video prompt: "${prompt}"

            Return a JSON object with:
            - title (max 100 chars, catchy and engaging)
            - description (include hashtags, engaging copy)
            - tags (array of 10-15 relevant tags)

            Make it optimized for YouTube Shorts discovery.`
          }],
          response_format: { type: 'json_object' }
        })

        const metadata = JSON.parse(completion.choices[0].message.content || '{}')
        title = metadata.title || title
        description = metadata.description || description
        tags = metadata.tags || tags
      } catch (error) {
        console.error('OpenAI metadata generation failed:', error)
      }
    }

    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback'
    )

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    })

    // Download video
    const videoResponse = await fetch(videoUrl)
    if (!videoResponse.ok) {
      throw new Error('Failed to download video')
    }

    const videoBuffer = await videoResponse.arrayBuffer()
    const videoBlob = Buffer.from(videoBuffer)

    // Upload to YouTube
    const uploadResponse = await youtube.videos.insert({
      auth: oauth2Client,
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId: '15', // Pets & Animals category
        },
        status: {
          privacyStatus: 'public', // or 'unlisted' or 'private'
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: videoBlob as any,
      },
    })

    const videoId = uploadResponse.data.id
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`

    return NextResponse.json({
      youtubeUrl,
      videoId,
      title,
      success: true
    })

  } catch (error) {
    console.error('YouTube upload error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Upload failed',
        message: 'Failed to upload to YouTube. Please check your API credentials and try again.'
      },
      { status: 500 }
    )
  }
}
