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
import shutil

class ImageGenerator:
    def __init__(self, settings_manager: SettingsManager):
        self.settings_manager = settings_manager
        self.settings = self.settings_manager.get_all_settings()
        self.api_key = self.settings_manager.get_setting('image', 'stability_api_key')
        self.api_host = 'https://api.stability.ai'
        self.engine_id = 'stable-diffusion-v1-6'
        self.output_dir = os.path.join("data", "generated_images")
        self.index_file = os.path.join(self.output_dir, "images.json")
        self.max_storage_gb = 1  # Maximum storage in GB
        self.max_image_size = 1024  # Maximum image dimension
        self.compression_quality = 85  # JPEG compression quality
        os.makedirs(self.output_dir, exist_ok=True)
        self.logger = logging.getLogger(__name__)
        self._load_index()
        self._cleanup_old_images()

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

    def _cleanup_old_images(self):
        """Clean up old images if storage exceeds limit"""
        try:
            total_size = sum(os.path.getsize(os.path.join(self.output_dir, f)) 
                           for f in os.listdir(self.output_dir) 
                           if f.endswith('.png'))
            
            if total_size > (self.max_storage_gb * 1024 * 1024 * 1024):  # Convert GB to bytes
                # Sort images by timestamp
                sorted_images = sorted(self.image_index, 
                                    key=lambda x: datetime.fromisoformat(x['timestamp']))
                
                # Remove oldest images until we're under the limit
                while total_size > (self.max_storage_gb * 1024 * 1024 * 1024) and sorted_images:
                    oldest = sorted_images.pop(0)
                    try:
                        os.remove(oldest['path'])
                        total_size -= os.path.getsize(oldest['path'])
                        self.image_index.remove(oldest)
                    except Exception as e:
                        self.logger.error(f"Error removing old image: {e}")
                
                self._save_index()
        except Exception as e:
            self.logger.error(f"Error during cleanup: {e}")

    def _optimize_image(self, image: Image.Image) -> Image.Image:
        """Optimize image size and quality"""
        # Resize if too large
        if max(image.size) > self.max_image_size:
            ratio = self.max_image_size / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Convert to RGB if needed
        if image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')
        
        return image

    def generate_image(self, prompt: str) -> str:
        self.logger.info(f"Generating image for prompt: '{prompt[:50]}...'")
        
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
            "height": 512,
            "width": 512,
            "samples": 1,
            "steps": self.settings['image']['steps'],
            "style_preset": self.settings['image']['style_preset']
        }
        
        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        try:
            self.logger.info("=== Starting Image Generation Request ===")
            self.logger.info(f"Request URL: {url}")
            self.logger.info(f"Request Headers: {json.dumps(headers, indent=2)}")
            self.logger.info(f"Request Body: {json.dumps(body, indent=2)}")
            
            response = requests.post(url, headers=headers, json=body)
            
            self.logger.info("=== API Response Details ===")
            self.logger.info(f"Response Status Code: {response.status_code}")
            self.logger.info(f"Response Headers: {dict(response.headers)}")
            self.logger.info(f"Response Text: {response.text}")
            
            if response.status_code != 200:
                error_msg = self._handle_error_response(response)
                raise Exception(error_msg)
                
            data = response.json()
            
            if "artifacts" not in data or not data["artifacts"]:
                self.logger.error(f"No image data in response. Full response: {json.dumps(data, indent=2)}")
                raise Exception("No image data in response")
                
            base64_image = data["artifacts"][0]["base64"]
            
            try:
                image_data = base64.b64decode(base64_image)
                image = Image.open(io.BytesIO(image_data))
                
                # Optimize image
                image = self._optimize_image(image)
                
                # Save with compression
                image_path = os.path.join(self.output_dir, f"generated_{len(self.image_index)+1}.jpg")
                image.save(image_path, 'JPEG', quality=self.compression_quality, optimize=True)
                
                self.image_index.append({
                    "path": image_path,
                    "prompt": prompt,
                    "timestamp": str(datetime.now())
                })
                self._save_index()
                
                # Cleanup if needed
                self._cleanup_old_images()
                
                return base64_image
            except Exception as e:
                self.logger.error(f"Error processing image data: {str(e)}")
                self.logger.error(f"Traceback: {traceback.format_exc()}")
                raise Exception(f"Failed to process image data: {str(e)}")
            
        except Exception as e:
            self.logger.error("=== Image Generation Failed ===")
            self.logger.error(f"Error: {str(e)}")
            self.logger.error(f"Traceback: {traceback.format_exc()}")
            raise

    def _handle_error_response(self, response):
        """Handle different error responses from the API"""
        if response.status_code == 401:
            return "Invalid API key. Please check your Stability AI API key in settings."
        elif response.status_code == 403:
            return "API key doesn't have access to this engine. Please check your subscription."
        elif response.status_code == 404:
            available_engines = self._get_available_engines()
            if available_engines:
                self.engine_id = available_engines[0]
                return f"Engine not found. Switching to available engine: {available_engines[0]}"
            return f"Engine not found. Available engines: {available_engines}"
        elif response.status_code == 429:
            return "Rate limit exceeded or insufficient credits. Please check your Stability AI account balance."
        else:
            return f"Stability API error: {response.status_code} - {response.text}"

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

    def _get_available_engines(self):
        """Get list of available engines for the API key."""
        try:
            url = f"{self.api_host}/v1/engines/list"
            headers = {
                "Accept": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                engines = response.json()
                return [engine['id'] for engine in engines]
            return []
        except Exception as e:
            self.logger.error(f"Error getting available engines: {str(e)}")
            return [] 