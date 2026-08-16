import { useState, useRef, useCallback } from 'react';

// Extend Window interface to include Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseVoiceInputProps {
  onInterimTranscript: (text: string) => void;
  onFinalCleanup: (text: string) => void;
}

export function useVoiceInput({ onInterimTranscript, onFinalCleanup }: UseVoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');

  const cleanupWithAI = async (rawText: string) => {
    setIsCleaning(true);
    try {
      // TODO: Replace this simulated delay with your actual backend API call to Anthropic/LLM
      // e.g. const response = await fetch('/api/clean-grievance', { method: 'POST', body: JSON.stringify({ text: rawText }) });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, since there's no backend connected, we just return the raw spoken text.
      // Once you connect your backend, replace `rawText` with the cleaned text from the API.
      onFinalCleanup(rawText);
    } catch (err: any) {
      console.error('LLM Cleanup failed:', err);
      setError('AI cleanup failed. Using raw transcript.');
      onFinalCleanup(rawText);
    } finally {
      setIsCleaning(false);
    }
  };

  const startListening = useCallback(() => {
    setError(null);
    finalTranscriptRef.current = '';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Browser does not support Speech Recognition.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Works well for Indian English and Hinglish

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscriptChunk = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptChunk += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscriptChunk) {
        finalTranscriptRef.current += finalTranscriptChunk + ' ';
      }
      
      // Update UI live (replacing whatever was there as requested)
      onInterimTranscript(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error !== 'no-speech') {
        setError(`Mic error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // When recording stops, process the accumulated final text
      if (finalTranscriptRef.current.trim()) {
        cleanupWithAI(finalTranscriptRef.current.trim());
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onInterimTranscript, onFinalCleanup]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return {
    isListening,
    isCleaning,
    error,
    startListening,
    stopListening
  };
}
