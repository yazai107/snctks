import os
import io
import base64
import requests
from PIL import Image
from io import BytesIO
from core.settings import SettingsManager
import logging
import json
from datetime import datetime
import traceback

class ImageGenerator:
    def __init__(self, settings_manager: SettingsManager):
        self.settings_manager = settings_manager
        self.settings = self.settings_manager.get_all_settings()
        self.api_key = self.settings_manager.get_setting('image', 'stability_api_key')
        self.api_host = 'https://api.stability.ai'
        self.engine_id = 'stable-diffusion-v1-6'
        self.output_dir = os.path.join("data", "generated_images")
        self.index_file = os.path.join(self.output_dir, "images.json")
        os.makedirs(self.output_dir, exist_ok=True)
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        self._load_index()

    def _load_index(self):
        if os.path.exists(self.index_file):
            try:
                with open(self.index_file, 'r') as f:
                    self.image_index = json.load(f)
            except Exception:
                self.image_index = []
        else:
            self.image_index = []

    def _save_index(self):
        try:
            with open(self.index_file, 'w') as f:
                json.dump(self.image_index, f, indent=2)
        except Exception as e:
            logging.error(f"Error saving image index: {e}")

    def generate_image(self, prompt: str) -> str:
        logging.info(f"Generating image for prompt: '{prompt[:50]}...'")
        
        if not self.api_key:
            raise ValueError("Stability API key is not configured. Please set it in settings.")
            
        url = f"{self.api_host}/v1/generation/{self.engine_id}/text-to-image"
        
        body = {
            "text_prompts": [
                {
                    "text": prompt,
                    "weight": 1
                }
            ],
            "cfg_scale": self.settings['image']['cfg_scale'],
            "height": self.settings['image']['height'],
            "width": self.settings['image']['width'],
            "samples": 1,
            "steps": self.settings['image']['steps'],
            "style_preset": self.settings['image']['style_preset']
        }
        
        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        try:
            response = requests.post(url, headers=headers, json=body)
            
            if response.status_code != 200:
                error_msg = f"Stability API error: {response.status_code} - {response.text}"
                self.logger.error(error_msg)
                raise Exception(error_msg)
                
            data = response.json()
            
            if "artifacts" not in data or not data["artifacts"]:
                raise Exception("No image data in response")
                
            base64_image = data["artifacts"][0]["base64"]
            
            image_data = base64.b64decode(base64_image)
            image = Image.open(io.BytesIO(image_data))
            image_path = os.path.join(self.output_dir, f"generated_{len(self.image_index)+1}.png")
            image.save(image_path)
            
            self.image_index.append({
                "path": image_path,
                "prompt": prompt,
                "timestamp": str(datetime.now())
            })
            self._save_index()
            
            return base64_image
            
        except Exception as e:
            self.logger.error(f"Error generating image: {str(e)}")
            self.logger.error(f"Traceback: {traceback.format_exc()}")
            raise

    def get_images(self):
        self._load_index()
        return self.image_index

    def generate_image_from_base64(self, base64_image: str) -> str:
        try:
            image = Image.open(BytesIO(bytes.fromhex(base64_image)))
            
            image_path = os.path.join(self.output_dir, f"generated_{len(os.listdir(self.output_dir)) + 1}.png")
            image.save(image_path)
            
            return image_path
            
        except Exception as e:
            print(f"Error generating image: {e}")
            raise Exception(f"Failed to generate image: {str(e)}") 