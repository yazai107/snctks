import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { useToast } from '../ui/use-toast'
import type { ThemeSettings, SettingsProps } from '@/types/settings'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

export default function ThemeSettings({ settings, onSave }: SettingsProps<ThemeSettings>) {
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
        description: "Theme settings have been updated successfully.",
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
        <CardTitle>Theme Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={formData.theme}
              onValueChange={(value) => setFormData(prev => ({ ...prev, theme: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accent_color">Accent Color</Label>
            <Input
              id="accent_color"
              name="accent_color"
              type="color"
              value={formData.accent_color}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="font_size">Font Size</Label>
            <Input
              id="font_size"
              name="font_size"
              type="number"
              min="12"
              max="24"
              value={formData.font_size}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="font_family">Font Family</Label>
            <Input
              id="font_family"
              name="font_family"
              value={formData.font_family}
              onChange={handleChange}
              placeholder="Enter font family"
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