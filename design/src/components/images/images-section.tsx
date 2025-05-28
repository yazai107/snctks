import { useState, useEffect } from 'react'
import ImageGrid from './image-grid'
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { useToast } from "../ui/use-toast"

export function ImagesSection() {
  const [images, setImages] = useState<string[]>([])
  const [prompt, setPrompt] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/images')
      if (response.ok) {
        const data = await response.json()
        setImages(data)
      }
    } catch (error) {
      console.error('Error loading images:', error)
      toast({
        title: "Error",
        description: "Failed to load images. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    try {
      console.log('Sending request to generate image...')
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()
      console.log('Response from server:', data)
      
      if (!response.ok) {
        console.error('Server error:', data)
        throw new Error(data.error || 'Failed to generate image')
      }

      setImages(prev => [...prev, data.image_url])
      setPrompt("")
      toast({
        title: "Success",
        description: "Image generated successfully.",
      })
    } catch (error) {
      console.error('Error generating image:', error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate image. Please try again."
      toast({
        title: "Error Generating Image",
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // Show for 10 seconds to give time to read
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input 
          placeholder="Describe the image you want to generate..." 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <Button onClick={handleGenerate}>Generate</Button>
      </div>
      <ImageGrid images={images} />
    </div>
  )
}