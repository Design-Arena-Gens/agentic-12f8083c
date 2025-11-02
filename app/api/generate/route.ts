import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOOGLE_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google API key not configured. Please add GOOGLE_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    // Format prompt for YouTube Shorts (vertical 9:16 format)
    const formattedPrompt = `${prompt}. Vertical video format 9:16 aspect ratio, duration 15-30 seconds, perfect for YouTube Shorts, high quality 4K, smooth motion`

    // Call Google Veo 3.1 API
    // Note: Using the Vertex AI API endpoint for Veo 3.1
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1:generateVideo?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: formattedPrompt,
          config: {
            aspectRatio: '9:16', // Vertical for YouTube Shorts
            duration: 20, // 20 seconds
            quality: 'high'
          }
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Veo API Error:', errorData)

      // Return a simulated response for demo purposes when API is not available
      return NextResponse.json({
        videoUrl: 'https://storage.googleapis.com/demo-videos/sample-dog-video.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=711&fit=crop',
        message: 'Demo mode: Using sample video. Configure GOOGLE_API_KEY for real generation.',
        isDemo: true
      })
    }

    const data = await response.json()

    // Poll for video completion if needed
    let videoUrl = data.videoUrl || data.video?.uri
    let operationName = data.name

    // If we have an operation name, poll for completion
    if (operationName && !videoUrl) {
      for (let i = 0; i < 60; i++) { // Poll for up to 5 minutes
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds

        const statusResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`
        )

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()

          if (statusData.done) {
            videoUrl = statusData.response?.videoUrl || statusData.response?.video?.uri
            break
          }
        }
      }
    }

    if (!videoUrl) {
      throw new Error('Video generation timed out or failed')
    }

    return NextResponse.json({
      videoUrl,
      thumbnail: data.thumbnail || `${videoUrl}-thumbnail.jpg`,
      duration: data.duration || 20
    })

  } catch (error) {
    console.error('Video generation error:', error)

    // Fallback to demo mode on any error
    return NextResponse.json({
      videoUrl: 'https://storage.googleapis.com/demo-videos/sample-dog-video.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=711&fit=crop',
      message: 'Demo mode: Using sample video. Check your API configuration.',
      isDemo: true
    })
  }
}
