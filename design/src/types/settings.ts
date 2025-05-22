export interface GeneralSettings {
  model: string;
}

export interface ChatSettings {
  system_prompt: string;
  context_length: number;
  history_size: number;
  temperature: number;
  max_tokens: number;
}

export interface ImageSettings {
  stability_api_key: string;
  width: number;
  height: number;
  steps: number;
  cfg_scale: number;
  style_preset: string;
}

export interface ThemeSettings {
  theme: string;
  accent_color: string;
  font_size: number;
  font_family: string;
}

export interface ApiSettings {
  openrouter_key: string;
  openai_key: string;
}

export interface Settings {
  general: GeneralSettings;
  chat: ChatSettings;
  image: ImageSettings;
  theme: ThemeSettings;
  api: ApiSettings;
}

export interface SettingsProps<T> {
  settings: T;
  onSave: (settings: T) => Promise<void>;
}