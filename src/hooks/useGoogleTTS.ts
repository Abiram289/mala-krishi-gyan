import { useCallback, useRef, useState } from 'react';
import { fetchWithAuth } from '@/lib/apiClient';

interface GoogleTTSHook {
  speak: (text: string, language?: string) => Promise<void>;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  browserSupportsAudio: boolean;
}

export const useGoogleTTS = (): GoogleTTSHook => {
  const browserSupportsAudio = typeof window !== 'undefined' && 'Audio' in window;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopSpeaking = useCallback(() => {
    console.log('🛑 TTS: Stopping speech...');
    setIsSpeaking(false);
    
    // Stop current audio if playing
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    
    // Stop browser TTS if active
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Abort any ongoing API request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const speak = useCallback(async (text: string, language = 'en') => {
    if (!browserSupportsAudio) {
      console.warn('Browser does not support audio playback');
      return;
    }

    try {
      console.log(`🔊 Google TTS: Synthesizing "${text.substring(0, 50)}..." in ${language}`);
      
      // Allow stop during request
      abortControllerRef.current = new AbortController();

      const response = await fetchWithAuth('/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: text.trim(),
          language: language 
        }),
        signal: abortControllerRef.current.signal as any,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'TTS request failed');
      }

      const data = await response.json();
      
      // Convert base64 to blob and play
      const audioBytes = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioBytes], { type: data.contentType });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      setIsSpeaking(true);
      
      // Play the audio
      return new Promise((resolve, reject) => {
        audio.addEventListener('ended', () => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          setIsSpeaking(false);
          abortControllerRef.current = null;
          console.log('🔊 Google TTS: Playback completed');
          resolve();
        });
        
        audio.addEventListener('error', (e) => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          setIsSpeaking(false);
          abortControllerRef.current = null;
          console.error('🔊 Google TTS: Playback error:', e);
          reject(new Error('Audio playback failed'));
        });
        
        audio.play().catch((error) => {
          currentAudioRef.current = null;
          setIsSpeaking(false);
          abortControllerRef.current = null;
          reject(error);
        });
      });

    } catch (error) {
      console.error('🔊 Google TTS Error:', error);
      
      // Fallback to browser TTS if Google TTS fails
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        console.log('🔊 Falling back to browser TTS...');
        return new Promise((resolve, reject) => {
          window.speechSynthesis.cancel();
          setIsSpeaking(true);
          
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = language === 'ml' ? 'ml-IN' : 'en-IN';
          utterance.rate = language === 'ml' ? 0.7 : 0.9;
          utterance.pitch = language === 'ml' ? 0.8 : 1;
          
          utterance.onend = () => {
            setIsSpeaking(false);
            console.log('🔊 Browser TTS: Playback completed');
            resolve();
          };
          
          utterance.onerror = (e) => {
            setIsSpeaking(false);
            console.error('🔊 Browser TTS: Playback error:', e);
            reject(new Error('Browser TTS failed'));
          };
          
          window.speechSynthesis.speak(utterance);
        });
      }
      
      // Only throw if browser TTS is not available
      throw error;
    }
  }, [browserSupportsAudio]);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    browserSupportsAudio,
  };
};