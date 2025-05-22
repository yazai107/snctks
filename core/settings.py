import json
import os
from dataclasses import dataclass, asdict
from typing import Optional
from huggingface_hub import login
import logging

@dataclass
class GeneralSettings:
    model: str = "microsoft/DialoGPT-medium"

@dataclass
class ChatSettings:
    system_prompt: str = "You are a helpful AI assistant."
    context_length: int = 4096
    history_size: int = 10
    temperature: float = 0.7
    max_tokens: int = 2000

@dataclass
class ImageSettings:
    stability_api_key: str = ""
    width: int = 512
    height: int = 512
    steps: int = 30
    cfg_scale: float = 7.0
    style_preset: str = "photographic"

@dataclass
class ThemeSettings:
    theme: str = "dark"
    accent_color: str = "#3b82f6"
    font_size: int = 14
    font_family: str = "Segoe UI"

class SettingsManager:
    def __init__(self):
        self.data_dir = os.path.join("data")
        self.settings_file = os.path.join(self.data_dir, "user_settings.json")
        
        self.general = GeneralSettings()
        self.chat = ChatSettings()
        self.image = ImageSettings()
        self.theme = ThemeSettings()
        
        self.openrouter_key: str = ""
        self.openai_key: str = ""

        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
        os.makedirs(os.path.dirname(self.settings_file), exist_ok=True)
        
        if os.path.exists(self.settings_file):
            self.load_settings()
        else:
            self.save_settings()

        try:
            hf_token = self.get_setting('general', 'huggingface_token')
            if hf_token:
                 login(token=hf_token, add_to_git_credential=False)
                 print("Successfully logged in to Hugging Face")
        except Exception as e:
            print(f"Error logging in to Hugging Face: {e}")

    def load_settings(self):
        try:
            self.logger.info(f"Loading settings from {self.settings_file}")
            with open(self.settings_file, 'r') as f:
                data = json.load(f)
                self.logger.info(f"Loaded settings data: {json.dumps(data, indent=2)}")
                
            if 'general' in data:
                for key, value in data['general'].items():
                    if hasattr(self.general, key):
                        setattr(self.general, key, value)
            if 'chat' in data:
                for key, value in data['chat'].items():
                    if hasattr(self.chat, key):
                        setattr(self.chat, key, value)
            if 'image' in data:
                for key, value in data['image'].items():
                    if hasattr(self.image, key):
                        setattr(self.image, key, value)
            if 'theme' in data:
                for key, value in data['theme'].items():
                    if hasattr(self.theme, key):
                        setattr(self.theme, key, value)
                        
            if 'api' in data:
                if 'openrouter_key' in data['api']:
                    self.openrouter_key = data['api']['openrouter_key']
                    self.logger.info(f"Loaded OpenRouter key: {self.openrouter_key[:5]}...")
                if 'openai_key' in data['api']:
                    self.openai_key = data['api']['openai_key']
                    self.logger.info(f"Loaded OpenAI key: {self.openai_key[:5]}...")
                    if not self.openai_key.startswith('sk-'):
                        self.logger.error("OpenAI key does not start with 'sk-'")
                    if len(self.openai_key) < 20:
                        self.logger.error("OpenAI key appears to be too short")

            self.logger.info("Settings loaded successfully.")
        except FileNotFoundError:
            self.logger.warning("Settings file not found. Saving default settings.")
            self.save_settings()
        except json.JSONDecodeError:
            self.logger.error("Error decoding settings JSON. Saving default settings.")
            self.save_settings()
        except Exception as e:
            self.logger.error(f"Error loading settings: {e}")
            self.save_settings()

    def save_settings(self):
        try:
            settings_dict = {
                'general': asdict(self.general),
                'chat': asdict(self.chat),
                'image': asdict(self.image),
                'theme': asdict(self.theme),
                'api': {
                    'openrouter_key': self.openrouter_key,
                    'openai_key': self.openai_key,
                }
            }
            
            with open(self.settings_file, 'w') as f:
                json.dump(settings_dict, f, indent=4)
                
            self.logger.info("Settings saved successfully.")
        except Exception as e:
            self.logger.error(f"Error saving settings: {e}")

    def get_all_settings(self):
        return {
            'general': asdict(self.general),
            'chat': asdict(self.chat),
            'image': asdict(self.image),
            'theme': asdict(self.theme),
            'api': {
                'openrouter_key': self.openrouter_key,
                'openai_key': self.openai_key,
            }
        }

    def get_setting(self, section, key, default=None):
        return self.get_all_settings().get(section, {}).get(key, default)

    def set_setting(self, section, key, value):
        try:
            if section == 'general' and hasattr(self.general, key):
                 setattr(self.general, key, value)
            elif section == 'chat' and hasattr(self.chat, key):
                 setattr(self.chat, key, value)
            elif section == 'image' and hasattr(self.image, key):
                 setattr(self.image, key, value)
            elif section == 'theme' and hasattr(self.theme, key):
                 setattr(self.theme, key, value)
            elif section == 'api':
                if key == 'openrouter_key':
                    self.openrouter_key = value
                elif key == 'openai_key':
                    self.openai_key = value
                else:
                     self.logger.warning(f"Attempted to set unknown API key: {key}")
            else:
                self.logger.warning(f"Attempted to set unknown setting section: {section}")

            self.save_settings()
            self.logger.info(f"Setting {section}.{key} updated.")

        except Exception as e:
            self.logger.error(f"Error setting {section}.{key}: {str(e)}") 