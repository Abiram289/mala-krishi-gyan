import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Mic, MicOff, Languages, Volume2, Trash2 } from "lucide-react";
import { useLanguage } from "./LanguageToggle";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useGoogleTTS } from "@/hooks/useGoogleTTS";
import { useToast } from "./ui/use-toast";
import { apiClient, ChatMessageFromDB } from "@/lib/apiClient";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const ChatInterface = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<'en' | 'ml'>('en');
  const [responseLanguage, setResponseLanguage] = useState<'en' | 'ml'>('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { transcript, isListening, startListening, stopListening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const { speak } = useGoogleTTS();

  // Fetch chat history from the database when the component mounts
  useEffect(() => {
    const fetchHistory = async () => {
      setIsTyping(true);
      try {
        const history = await apiClient.getChatHistory();
        const formattedMessages: Message[] = history.map((msg, index) => ({
          id: `hist-${index}`,
          content: msg.content,
          sender: msg.sender,
          timestamp: new Date(msg.created_at),
        }));
        
        const welcomeMessage: Message = {
            id: 'welcome',
            content: t('chatTitle'),
            sender: 'bot',
            timestamp: new Date()
        };

        setMessages([welcomeMessage, ...formattedMessages]);

      } catch (error) {
        console.error('Failed to load chat history:', error);
        toast({ title: "Could not load chat history", variant: "destructive" });
      } finally {
        setIsTyping(false);
      }
    };

    fetchHistory();
  }, [t, toast]);

  useEffect(() => {
    if (!isListening && transcript.trim()) {
      setInputMessage(transcript.trim());
    }
  }, [isListening, transcript]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    const messageToSend = (isListening ? transcript : inputMessage).trim();
    if (!messageToSend) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageToSend,
      sender: 'user',
      timestamp: new Date()
    };

    if (isListening) stopListening();

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    resetTranscript();
    setIsTyping(true);

    try {
      // Use the new apiClient to send the message.
      // The backend now handles persistence.
      const data = await apiClient.postChatMessage(messageToSend);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.reply,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      // Optional: remove the user's message from UI if sending failed
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsTyping(false);
    }
  };

  // The JSX remains largely the same
  return (
    <Card className="h-[calc(100vh-100px)] w-full max-w-3xl lg:mx-auto flex flex-col">
        <div className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <h3 className="font-semibold flex items-center gap-2"><Bot className="h-5 w-5" />{t('chatTitle')}</h3>
        </div>
        <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
                {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            <p className="text-sm">{message.content}</p>
                            {message.sender === 'bot' && (
                                <Button variant="ghost" size="sm" onClick={() => speak(message.content, responseLanguage)} className="h-6 px-2 text-xs opacity-60 hover:opacity-100">
                                    <Volume2 className="h-3 w-3 mr-1" /> Speak
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start"><div className="bg-muted p-3 rounded-lg"><Bot className="h-4 w-4 text-primary animate-pulse" /></div></div>
                )}
            </div>
            <div ref={messagesEndRef} />
        </ScrollArea>
        <div className="p-4 border-t">
            <div className="flex gap-2">
                <Input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder={t('chatPlaceholder')} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} disabled={isListening} />
                {browserSupportsSpeechRecognition && (
                    <Button type="button" variant="outline" size="icon" onClick={() => isListening ? stopListening() : startListening(voiceLanguage)} className={isListening ? 'bg-destructive' : ''}>
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                )}
                <Button onClick={handleSendMessage} size="icon" disabled={isListening || !inputMessage.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    </Card>
  );
};
