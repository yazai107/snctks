from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from core.chatbot import Chatbot
from core.image_generator import ImageGenerator
from core.settings import SettingsManager
import os
from pathlib import Path
import base64
import sys
import json
import logging
import traceback
from datetime import datetime

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),  # Log to console
        logging.FileHandler('app.log')      # Log to file
    ]
)

static_folder = os.path.abspath('design/dist')
logging.info(f"Static folder path: {static_folder}")
logging.info(f"Static folder exists: {os.path.exists(static_folder)}")

app = Flask(__name__, 
           static_folder=static_folder,
           static_url_path='')

app.logger.setLevel(logging.DEBUG)
for handler in app.logger.handlers[:]:
    app.logger.removeHandler(handler)
console_handler = logging.StreamHandler(sys.stdout)
file_handler = logging.FileHandler('app.log')
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
file_handler.setFormatter(formatter)
app.logger.addHandler(console_handler)
app.logger.addHandler(file_handler)

werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_logger.setLevel(logging.DEBUG)
for handler in werkzeug_logger.handlers[:]:
    werkzeug_logger.removeHandler(handler)
werkzeug_logger.addHandler(console_handler)
werkzeug_logger.addHandler(file_handler)

@app.before_request
def log_request_info():
    app.logger.info('Headers: %s', request.headers)
    app.logger.info('Body: %s', request.get_data())
    if request.is_json:
        app.logger.info('JSON Body: %s', request.get_json())

CORS(app)

settings_manager = SettingsManager()
chatbot = Chatbot(settings_manager)
image_generator = ImageGenerator(settings_manager)

IMAGES_DIR = os.path.join(os.path.dirname(__file__), 'data', 'generated_images')
os.makedirs(IMAGES_DIR, exist_ok=True)

@app.route('/')
def serve_index():
    app.logger.info("Serving index.html")
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    app.logger.info(f"Serving static file: {path}")
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('data', filename)

@app.route('/api/settings', methods=['GET'])
def get_settings():
    try:
        settings_data = settings_manager.get_all_settings()
        app.logger.info(f"Serving settings: {settings_data}")
        return jsonify(settings_data)
    except Exception as e:
        app.logger.error(f"Error getting settings: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings', methods=['POST'])
def update_settings():
    try:
        data = request.json
        app.logger.info(f"Received settings update: {data}")
        for section, values in data.items():
            for key, value in values.items():
                settings_manager.set_setting(section, key, value)
        app.logger.info("Settings updated successfully.")
        return jsonify({'message': 'Settings updated successfully'})
    except Exception as e:
        app.logger.error(f"Error updating settings: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    
    if not message:
        return jsonify({'error': 'No message provided'}), 400
    
    try:
        response = chatbot.generate_response(message)
        return jsonify({'response': response})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-image', methods=['POST'])
def generate_image():
    try:
        data = request.json
        prompt = data.get('prompt', '')
        
        if not prompt:
            app.logger.error("No prompt provided in request")
            return jsonify({'error': 'No prompt provided'}), 400
        
        app.logger.info(f"Generating image for prompt: {prompt}")
        try:
            image_data = image_generator.generate_image(prompt)
            app.logger.info("Image generated successfully")
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'image_{timestamp}.png'
            filepath = os.path.join(IMAGES_DIR, filename)
            
            app.logger.info("Saving generated image...")
            try:
                image_bytes = base64.b64decode(image_data)
                with open(filepath, 'wb') as f:
                    f.write(image_bytes)
                app.logger.info(f"Image saved to {filepath}")
            except Exception as e:
                app.logger.error(f"Error saving image: {str(e)}")
                return jsonify({'error': 'Failed to save generated image'}), 500
            
            return jsonify({'image_url': f'/api/images/{filename}'})
            
        except Exception as e:
            app.logger.error(f"Error in image_generator.generate_image: {str(e)}")
            app.logger.error(f"Traceback: {traceback.format_exc()}")
            return jsonify({'error': str(e)}), 500
            
    except Exception as e:
        app.logger.error(f"Unexpected error in generate_image endpoint: {str(e)}")
        app.logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/images')
def list_images():
    try:
        images = []
        for filename in os.listdir(IMAGES_DIR):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                images.append(f'/api/images/{filename}')
        images.sort(key=lambda x: os.path.getmtime(os.path.join(IMAGES_DIR, os.path.basename(x))), reverse=True)
        return jsonify(images)
    except FileNotFoundError:
        return jsonify([])
    except Exception as e:
        app.logger.error(f"Error listing images: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/images/<path:filename>')
def serve_image(filename):
    return send_from_directory(IMAGES_DIR, filename)

@app.route('/api/chat/history', methods=['GET'])
def get_chat_history():
    try:
        history = chatbot.conversation_history
        return jsonify(history)
    except Exception as e:
        logging.error(f"Error getting chat history: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat/history', methods=['DELETE'])
def clear_chat_history():
    try:
        chatbot.conversation_history = []
        chatbot.save_history()
        return jsonify({'message': 'Chat history cleared successfully'})
    except Exception as e:
        logging.error(f"Error clearing chat history: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    os.makedirs(os.path.join('data', 'chat_history'), exist_ok=True)
    os.makedirs(os.path.join('data', 'generated_images'), exist_ok=True)
    
    app.run(host='localhost', port=8000, debug=True) 
