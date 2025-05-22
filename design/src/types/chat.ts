export type MessageRole = "user" | "assistant" | "system" | "image" | "fish";

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  avatar?: string;
  imageUrl?: string;
}

export interface ChatSettings {
  system_prompt: string;
  context_length: number;
  history_size: number;
}