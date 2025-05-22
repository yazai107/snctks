import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { useToast } from '../ui/use-toast'
import { GeneralSettings as GeneralSettingsType } from "@/types/settings"; // Import the type

interface GeneralSettingsProps {
  settings: GeneralSettingsType; // Use the imported type
  onSave: (settings: GeneralSettingsType) => Promise<void>;
}

export function GeneralSettings({ settings, onSave }: GeneralSettingsProps) {
  const [formData, setFormData] = useState<GeneralSettingsType>(settings); // Use GeneralSettingsType
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
        description: "General settings have been updated successfully.",
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
        <CardTitle>General Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="Enter model name"
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