import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Mic, MicOff, Image, Languages, Volume2, Trash2 } from "lucide-react";
// Removed voice testing components - no longer needed
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
  // Load chat history from localStorage on component mount
  const loadChatHistory = () => {
    try {
      const saved = localStorage.getItem('kerala-krishi-sahai-chat');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
    return [
      {
        id: '1',
        content: t('chatTitle'),
        sender: 'bot' as const,
        timestamp: new Date()
      }
    ];
  };

  const [messages, setMessages] = useState<Message[]>(loadChatHistory);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem('kerala-krishi-sahai-chat', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }, [messages]);

  // Handle automatic transcript transfer when speech recognition ends
  useEffect(() => {
    // If we were listening and now we're not, and we have a transcript
    if (!isListening && transcript.trim()) {
      console.log('🎤 Auto-transferring transcript to input:', transcript.trim());
      console.log('🎤 Voice language:', voiceLanguage);
      console.log('🎤 Transcript length:', transcript.trim().length);
      
      // Always update input message when speech recognition ends with content
      setInputMessage(transcript.trim());
      
      // Show success message to user
      toast({ 
        title: "Voice Input Captured!", 
        description: `${voiceLanguage === 'ml' ? 'മലയാളം' : 'English'} voice input ready to send`,
        duration: 2000
      });
    }
  }, [isListening, transcript, voiceLanguage, toast]);
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
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Removed voice testing functionality - using Edge TTS now

  const clearChat = () => {
    const initialMessage = {
      id: '1',
      content: t('chatTitle'),
      sender: 'bot' as const,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
    localStorage.removeItem('kerala-krishi-sahai-chat');
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
      // Get recent conversation context (last 5 messages)
      const recentMessages = messages.slice(-5).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await fetchWithAuth("/chat", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageToSend,
          preferred_language: responseLanguage,
          voice_input_language: voiceLanguage,
          conversation_history: recentMessages
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
    <Card className="h-[calc(100vh-100px)] w-full max-w-3xl lg:mx-auto flex flex-col">
      <div className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <span className="hidden sm:inline">{t('chatTitle')}</span>
            <span className="sm:hidden">Chat</span>
          </h3>
          <div className="flex items-center gap-1 sm:gap-2">
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
              Voice: {voiceLanguage === 'en' ? 'EN' : 'ML'}
            </Badge>
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
              Reply: {responseLanguage === 'en' ? 'EN' : 'ML'}
            </Badge>
            {responseLanguage === 'ml' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInstallGuide(!showInstallGuide)}
                className="text-primary-foreground hover:bg-primary/80 text-xs hidden sm:inline-flex"
                title="Install Malayalam voices for better audio"
              >
                🔊 Install Voices
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
              className="text-primary-foreground hover:bg-primary/80 p-1 sm:p-2"
              title="Language settings"
            >
              <Languages className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-primary-foreground hover:bg-primary/80 p-1 sm:p-2"
              title="Clear chat history"
            >
              <Trash2 className="h-4 w-4" />
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
                  <strong>💡 After installation:</strong> Refresh this page and try the Malayalam voice 
                  - it should sound much better with Indian pronunciation!
                </p>
              </div>
            </div>
          </div>
        )}
        
        {showLanguageSelector && (
          <div className="mt-3 pt-3 border-t border-primary-foreground/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
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
        {/* Debug Panel - Only show in development or when there are issues */}
        {(transcript.trim() || isListening) && (
          <div className="mb-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
            <p><strong>Debug:</strong></p>
            <p>Listening: {isListening ? '✓' : '✗'} | Voice Lang: {voiceLanguage} | Transcript Length: {transcript.length}</p>
            <p>Transcript: "{transcript}"</p>
            <p>Input: "{inputMessage}"</p>
            <p>Match: {transcript.trim() === inputMessage ? '✓' : '✗'}</p>
          </div>
        )}
        
        {isListening && (
          <div className="mb-2 p-2 bg-primary/10 rounded border-l-4 border-primary">
            <p className="text-sm text-primary animate-pulse">
              🎤 Listening for {voiceLanguage === 'ml' ? 'മലയാളം (Malayalam)' : 'English'}... Speak now
            </p>
            {transcript.trim() && (
              <p className="text-xs text-muted-foreground mt-1">
                Detected: "{transcript.trim()}"
              </p>
            )}
          </div>
        )}
        {!isListening && transcript.trim() && transcript.trim() === inputMessage && (
          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-600">
              ✓ {voiceLanguage === 'ml' ? 'മലയാളം' : 'English'} voice input captured! Click Send or press Enter
            </p>
          </div>
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
                console.log('🎤 Voice button clicked:', { isListening, voiceLanguage, transcript });
                
                if (isListening) {
                  console.log('🎤 Stopping speech recognition...');
                  stopListening();
                  
                  // Transfer transcript to input message
                  if (transcript.trim()) {
                    console.log('🎤 Transferring transcript to input:', transcript.trim());
                    setInputMessage(transcript.trim());
                    toast({ 
                      title: "Voice Input Captured!", 
                      description: `Ready to send: "${transcript.trim().substring(0, 30)}${transcript.trim().length > 30 ? '...' : ''}"`,
                      duration: 3000
                    });
                  }
                } else {
                  console.log('🎤 Starting speech recognition for:', voiceLanguage);
                  resetTranscript();
                  setInputMessage(''); // Clear input when starting new voice input
                  // Pass 'ml' for Malayalam, undefined for English (defaults to 'en-US')
                  const recognitionLang = voiceLanguage === 'ml' ? 'ml' : undefined;
                  startListening(recognitionLang);
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
          {/* Debug: Manual transcript transfer button (only show when there's a transcript but it's not in input) */}
          {transcript.trim() && transcript.trim() !== inputMessage && (
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => {
                console.log('📝 Manual transfer:', transcript.trim());
                setInputMessage(transcript.trim());
                toast({ title: "Manual Transfer", description: "Transcript moved to input", duration: 1000 });
              }}
              title="Transfer voice input to chat"
              className="bg-orange-100 border-orange-300"
            >
              📝
            </Button>
          )}
          
          {/* Placeholder for image upload */}
          <Button variant="outline" size="icon" title="Upload Image (Coming Soon)" className="opacity-50">
            <Image className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
