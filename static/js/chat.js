async function generateImage() {
    const prompt = document.getElementById('imagePrompt').value.trim();
    const imageContainer = document.getElementById('imageContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    
    // Clear previous error
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
    
    // Validate prompt
    if (!prompt) {
        errorMessage.textContent = 'Please enter a prompt for the image';
        errorMessage.style.display = 'block';
        return;
    }
    
    if (prompt.length < 3) {
        errorMessage.textContent = 'Prompt must be at least 3 characters long';
        errorMessage.style.display = 'block';
        return;
    }
    
    try {
        loadingIndicator.style.display = 'block';
        imageContainer.innerHTML = '';
        
        const response = await fetch('/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate image');
        }
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        const img = document.createElement('img');
        img.src = `data:image/png;base64,${data.image}`;
        img.alt = prompt;
        img.className = 'generated-image';
        
        imageContainer.innerHTML = '';
        imageContainer.appendChild(img);
        
    } catch (error) {
        console.error('Error generating image:', error);
        errorMessage.textContent = error.message || 'Failed to generate image. Please try again.';
        errorMessage.style.display = 'block';
    } finally {
        loadingIndicator.style.display = 'none';
    }
} 