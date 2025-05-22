import { useState, useEffect } from 'react'
import { ThemeProvider, useTheme } from './components/theme-provider'
import ChatSection from './components/chat/chat-section'
import { ImagesSection } from './components/images/images-section'
import { SettingsSection } from './components/settings/settings-section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Toaster } from './components/ui/toaster'
import { useToast } from './components/ui/use-toast'

export default function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const { toast } = useToast()
  const { setTheme } = useTheme()

  // Handle window close
  useEffect(() => {
    const handleClose = () => {
      // Save any pending changes before closing
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.send('save-all')
      }
    }

    window.addEventListener('beforeunload', handleClose)
    return () => window.removeEventListener('beforeunload', handleClose)
  }, [])

  useEffect(() => {
    // Fetch initial settings to get the theme
    const fetchInitialSettings = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.theme && data.theme.theme) {
            setTheme(data.theme.theme);
          }
        } else {
          console.error('Error fetching initial settings:', response.statusText);
          toast({
            title: "Error",
            description: "Failed to load initial settings.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching initial settings:', error);
        toast({
          title: "Error",
          description: "Failed to load initial settings.",
          variant: "destructive",
        });
      }
    };

    fetchInitialSettings();
  }, []);

  // Handle settings save
  const handleSaveSettings = async (section: string, newSettings: any) => {
    try {
      const response = await fetch('http://localhost:8000/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [section]: newSettings }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Success",
        description: `${section} settings saved successfully.`,
      });

      // If theme settings were saved, update the theme state
      if (section === 'theme' && newSettings.theme) {
          setTheme(newSettings.theme as "light" | "dark" | "system");
      }

    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: `Failed to save ${section} settings. Please try again.`, 
        variant: "destructive",
      });
      throw error; // Re-throw to allow SettingsSection to handle it
    }
  };

  // Handle image generation
  const handleGenerateImage = async (prompt: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: "Image generated successfully.",
      })
      return data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="chat">
            <ChatSection onGenerateImage={handleGenerateImage} />
          </TabsContent>
          <TabsContent value="images">
            <ImagesSection />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsSection onSave={handleSaveSettings} />
          </TabsContent>
        </Tabs>
        <Toaster />
      </div>
    </ThemeProvider>
  )
}