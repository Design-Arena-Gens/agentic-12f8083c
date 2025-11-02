'use client'

import { useState } from 'react'
import { Video, Upload, Loader2, CheckCircle, AlertCircle, Youtube, Sparkles } from 'lucide-react'

interface GenerationJob {
  id: string
  prompt: string
  status: 'generating' | 'uploading' | 'completed' | 'error'
  videoUrl?: string
  youtubeUrl?: string
  error?: string
  thumbnail?: string
}

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [jobs, setJobs] = useState<GenerationJob[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [autoUpload, setAutoUpload] = useState(true)

  const dogPrompts = [
    'A golden retriever puppy playing with a ball in slow motion, cinematic lighting',
    'Adorable corgi running on a beach at sunset, waves crashing',
    'Playful husky jumping in the snow, 4k quality',
    'Cute french bulldog doing tricks, studio lighting',
    'Border collie catching a frisbee mid-air, slow motion',
  ]

  const generateVideo = async (customPrompt?: string) => {
    const videoPrompt = customPrompt || prompt || dogPrompts[Math.floor(Math.random() * dogPrompts.length)]

    const jobId = `job-${Date.now()}`
    const newJob: GenerationJob = {
      id: jobId,
      prompt: videoPrompt,
      status: 'generating'
    }

    setJobs(prev => [newJob, ...prev])
    setIsGenerating(true)

    try {
      // Generate video using Veo 3.1
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: videoPrompt })
      })

      const generateData = await generateResponse.json()

      if (!generateResponse.ok) {
        throw new Error(generateData.error || 'Failed to generate video')
      }

      setJobs(prev => prev.map(job =>
        job.id === jobId
          ? { ...job, videoUrl: generateData.videoUrl, thumbnail: generateData.thumbnail }
          : job
      ))

      // Auto-upload to YouTube if enabled
      if (autoUpload) {
        setJobs(prev => prev.map(job =>
          job.id === jobId ? { ...job, status: 'uploading' } : job
        ))

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl: generateData.videoUrl,
            prompt: videoPrompt,
            thumbnail: generateData.thumbnail
          })
        })

        const uploadData = await uploadResponse.json()

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Failed to upload to YouTube')
        }

        setJobs(prev => prev.map(job =>
          job.id === jobId
            ? { ...job, status: 'completed', youtubeUrl: uploadData.youtubeUrl }
            : job
        ))
      } else {
        setJobs(prev => prev.map(job =>
          job.id === jobId ? { ...job, status: 'completed' } : job
        ))
      }

    } catch (error) {
      setJobs(prev => prev.map(job =>
        job.id === jobId
          ? { ...job, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
          : job
      ))
    } finally {
      setIsGenerating(false)
    }
  }

  const manualUpload = async (job: GenerationJob) => {
    if (!job.videoUrl) return

    setJobs(prev => prev.map(j =>
      j.id === job.id ? { ...j, status: 'uploading' } : j
    ))

    try {
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: job.videoUrl,
          prompt: job.prompt,
          thumbnail: job.thumbnail
        })
      })

      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Failed to upload to YouTube')
      }

      setJobs(prev => prev.map(j =>
        j.id === job.id
          ? { ...j, status: 'completed', youtubeUrl: uploadData.youtubeUrl }
          : j
      ))
    } catch (error) {
      setJobs(prev => prev.map(j =>
        j.id === job.id
          ? { ...j, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
          : j
      ))
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Video className="w-12 h-12 text-indigo-600" />
            <h1 className="text-5xl font-bold text-gray-800">Dog Video Factory</h1>
          </div>
          <p className="text-xl text-gray-600">Generate AI videos of dogs for YouTube Shorts using Veo 3.1</p>
        </div>

        {/* Generation Panel */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Prompt (leave blank for random)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A happy golden retriever playing in a park..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoUpload}
                onChange={(e) => setAutoUpload(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Auto-upload to YouTube</span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => generateVideo()}
              disabled={isGenerating}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Video
                </>
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 font-medium">Quick Generate:</p>
            <div className="flex flex-wrap gap-2">
              {dogPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => generateVideo(p)}
                  disabled={isGenerating}
                  className="text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  {p.split(',')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {job.status === 'generating' && (
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                  )}
                  {job.status === 'uploading' && (
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-yellow-600 animate-pulse" />
                    </div>
                  )}
                  {job.status === 'completed' && (
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  )}
                  {job.status === 'error' && (
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-gray-800 font-medium mb-2">{job.prompt}</p>

                  {job.status === 'generating' && (
                    <p className="text-sm text-blue-600">Generating video with Veo 3.1...</p>
                  )}

                  {job.status === 'uploading' && (
                    <p className="text-sm text-yellow-600">Uploading to YouTube...</p>
                  )}

                  {job.status === 'error' && (
                    <p className="text-sm text-red-600">Error: {job.error}</p>
                  )}

                  {job.status === 'completed' && (
                    <div className="space-y-2">
                      {job.videoUrl && (
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-gray-500" />
                          <a
                            href={job.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:underline"
                          >
                            View Generated Video
                          </a>
                        </div>
                      )}
                      {job.youtubeUrl && (
                        <div className="flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-red-600" />
                          <a
                            href={job.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-red-600 hover:underline font-medium"
                          >
                            Watch on YouTube
                          </a>
                        </div>
                      )}
                      {job.videoUrl && !job.youtubeUrl && (
                        <button
                          onClick={() => manualUpload(job)}
                          className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Youtube className="w-4 h-4" />
                          Upload to YouTube
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {jobs.length === 0 && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No videos generated yet. Click "Generate Video" to start!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
