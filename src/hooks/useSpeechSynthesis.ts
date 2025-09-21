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

    // Wait a bit to ensure voices are loaded
    const speakWithVoice = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get updated voices list
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.map(v => ({name: v.name, lang: v.lang})));
      
      let selectedVoice = null;
      
      if (language === 'ml') {
        console.log('Looking for Malayalam voice...');
        console.log('Total voices available:', voices.length);
        
        // List all available voices for debugging
        voices.forEach((voice, index) => {
          console.log(`Voice ${index}: ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`);
        });
        
        // Try to find Malayalam voices first (if they exist)
        const malayalamVoices = voices.filter(voice => {
          const voiceName = voice.name.toLowerCase();
          const voiceLang = voice.lang.toLowerCase();
          return (
            voiceLang === 'ml-in' ||
            voiceLang === 'ml' ||
            voiceLang.includes('malayalam') ||
            voiceName.includes('malayalam') ||
            voiceName.includes('ml-in')
          );
        });
        
        const indianVoices = voices.filter(voice => {
          const voiceName = voice.name.toLowerCase();
          const voiceLang = voice.lang.toLowerCase();
          return (
            voiceName.includes('indian') ||
            voiceLang.startsWith('hi') ||
            voiceName.includes('hindi') ||
            voiceName.includes('tamil') ||
            voiceLang.includes('ta-in') ||
            voiceName.includes('bengali') ||
            voiceName.includes('ravi') || // Common Indian TTS voice
            voiceName.includes('veena') || // Common Indian TTS voice
            voiceName.includes('microsoft') && (voiceLang.includes('hi') || voiceLang.includes('ta'))
          );
        });
        
        console.log('Malayalam voices found:', malayalamVoices.length);
        console.log('Indian voices found:', indianVoices.length);
        
        // Prioritize: 1) Actual Malayalam voices, 2) Indian voices, 3) Any voice
        if (malayalamVoices.length > 0) {
          selectedVoice = malayalamVoices[0];
          console.log('🎉 Found actual Malayalam voice:', selectedVoice.name);
          utterance.lang = 'ml-IN';
          utterance.rate = 0.8; // Normal rate for native Malayalam
        } else if (indianVoices.length > 0) {
          selectedVoice = indianVoices[0];
          console.log('Using Indian voice:', selectedVoice.name);
          utterance.lang = 'hi-IN';
        } else {
          // Try to find any voice that might work better with Malayalam text
          const betterVoices = voices.filter(voice => 
            voice.name.toLowerCase().includes('google') ||
            voice.name.toLowerCase().includes('natural') ||
            voice.name.toLowerCase().includes('neural') ||
            voice.localService === true
          );
          
          if (betterVoices.length > 0) {
            selectedVoice = betterVoices[0];
            console.log('Using better quality voice:', selectedVoice.name);
          } else if (voices.length > 0) {
            selectedVoice = voices[0]; // Use first available voice
            console.log('Using first available voice:', selectedVoice.name);
          }
          
          utterance.lang = 'en-IN'; // Use Indian English as fallback
        }
        
        utterance.rate = 0.6; // Even slower for better pronunciation
        utterance.pitch = 0.9; // Slightly lower pitch
        
      } else {
        // Look for English voice
        selectedVoice = voices.find(voice => 
          voice.lang.startsWith('en') && 
          (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Natural'))
        ) || voices.find(voice => voice.lang.startsWith('en'));
        
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;
      }
      
      utterance.volume = 1;
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`Selected voice: ${selectedVoice.name} (${selectedVoice.lang})`);
      } else {
        console.log('No suitable voice found, using default');
      }
      
      // Add event listeners for debugging
      utterance.onstart = () => console.log('Speech started');
      utterance.onend = () => console.log('Speech ended');
      utterance.onerror = (e) => console.error('Speech error:', e);
      
      window.speechSynthesis.speak(utterance);
    };
    
    // If voices aren't loaded yet, wait for them
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', speakWithVoice, { once: true });
    } else {
      speakWithVoice();
    }
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