import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { Button } from '../ui/Button';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: 'Namaste! I am your AI assistant. How can I help you today?', sender: 'ai' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), text: inputValue, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "I understand you have a query. Let me connect you to the right department or help you file a grievance.",
          sender: 'ai'
        }
      ]);
    }, 1500);
  };

  const handleQuickReply = (text: string) => {
    setInputValue(text);
    // Slight delay before sending to simulate user clicking then sending
    setTimeout(() => {
      // In a real app, you might want to call handleSend directly here
      // But since handleSend relies on state that might not be updated yet,
      // we'll duplicate the logic for quick replies to ensure it works.
      const userMsg = { id: Date.now(), text, sender: 'user' };
      setMessages((prev) => [...prev, userMsg]);
      setInputValue('');
      setIsTyping(true);
      
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: `Sure, I can help you with "${text}". Please provide more details.`,
            sender: 'ai'
          }
        ]);
      }, 1500);
    }, 100);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed z-50 md:bottom-8 md:right-8 bottom-24 right-4 bg-primary text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:bg-primary-hover transition-all duration-300 animate-pulse-subtle flex items-center justify-center ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed z-50 md:bottom-8 md:right-8 bottom-0 right-0 w-full md:w-96 md:h-[500px] h-[calc(100vh-64px)] bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 md:rounded-2xl shadow-2xl flex flex-col transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="bg-primary text-white p-4 md:rounded-t-2xl flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 p-1.5 rounded-full">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Nagrik Setu Assistant</h3>
              <p className="text-xs text-blue-100">Usually replies instantly</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-[#0F1620] space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end space-x-2 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300' : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400'}`}>
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end space-x-2 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-bl-none shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {messages.length === 1 && !isTyping && (
          <div className="p-3 bg-gray-50 dark:bg-[#0F1620] flex flex-wrap gap-2">
            <button onClick={() => handleQuickReply('File a complaint')} className="text-xs bg-white dark:bg-surface-dark border border-primary/20 dark:border-blue-900/50 text-primary dark:text-blue-400 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white dark:hover:bg-blue-900 dark:hover:text-blue-300 transition-colors shadow-sm">
              File a complaint
            </button>
            <button onClick={() => handleQuickReply('Check status')} className="text-xs bg-white dark:bg-surface-dark border border-primary/20 dark:border-blue-900/50 text-primary dark:text-blue-400 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white dark:hover:bg-blue-900 dark:hover:text-blue-300 transition-colors shadow-sm">
              Check status
            </button>
            <button onClick={() => handleQuickReply('Talk to a human')} className="text-xs bg-white dark:bg-surface-dark border border-primary/20 dark:border-blue-900/50 text-primary dark:text-blue-400 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white dark:hover:bg-blue-900 dark:hover:text-blue-300 transition-colors shadow-sm">
              Talk to a human
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800 md:rounded-b-2xl shrink-0">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 bg-gray-100 dark:bg-[#0F1620] border-transparent focus:bg-white dark:focus:bg-surface-dark focus:border-primary focus:ring-1 focus:ring-primary rounded-full px-4 py-2 text-sm transition-all dark:text-gray-200 dark:placeholder-gray-500 outline-none"
            />
            <Button size="icon" onClick={handleSend} disabled={!inputValue.trim()} className="rounded-full shrink-0">
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
