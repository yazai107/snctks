import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Message } from "@/types/chat";
import { useToast } from "../ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "../ui/dialog";

interface ChatSectionProps {
  onGenerateImage: (prompt: string) => void;
}

const ChatSection = ({ onGenerateImage }: ChatSectionProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Fetch initial settings or use defaults (already handled in backend/settings)
  // const [chatSettings, setChatSettings] = useState<ChatSettings>({
  //   system_prompt: "You are a helpful AI assistant.",
  //   context_length: 4000,
  //   history_size: 10,
  // });

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'x') {
        event.preventDefault();
        setShowClearConfirm(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/chat/history');
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;

    const newMessage: Message = { id: Date.now().toString(), role: "user", content: inputMessage, timestamp: new Date().toISOString() };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputMessage("");

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botResponse: Message = { id: Date.now().toString() + '-bot', role: "assistant", content: data.response, timestamp: new Date().toISOString() };
      setMessages((prevMessages) => [...prevMessages, botResponse]);
      // Optionally, saveHistory([...messages, newMessage, botResponse]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      const errorMessage: Message = { id: Date.now().toString() + '-error', role: "assistant", content: `Error: ${error}`, timestamp: new Date().toISOString() };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleGenerateImageClick = () => {
    if (inputMessage.trim() === "") return;
    onGenerateImage(inputMessage);
    setInputMessage("");
  };

  const handleClearMessages = async () => {
    try {
      const response = await fetch('/api/chat/history', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setMessages([]);
        toast({
          title: "Success",
          description: "Chat history cleared successfully",
        });
      } else {
        throw new Error('Failed to clear chat history');
      }
    } catch (error) {
      console.error("Error clearing chat history:", error);
      toast({
        title: "Error",
        description: "Failed to clear chat history. Please try again.",
        variant: "destructive",
      });
    }
    setShowClearConfirm(false);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-grow overflow-hidden p-4">
        <div className="h-full pr-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg p-3 ${msg.role === 'user' ? 'bg-blue-600 text-white' : msg.role === 'assistant' ? 'bg-gray-700 text-white' : 'bg-red-600 text-white'}`}>
                  <p className="font-semibold">{msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'Peixonauta' : msg.role}</p>
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </CardContent>
      <div className="p-4 border-t border-gray-700 flex items-center space-x-2">
        <Input
          placeholder="Type a message or a prompt for image generation..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-grow"
        />
        <Button onClick={handleSendMessage}>Send</Button>
        <Button onClick={handleGenerateImageClick}>Generate Image</Button>
      </div>

      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Clear Chat</DialogTitle>
          </DialogHeader>
          <div>
            Are you sure you want to clear the chat history? This action cannot be undone.
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleClearMessages} variant="destructive">Clear Chat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ChatSection;