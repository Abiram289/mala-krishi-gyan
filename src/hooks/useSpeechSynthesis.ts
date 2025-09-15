import { useCallback } from 'react';

interface SpeechSynthesisHook {
  speak: (text: string, language?: string) => void;
  stop: () => void;
  browserSupportsSpeechSynthesis: boolean;
}

export const useSpeechSynthesis = (): SpeechSynthesisHook => {
  const browserSupportsSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback((text: string, language = 'en-US') => {
    if (!browserSupportsSpeechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language and voice parameters
    if (language === 'ml') {
      utterance.lang = 'ml-IN'; // Malayalam (India)
      utterance.rate = 0.8; // Slightly slower for Malayalam
    } else {
      utterance.lang = 'en-US'; // English (US)
      utterance.rate = 0.9;
    }
    
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to find a suitable voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    if (language === 'ml') {
      // Look for Malayalam voice
      selectedVoice = voices.find(voice => 
        voice.lang.startsWith('ml') || voice.lang.startsWith('hi') || voice.name.toLowerCase().includes('indian')
      );
    } else {
      // Look for English voice
      selectedVoice = voices.find(voice => 
        voice.lang.startsWith('en') && (voice.name.includes('Google') || voice.name.includes('Microsoft'))
      );
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [browserSupportsSpeechSynthesis]);

  const stop = useCallback(() => {
    if (!browserSupportsSpeechSynthesis) return;
    window.speechSynthesis.cancel();
  }, [browserSupportsSpeechSynthesis]);

  return {
    speak,
    stop,
    browserSupportsSpeechSynthesis,
  };
};