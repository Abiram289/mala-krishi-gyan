import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [retryCount, setRetryCount] = useState(0);
  const transcriptRef = useRef('');
  
  // Keep ref in sync with state
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const browserSupportsSpeechRecognition = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    
  const getBrowserInfo = () => {
    if (typeof window === 'undefined') return 'unknown';
    const userAgent = window.navigator.userAgent;
    if (userAgent.includes('Brave')) return 'Brave';
    if (userAgent.includes('Chrome') && !userAgent.includes('Brave')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

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
      
      // Configure recognition for better reliability
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.maxAlternatives = 1;
      
      // Add more robust configuration
      try {
        // Some browsers support these additional settings
        (recognitionInstance as any).grammars = null;
        (recognitionInstance as any).serviceURI = null;
      } catch (e) {
        // Ignore if browser doesn't support these settings
      }
      
      recognitionInstance.onstart = () => {
        console.log('🎤 Speech recognition started successfully');
        setIsListening(true);
        setRetryCount(0); // Reset retry count on successful start
      };

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        console.log('🎤 Speech recognition result:', event);
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          
          // Log for debugging
          console.log(`🎤 Result ${i}:`, {
            text: transcriptPart,
            isFinal: event.results[i].isFinal,
            confidence: event.results[i][0].confidence
          });
          
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }
        
        // Update transcript with final result or show interim
        if (finalTranscript) {
          const cleanedTranscript = finalTranscript.trim();
          console.log('🎤 Final transcript (cleaned):', cleanedTranscript);
          console.log('🎤 Character count:', cleanedTranscript.length);
          setTranscript(cleanedTranscript);
        } else if (interimTranscript) {
          const cleanedInterim = interimTranscript.trim();
          console.log('🎤 Interim transcript (cleaned):', cleanedInterim);
          setTranscript(cleanedInterim);
        }
      };

      recognitionInstance.onend = () => {
        console.log('🎤 Speech recognition ended');
        console.log('🎤 Final transcript on end:', transcriptRef.current);
        console.log('🎤 Transcript length:', transcriptRef.current.length);
        setIsListening(false);
        
        // Don't clear transcript here - let component handle it
        // This ensures transcript persists until manually cleared
      };

      recognitionInstance.onerror = (event: SpeechRecognitionError) => {
        console.error('🎤 Speech recognition error:', event.error, event.message);
        setIsListening(false);
        
        // Provide user-friendly error messages
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          console.log('🎤 No speech detected - this is normal if you pause while speaking');
          // Don't show error for no-speech, it's normal
        } else if (event.error === 'network') {
          console.warn('🎤 Network error - this is often a browser speech recognition issue, not your internet');
          // Try to restart recognition automatically for network errors
          if (retryCount < 2) {
            console.log('🎤 Attempting to restart speech recognition...');
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              if (recognition) {
                try {
                  recognition.start();
                } catch (e) {
                  console.warn('🎤 Retry failed:', e);
                }
              }
            }, 1000);
          } else {
            console.log('🎤 Max retries reached for network error');
            setRetryCount(0);
          }
        } else if (event.error === 'service-not-allowed') {
          const browser = getBrowserInfo();
          if (browser === 'Firefox') {
            alert('Firefox has limited speech recognition support. For better Malayalam recognition, please use Chrome or Edge.');
          } else if (browser === 'Safari') {
            alert('Safari has poor speech recognition support. Please use Chrome or Edge for voice input.');
          } else if (browser === 'Brave') {
            alert('Brave browser has limited speech recognition support. Please use Chrome or Edge for better voice input, or enable speech recognition in Brave settings.');
          } else {
            alert('Speech recognition service is not available. Try using Chrome or Edge browser.');
          }
        } else if (event.error === 'bad-grammar') {
          console.log('🎤 Speech not recognized clearly - try speaking more clearly');
        } else {
          console.warn('🎤 Speech recognition error:', event.error);
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

      // Set language for recognition with fallbacks
      if (language === 'ml') {
        // Try multiple Malayalam/Indian language codes for better compatibility
        const malayalamLangCodes = ['ml-IN', 'hi-IN', 'en-IN'];
        let langSet = false;
        
        for (const langCode of malayalamLangCodes) {
          try {
            recognition.lang = langCode;
            console.log(`🎤 Set language to ${langCode} for Malayalam input`);
            langSet = true;
            break;
          } catch (e) {
            console.log(`🎤 ${langCode} not supported, trying next...`);
          }
        }
        
        if (!langSet) {
          recognition.lang = 'en-IN'; // Fallback to Indian English
          console.log('🎤 Using fallback: en-IN for Malayalam input');
        }
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
      console.log('🎤 Starting speech recognition...', {
        browser: getBrowserInfo(),
        language: language === 'ml' ? 'ml-IN' : 'en-US',
        retryAttempt: retryCount
      });
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