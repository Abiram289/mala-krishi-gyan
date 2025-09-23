import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Mic, MicOff, Image, Languages, Volume2 } from "lucide-react";
// import { VoiceInstallGuide } from "@/components/VoiceInstallGuide";
import { VoiceDebugger } from "@/components/VoiceDebugger";
import { useLanguage } from "./LanguageToggle";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useGoogleTTS } from "@/hooks/useGoogleTTS";
import { useToast } from "./ui/use-toast";
import { fetchWithAuth } from "@/lib/apiClient";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const ChatInterface = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: t('chatTitle'),
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();
  const { speak, stopSpeaking, isSpeaking } = useGoogleTTS();
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<'en' | 'ml'>('en');
  const [responseLanguage, setResponseLanguage] = useState<'en' | 'ml'>('en');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      console.log('Loaded voices:', voices.length);
    };

    // Load voices immediately if available
    loadVoices();

    // Also listen for voice changes (some browsers load them asynchronously)
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const testVoice = (voice: SpeechSynthesisVoice, testText: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.voice = voice;
    utterance.rate = responseLanguage === 'ml' ? 0.7 : 0.9;
    utterance.pitch = responseLanguage === 'ml' ? 0.8 : 1;
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async () => {
    const messageToSend = (isListening ? transcript : inputMessage).trim();
    if (!messageToSend) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageToSend,
      sender: 'user',
      timestamp: new Date()
    };

    if (isListening) {
      stopListening();
    }

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    resetTranscript();
    setIsTyping(true);

    try {
      const response = await fetchWithAuth("/chat", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageToSend,
          preferred_language: responseLanguage,
          voice_input_language: voiceLanguage
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from bot.");
      }

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.reply,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Note: TTS will only play when user clicks the read-aloud button

    } catch (error) {
      if (error instanceof Error && !error.message.includes("Authentication error")) {
        console.error("Error sending message:", error);
        toast({ title: "Error", description: "Could not send message. Please try again.", variant: "destructive" });
        setInputMessage(messageToSend);
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Card className="h-[calc(100vh-100px)] max-w-3xl mx-auto flex flex-col">
      <div className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {t('chatTitle')}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Voice: {voiceLanguage === 'en' ? 'English' : 'മലയാളം'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Reply: {responseLanguage === 'en' ? 'English' : 'മലയാളം'}
            </Badge>
            {responseLanguage === 'ml' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInstallGuide(!showInstallGuide)}
                className="text-primary-foreground hover:bg-primary/80 text-xs"
                title="Install Malayalam voices for better audio"
              >
                🔊 Install Voices
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
              className="text-primary-foreground hover:bg-primary/80"
            >
              <Languages className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Installation Guide for Malayalam voices */}
        {responseLanguage === 'ml' && showInstallGuide && (
          <div className="mt-2 pt-2 border-t border-primary-foreground/20 bg-blue-950/20 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-blue-300">🔊 Install Malayalam/Indian Voices</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstallGuide(false)}
                className="text-primary-foreground hover:bg-primary/80 text-xs h-6 w-6 p-0"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="border-l-4 border-blue-500 pl-3">
                <p className="font-medium text-blue-300 mb-1">Method 1: Windows Settings</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-200">
                  <li>Press <kbd className="bg-gray-700 px-1 rounded">Windows + I</kbd> to open Settings</li>
                  <li>Go to <strong>Time & Language</strong> → <strong>Speech</strong></li>
                  <li>Click <strong>"Add languages"</strong> or <strong>"Manage voices"</strong></li>
                  <li>Download <strong>Hindi (India)</strong> language pack</li>
                  <li>Restart your browser</li>
                </ol>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-3">
                <p className="font-medium text-yellow-300 mb-1">Why Hindi instead of Malayalam?</p>
                <p className="text-yellow-200 text-[10px]">
                  Windows doesn't include Malayalam voices, but Hindi voices have Indian pronunciation 
                  that sounds much better for Malayalam text than English voices.
                </p>
              </div>
              
              <div className="bg-green-900/20 border border-green-600/30 rounded p-2">
                <p className="text-green-200 text-[10px]">
                  <strong>💡 After installation:</strong> Refresh this page, then use the voice debugger 
                  below to test the new Hindi voices with Malayalam text.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {showLanguageSelector && (
          <div className="mt-3 pt-3 border-t border-primary-foreground/20">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs mb-1 opacity-80">Voice Input Language:</label>
                <Select value={voiceLanguage} onValueChange={(value: 'en' | 'ml') => setVoiceLanguage(value)}>
                  <SelectTrigger className="h-8 text-xs bg-primary-foreground/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ml">മലയാളം (Malayalam)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs mb-1 opacity-80">AI Response Language:</label>
                <Select value={responseLanguage} onValueChange={(value: 'en' | 'ml') => setResponseLanguage(value)}>
                  <SelectTrigger className="h-8 text-xs bg-primary-foreground/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ml">മലയാളം (Malayalam)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-primary-foreground/20">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVoiceSelector(!showVoiceSelector)}
                  className="text-primary-foreground hover:bg-primary/80 text-xs"
                >
                  <Volume2 className="h-3 w-3 mr-2" />
                  Test Voices ({availableVoices.length} available)
                </Button>
                <div className="text-xs">
                  <VoiceDebugger />
                </div>
              </div>
              {showVoiceSelector && (
                <div className="mt-2 max-h-32 overflow-y-auto bg-primary-foreground/10 rounded p-2">
                  <div className="mb-3">
                    <p className="text-xs mb-2 opacity-80">
                      Test different voices to find the best one for {responseLanguage === 'ml' ? 'Malayalam' : 'English'}:
                    </p>
                    {responseLanguage === 'ml' && availableVoices.filter(voice => {
                      const name = voice.name.toLowerCase();
                      const lang = voice.lang.toLowerCase();
                      return (
                        lang.includes('hi') || lang.includes('ml') || lang.includes('ta') ||
                        name.includes('indian') || name.includes('hindi') || name.includes('malayalam') ||
                        name.includes('tamil') || name.includes('bengali')
                      );
                    }).length === 0 && (
                      <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs">
                        <p className="text-yellow-300 mb-1">⚠️ No Indian voices found on your system</p>
                        <p className="text-yellow-200 text-[10px]">
                          For better Malayalam audio, install Indian voices from Windows Settings → Time & Language → Speech
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    {(() => {
                      let voicesToShow = [];
                      
                      if (responseLanguage === 'ml') {
                        // First try to get Indian voices
                        const indianVoices = availableVoices.filter(voice => {
                          const name = voice.name.toLowerCase();
                          const lang = voice.lang.toLowerCase();
                          return (
                            lang.includes('hi') || lang.includes('ml') || lang.includes('ta') ||
                            name.includes('indian') || name.includes('hindi') || name.includes('malayalam') ||
                            name.includes('tamil') || name.includes('bengali')
                          );
                        });
                        
                        if (indianVoices.length > 0) {
                          voicesToShow = indianVoices.slice(0, 8);
                        } else {
                          // If no Indian voices, show all available voices for testing
                          voicesToShow = availableVoices.slice(0, 10);
                        }
                      } else {
                        // Show English voices
                        voicesToShow = availableVoices.filter(voice => voice.lang.startsWith('en')).slice(0, 8);
                      }
                      
                      return voicesToShow.map((voice, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => testVoice(voice, 
                            responseLanguage === 'ml' 
                              ? 'നമസ്കാരം! കൃഷിയെക്കുറിച്ച് സംസാരിക്കാം.' 
                              : 'Hello! Let\'s talk about farming.'
                          )}
                          className="w-full justify-start text-xs h-8 px-2 text-primary-foreground/80 hover:text-primary-foreground"
                        >
                          <Volume2 className="h-2 w-2 mr-2" />
                          {voice.name} ({voice.lang})
                        </Button>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.sender === 'bot' && <Bot className="h-4 w-4 mt-0.5 text-primary" />}
                  {message.sender === 'user' && <User className="h-4 w-4 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm">{message.content}</p>
                    {message.sender === 'bot' && (
                      <div className="flex gap-1 mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => speak(message.content, responseLanguage)}
                          className="h-6 px-2 text-xs opacity-60 hover:opacity-100"
                          title={`Read aloud in ${responseLanguage === 'en' ? 'English' : 'Malayalam'}`}
                          disabled={isSpeaking}
                        >
                          <Volume2 className="h-3 w-3 mr-1" />
                          🔊 {responseLanguage === 'en' ? 'English' : 'മലയാളം'}
                        </Button>
                        {isSpeaking && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={stopSpeaking}
                            className="h-6 px-2 text-xs opacity-60 hover:opacity-100 text-red-600"
                            title="Stop speaking"
                          >
                            🛑 Stop
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>
      
      <div className="p-4 border-t">
        {isListening && (
          <p className="text-sm text-primary animate-pulse mb-2">🎙️ Listening... Speak now</p>
        )}
        <div className="flex gap-2">
          <Input
            value={isListening ? transcript : inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={t('chatPlaceholder')}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
            disabled={isListening}
          />
          {browserSupportsSpeechRecognition && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                if (isListening) {
                  stopListening();
                  setInputMessage(transcript);
                } else {
                  resetTranscript();
                  startListening(voiceLanguage);
                }
              }}
              className={isListening ? 'bg-destructive text-destructive-foreground' : ''}
              title={isListening ? 'Stop recording' : 'Start voice input'}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          <Button onClick={handleSendMessage} size="icon" disabled={isListening || !(isListening ? transcript : inputMessage).trim()}>
            <Send className="h-4 w-4" />
          </Button>
          {/* Placeholder for image upload */}
          <Button variant="outline" size="icon" title="Upload Image (Coming Soon)">
            <Image className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
