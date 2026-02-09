'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: uuidv4(),
          role: 'model',
          content: 'Hi there! How can I help you with AbePay today?',
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: uuidv4(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
        }),
      });

      if (!response.ok) {
        let serverMessage = 'Network response was not ok';
        try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
                serverMessage = errorData.error;
            }
        } catch (jsonError) {
            // The response was not JSON. It might be a server crash page.
            console.error("Could not parse error response as JSON:", jsonError);
            serverMessage = "The server returned an unexpected error. Please check the server logs."
        }
        throw new Error(serverMessage);
      }

      const data = await response.json();
      const modelMessage: Message = {
        id: uuidv4(),
        role: 'model',
        content: data.response,
      };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error('Failed to get response:', error);
      let friendlyErrorMessage = "Sorry, I'm having trouble connecting. Please try again later.";
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
          friendlyErrorMessage = "I can't connect to the server. It might be offline or there's a network issue. Please check the server logs and restart it if necessary.";
      } else if (error instanceof Error) {
          friendlyErrorMessage = error.message;
      }
      
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'model',
        content: friendlyErrorMessage,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          {isOpen ? <X /> : <MessageSquare />}
          <span className="sr-only">Toggle Chat</span>
        </Button>
      </div>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-full max-w-sm glass-effect rounded-xl shadow-2xl slide-in custom-shadow">
          <div className="flex flex-col h-[500px]">
            <header className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-white">AbePay Support</h3>
            </header>
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start gap-2">
                     <div className="bg-slate-700 text-slate-200 rounded-lg px-4 py-2 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin"/>
                     </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <footer className="p-4 border-t border-slate-700">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="bg-slate-800 border-slate-600 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading}>
                  <Send />
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
