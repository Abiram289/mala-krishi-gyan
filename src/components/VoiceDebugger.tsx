import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, Copy } from "lucide-react";

export const VoiceDebugger = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const testVoice = (voice: SpeechSynthesisVoice) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("നമസ്കാരം! ഇത് മലയാളം ടെസ്റ്റ് ആണ്.");
    utterance.voice = voice;
    utterance.rate = 0.7;
    utterance.pitch = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const copyDebugInfo = () => {
    const debugInfo = voices.map((voice, index) => 
      `${index + 1}. ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`
    ).join('\n');

    navigator.clipboard.writeText(`Available Voices on ${navigator.userAgent}:\n\n${debugInfo}`);
    alert('Voice information copied to clipboard!');
  };

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        🔍 Debug Voices ({voices.length})
      </Button>
    );
  }

  return (
    <Card className="p-4 max-w-2xl">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Voice System Debug ({voices.length} voices)</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyDebugInfo}>
            <Copy className="h-3 w-3 mr-1" />
            Copy Info
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
            ✕
          </Button>
        </div>
      </div>
      
      <div className="max-h-64 overflow-y-auto space-y-2">
        {voices.length === 0 ? (
          <p className="text-muted-foreground">Loading voices...</p>
        ) : (
          voices.map((voice, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded">
              <div className="flex-1">
                <p className="text-sm font-medium">{voice.name}</p>
                <p className="text-xs text-muted-foreground">
                  {voice.lang} • {voice.localService ? 'Local' : 'Remote'}
                  {(voice.name.toLowerCase().includes('hindi') || 
                    voice.name.toLowerCase().includes('indian') ||
                    voice.name.toLowerCase().includes('tamil') ||
                    voice.lang.toLowerCase().includes('hi') ||
                    voice.lang.toLowerCase().includes('ta')) && 
                    <span className="ml-2 text-green-500">🇮🇳</span>
                  }
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testVoice(voice)}
                className="ml-2"
              >
                <Volume2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>🔍 Look for:</strong> Voices with "Hindi", "Indian", "Tamil", or 🇮🇳 flag for best Malayalam pronunciation.
          If you don't see any, follow the installation guide above.
        </p>
      </div>
    </Card>
  );
};