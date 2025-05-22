import { useState, useEffect } from 'react'
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { useToast } from "../ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/label'
import { ApiSettings as ApiSettingsType } from "@/types/settings";

interface ApiSettingsProps {
  settings: ApiSettingsType;
  onSave: (settings: ApiSettingsType) => Promise<void>;
}

export function ApiSettings({ settings, onSave }: ApiSettingsProps) {
  const [formData, setFormData] = useState<ApiSettingsType>(settings);
  const { toast } = useToast()

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      toast({
        title: "Settings Saved",
        description: "API settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openrouter_key">OpenRouter API Key</Label>
            <Input
              id="openrouter_key"
              name="openrouter_key"
              type="password"
              value={formData.openrouter_key}
              onChange={handleChange}
              placeholder="Enter your OpenRouter API key"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="openai_key">OpenAI API Key</Label>
            <Input
              id="openai_key"
              name="openai_key"
              type="password"
              value={formData.openai_key}
              onChange={handleChange}
              placeholder="Enter your OpenAI API key"
            />
          </div>
          <Button type="submit">Save Settings</Button>
        </form>
      </CardContent>
    </Card>
  );
} 