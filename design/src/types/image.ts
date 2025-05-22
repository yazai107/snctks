export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: string;
  selected: boolean;
}

export interface ImageSettings {
  style_preset: string;
  cfg_scale: number;
  steps: number;
  width: number;
  height: number;
}