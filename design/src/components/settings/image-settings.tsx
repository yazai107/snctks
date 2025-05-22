import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { useToast } from '../ui/use-toast'
import type { ImageSettings, SettingsProps } from '@/types/settings'

export function ImageSettings({ settings, onSave }: SettingsProps<ImageSettings>) {
  const [formData, setFormData] = useState(settings)
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSave(formData)
      toast({
        title: "Settings Saved",
        description: "Image settings have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Image Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stability_api_key">Stability API Key</Label>
            <Input
              id="stability_api_key"
              name="stability_api_key"
              type="password"
              value={formData.stability_api_key}
              onChange={handleChange}
              placeholder="Enter your Stability API key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              name="width"
              type="number"
              min="256"
              max="1024"
              step="64"
              value={formData.width}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              name="height"
              type="number"
              min="256"
              max="1024"
              step="64"
              value={formData.height}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="steps">Steps</Label>
            <Input
              id="steps"
              name="steps"
              type="number"
              min="1"
              max="50"
              value={formData.steps}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cfg_scale">CFG Scale</Label>
            <Input
              id="cfg_scale"
              name="cfg_scale"
              type="number"
              min="1"
              max="20"
              step="0.5"
              value={formData.cfg_scale}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="style_preset">Style Preset</Label>
            <Input
              id="style_preset"
              name="style_preset"
              value={formData.style_preset}
              onChange={handleChange}
              placeholder="Enter style preset"
            />
          </div>

          <Button type="submit" className="w-full">
            Save Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}