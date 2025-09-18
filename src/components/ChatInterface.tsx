import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Mic, MicOff, Image } from "lucide-react";
import { useLanguage } from "./LanguageToggle";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const ChatInterface = () => {
  const { t, language } = useLanguage();
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
  const { speak } = useSpeechSynthesis();
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    if (isListening) {
      stopListening();
    }

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponseContent = getBotResponse(userMessage.content);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponseContent,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      speak(botResponseContent, language);
    }, 1500);
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('weather') || input.includes('കാലാവസ്ഥ')) {
      return "Today's weather is partly cloudy with 28°C temperature. Humidity is at 75%. Good conditions for most farming activities.";
    } else if (input.includes('rice') || input.includes('paddy') || input.includes('നെൽ')) {
      return "For rice cultivation in Kerala, the best planting time is June-July for Kharif season. Ensure proper water management and use recommended varieties.";
    } else if (input.includes('pest') || input.includes('കീടം')) {
      return "Common pests in Kerala include brown plant hopper and stem borer. Use integrated pest management techniques and consult with local agricultural officers.";
    } else {
      return "Thank you for your question. I'm here to help with farming advice, weather information, crop management, and government schemes. What would you like to know?";
    }
  };

  return (
    <Card className="h-[calc(100vh-100px)] max-w-3xl mx-auto flex flex-col">
      <div className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
        <h3 className="font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5" />
          {t('chatTitle')}
        </h3>
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
                  <p className="text-sm">{message.content}</p>
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
        {transcript && !isListening && (
          <p className="text-sm text-muted-foreground mb-2">Detected: "{transcript}"</p>
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
                  startListening(language);
                }
              }}
              className={isListening ? 'bg-destructive text-destructive-foreground' : ''}
              title={isListening ? 'Stop recording' : 'Start voice input'}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          <Button onClick={handleSendMessage} size="icon" disabled={isListening || !inputMessage.trim()}>
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