# AI Chatbot with Image Generation

A PyQt5-based desktop application that combines a chatbot powered by Deepseek R1 and image generation capabilities.

## Features

- Modern, dark-themed UI
- Chat interface with the Deepseek R1 model
- Image generation using Stable Diffusion API
- Real-time image display
- Message history

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Set up your environment variables:
Create a `.env` file in the project root and add your API key:
```
STABILITY_API_KEY=your_api_key_here
```

3. Run the application:
```bash
python main.py
```

## Usage

- Type your message in the input field and press Enter or click Send to chat with the AI
- To generate an image, type `/image` followed by your prompt
  Example: `/image a beautiful sunset over mountains`

## Requirements

- Python 3.8+
- PyQt5
- Transformers
- PyTorch
- Pillow
- Requests
- python-dotenv

## Note

The image generation feature requires a Stability AI API key. You can get one by signing up at https://stability.ai/ 