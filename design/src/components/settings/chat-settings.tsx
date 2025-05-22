import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { useToast } from '../ui/use-toast'
import type { ChatSettings, SettingsProps } from '@/types/settings'

export function ChatSettings({ settings, onSave }: SettingsProps<ChatSettings>) {
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
        description: "Chat settings have been updated successfully.",
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
        <CardTitle>Chat Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="system_prompt">System Prompt</Label>
            <Input
              id="system_prompt"
              name="system_prompt"
              value={formData.system_prompt}
              onChange={handleChange}
              placeholder="Enter system prompt"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context_length">Context Length</Label>
            <Input
              id="context_length"
              name="context_length"
              type="number"
              min="1"
              value={formData.context_length}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="history_size">History Size</Label>
            <Input
              id="history_size"
              name="history_size"
              type="number"
              min="1"
              value={formData.history_size}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature</Label>
            <Input
              id="temperature"
              name="temperature"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={formData.temperature}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_tokens">Max Tokens</Label>
            <Input
              id="max_tokens"
              name="max_tokens"
              type="number"
              min="1"
              value={formData.max_tokens}
              onChange={handleChange}
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