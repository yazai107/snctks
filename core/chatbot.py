import os
import json
import requests
from datetime import datetime
from core.settings import SettingsManager
import logging
import traceback

class Chatbot:
    def __init__(self, settings_manager: SettingsManager):
        self.settings = settings_manager
        self.conversation_history = []
        self.history_file = os.path.join("data", "chat_history", "chat_history.json")
        os.makedirs(os.path.dirname(self.history_file), exist_ok=True)
        self.load_history()
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.api_key = self.settings.get_setting('api', 'openrouter_key')
        
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        
        # Add debug logging for API key
        self.logger.info(f"OpenRouter API key loaded: {'Present' if self.api_key else 'Missing'}")
        if self.api_key:
            self.logger.info(f"API key starts with: {self.api_key[:10]}...")

    def generate_response(self, prompt: str) -> str:
        logging.info(f"Generating response for prompt: '{prompt[:50]}...'")
        try:
            if not self.api_key:
                raise ValueError("OpenRouter API key is not configured. Please set it in settings.")

            self.conversation_history.append({
                "role": "user",
                "content": prompt
            })
            self.save_history()

            messages = [
                {"role": "system", "content": self.settings.get_setting('chat', 'system_prompt')},
                *self.conversation_history[-self.settings.get_setting('chat', 'context_length'):]
            ]

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "AI Assistant"
            }
            response = requests.post(
                self.api_url,
                headers=headers,
                json={
                    "model": "mistralai/Mistral-7B-Instruct-v0.2",
                    "messages": messages,
                    "temperature": self.settings.get_setting('chat', 'temperature'),
                    "max_tokens": self.settings.get_setting('chat', 'max_tokens')
                }
            )
            
            if response.status_code != 200:
                error_msg = f"API error: {response.text}"
                self.logger.error(error_msg)
                raise Exception(error_msg)
                
            reply = response.json()['choices'][0]['message']['content']
            
            self.conversation_history.append({
                "role": "assistant",
                "content": reply
            })
            self.save_history()
            return reply
        except Exception as e:
            logging.error(f"API error: {e}")
            return f"Error: {e}"

    def load_history(self):
        try:
            if os.path.exists(self.history_file) and os.path.getsize(self.history_file) > 0:
                with open(self.history_file, 'r') as f:
                    self.conversation_history = json.load(f)
            else:
                self.conversation_history = []
        except Exception as e:
            logging.error(f"Error loading chat history: {e}")
            self.conversation_history = []

    def save_history(self):
        try:
            os.makedirs(os.path.dirname(self.history_file), exist_ok=True)
            with open(self.history_file, 'w') as f:
                json.dump(self.conversation_history, f, indent=2)
        except Exception as e:
            logging.error(f"Error saving chat history: {e}") 