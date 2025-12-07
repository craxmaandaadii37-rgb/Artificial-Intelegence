import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Sparkles, LogOut } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import ChatHistory from "@/components/ChatHistory";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const { messages, isLoading, sendMessage, conversationId, loadConversation, startNewConversation } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [showHistory, setShowHistory] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSendMessage = async (text: string, files?: File[]) => {
    if (files && files.length > 0) {
      toast({
        title: "File Upload",
        description: `${files.length} file(s) attached (file upload coming soon)`,
      });
    }
    await sendMessage(text);
  };

  const handleVoiceMessage = async (audioBlob: Blob) => {
    toast({
      title: "Voice Message",
      description: "Voice transcription coming soon",
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      {showHistory && (
        <ChatHistory
          currentConversationId={conversationId}
          onSelectConversation={loadConversation}
          onNewConversation={startNewConversation}
        />
      )}
      <div className="flex flex-col flex-1">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-glow shadow-lg animate-pulse-glow">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              chatAI
              <Sparkles className="w-4 h-4 text-accent" />
            </h1>
            <p className="text-xs text-muted-foreground">
              Powered by Gemini 2.5 Flash
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-6 shadow-card">
                <Bot className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome to chatAI
              </h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Ask me anything! I can help you with questions, generate ideas, explain concepts, write content, and much more.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  {[
                    "Explain quantum computing in simple terms",
                    "Write a creative story about a robot",
                    "Help me brainstorm app ideas",
                    "What are the best practices for React?",
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(suggestion)}
                      className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary hover:shadow-card transition-all duration-200 text-sm text-card-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 mb-4 justify-start animate-fade-in">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-md">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="max-w-[70%] rounded-2xl px-4 py-3 bg-card border border-border shadow-message">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </main>

        <ChatInput 
          onSend={handleSendMessage} 
          onVoiceMessage={handleVoiceMessage}
          disabled={isLoading} 
        />
      </div>
    </div>
  );
};

export default Index;
