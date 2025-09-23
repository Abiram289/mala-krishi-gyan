import { useState, useEffect, useCallback } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  startListening: (language?: string) => void;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const browserSupportsSpeechRecognition = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Check microphone permissions
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setPermissionGranted(permission.state === 'granted');
          
          permission.onchange = () => {
            setPermissionGranted(permission.state === 'granted');
          };
        } else {
          // Fallback: assume permission needed to be requested
          setPermissionGranted(false);
        }
      } catch (error) {
        console.log('Permission API not supported, will request on use');
        setPermissionGranted(false);
      }
    };

    checkMicrophonePermission();
  }, []);

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) return;

    const SpeechRecognition = (window as WindowWithSpeechRecognition).SpeechRecognition || (window as WindowWithSpeechRecognition).webkitSpeechRecognition;
    
    try {
      const recognitionInstance = new SpeechRecognition();
      
      // Configure recognition
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.maxAlternatives = 1;
      
      recognitionInstance.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsListening(true);
      };

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        console.log('🎤 Speech recognition result:', event);
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }
        
        // Update transcript with final result or show interim
        if (finalTranscript) {
          console.log('🎤 Final transcript:', finalTranscript);
          setTranscript(finalTranscript.trim());
        } else if (interimTranscript) {
          console.log('🎤 Interim transcript:', interimTranscript);
          setTranscript(interimTranscript.trim());
        }
      };

      recognitionInstance.onend = () => {
        console.log('🎤 Speech recognition ended');
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: SpeechRecognitionError) => {
        console.error('🎤 Speech recognition error:', event.error, event.message);
        setIsListening(false);
        
        // Provide user-friendly error messages
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access and try again.');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected, stopping recognition');
        } else if (event.error === 'network') {
          alert('Network error during speech recognition. Please check your internet connection.');
        }
      };

      setRecognition(recognitionInstance);

      return () => {
        if (recognitionInstance) {
          recognitionInstance.stop();
        }
      };
    } catch (error) {
      console.error('Failed to create speech recognition instance:', error);
    }
  }, [browserSupportsSpeechRecognition]);

  const startListening = useCallback(async (language = 'en-US') => {
    if (!recognition) {
      console.error('🎤 Speech recognition not initialized');
      return;
    }

    try {
      // Request microphone permission if not granted
      if (!permissionGranted) {
        console.log('🎤 Requesting microphone permission...');
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          setPermissionGranted(true);
          console.log('🎤 Microphone permission granted');
        } catch (permError) {
          console.error('🎤 Microphone permission denied:', permError);
          alert('Microphone access is required for voice input. Please allow microphone access in your browser settings.');
          return;
        }
      }

      // Set language for recognition
      if (language === 'ml') {
        recognition.lang = 'ml-IN'; // Malayalam (India)
        console.log('🎤 Set language to Malayalam (ml-IN)');
      } else {
        recognition.lang = 'en-US'; // English (US)
        console.log('🎤 Set language to English (en-US)');
      }

      // Stop any ongoing recognition
      if (isListening) {
        recognition.stop();
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      }

      setTranscript('');
      console.log('🎤 Starting speech recognition...');
      recognition.start();
    } catch (error) {
      console.error('🎤 Error starting speech recognition:', error);
      setIsListening(false);
    }
  }, [recognition, permissionGranted, isListening]);

  const stopListening = useCallback(() => {
    if (!recognition) {
      console.warn('🎤 Cannot stop: Speech recognition not initialized');
      return;
    }
    console.log('🎤 Stopping speech recognition...');
    recognition.stop();
  }, [recognition]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  };
};