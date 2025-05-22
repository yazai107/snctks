import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettings } from "./general-settings";
import { ChatSettings } from "./chat-settings";
import { ImageSettings } from "./image-settings";
import ThemeSettings from "./theme-settings";
import { ApiSettings } from "./api-settings";
import type { Settings } from "@/types/settings";
import { useToast } from '../ui/use-toast';

interface SettingsSectionProps {
  onSave: (section: string, settings: any) => Promise<void>;
}

export function SettingsSection({ onSave }: SettingsSectionProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<Settings | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load settings when component mounts
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (section: string, newSettings: any) => {
    try {
      await onSave(section, newSettings);
      // Update local state after successful save
      setSettings(prev => prev ? {
        ...prev,
        [section]: newSettings
      } : null);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  if (!settings) {
    return <div>Loading Settings...</div>; // Or a loading spinner
  }

  return (
    <div className="container mx-auto p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <GeneralSettings
            settings={settings.general}
            onSave={(newSettings) => handleSave('general', newSettings)}
          />
        </TabsContent>
        
        <TabsContent value="chat">
          <ChatSettings
            settings={settings.chat}
            onSave={(newSettings) => handleSave('chat', newSettings)}
          />
        </TabsContent>
        
        <TabsContent value="image">
          <ImageSettings
            settings={settings.image}
            onSave={(newSettings) => handleSave('image', newSettings)}
          />
        </TabsContent>
        
        <TabsContent value="theme">
          <ThemeSettings
            settings={settings.theme}
            onSave={(newSettings) => handleSave('theme', newSettings)}
          />
        </TabsContent>

        <TabsContent value="api">
          <ApiSettings
            settings={settings.api}
            onSave={(newSettings) => handleSave('api', newSettings)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SettingsSection;