document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const micButton = document.getElementById('mic-button');
  const chatOutput = document.getElementById('chat-output');
  const status = document.getElementById('status');

  // State management
  let isProcessing = false;

  // Helper functions
  function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    messageDiv.textContent = text;
    chatOutput.appendChild(messageDiv);
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }

  function showStatus(message, isError = false) {
    status.textContent = message;
    status.style.color = isError ? 'red' : 'inherit';
  }

  function speak(text) {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
    };
    window.speechSynthesis.speak(utterance);
  }

  function setProcessing(state) {
    isProcessing = state;
    micButton.disabled = state;
    if (state) {
      micButton.classList.add('processing');
    } else {
      micButton.classList.remove('processing');
    }
  }

  // Check browser support
  if (!('webkitSpeechRecognition' in window)) {
    showStatus('Speech recognition not supported in your browser. Try Chrome or Edge.', true);
    micButton.disabled = true;
    return;
  }

  // Initialize speech recognition
  const SpeechRecognition = window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  // Mic button handler
  micButton.addEventListener('click', () => {
    if (isProcessing) return;
    
    if (micButton.classList.contains('listening')) {
      recognition.stop();
      micButton.classList.remove('listening');
      showStatus('Press the microphone button and speak');
    } else {
      recognition.start();
      micButton.classList.add('listening');
      showStatus('Listening... Speak now');
    }
  });

  // Recognition handlers
  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    addMessage(transcript, 'user');
    setProcessing(true);
    showStatus('Processing your request...');

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: transcript })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unknown server error');
      }

      addMessage(data.response, 'bot');
      speak(data.response);
      showStatus('Press the microphone button and speak');

    } catch (error) {
      console.error('API request failed:', error);
      const errorMessage = error.message.includes('server') 
        ? error.message 
        : "Sorry, I'm having trouble connecting. Please try again.";
      
      addMessage(errorMessage, 'bot');
      speak(errorMessage);
      showStatus('Error occurred. Try again.', true);

    } finally {
      setProcessing(false);
      micButton.classList.remove('listening');
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    showStatus(`Error: ${event.error}`, true);
    setProcessing(false);
    micButton.classList.remove('listening');
  };

  recognition.onend = () => {
    if (micButton.classList.contains('listening')) {
      micButton.classList.remove('listening');
      if (!isProcessing) {
        showStatus('Press the microphone button and speak');
      }
    }
  };

  // Initial greeting
  setTimeout(() => {
    addMessage("Hi! I'm your voice assistant. Try saying 'Hello' or 'Tell me a joke'", 'bot');
  }, 1000);
});