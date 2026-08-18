import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: 'Namaste! I am Navya, your AI assistant for Nagrik Setu. How can I help you today?', sender: 'ai' }
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

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue;
    const userMsg = { id: Date.now(), text: userText, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const systemPrompt = `You are Navya, the official AI Assistant for Nagrik Setu, the AI-assisted citizen grievance redressal platform.
Your job is to help citizens understand how to use the platform. Be concise, polite, and helpful. Use simple language.

Context about the platform:
- To file a complaint, users should click on the "File Complaint" link in the navigation bar. They can provide a description (using text or voice), upload photos/videos, and tag their location using the interactive map. The AI will automatically route it to the right department.
- To check the status of a complaint, users can click on "Track Status" in the navigation bar and enter their Grievance ID, or they can log in as a Citizen and go to "My Dashboard" to see all their complaints.
- If a grievance is marked as "Resolved" but the citizen is not satisfied, they can submit feedback from the Track Status page, which will automatically reopen the case and escalate it to the Super Admin with Critical priority.
- Citizens can login using the demo number 8888888888.
- The platform uses AI for automatic duplicate detection, department routing, and priority assignment.
- Do not provide code or technical details. Focus on guiding the citizen.`;

      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
        { role: "user", content: userText }
      ];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: apiMessages,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      const botText = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that right now.";
      
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: botText, sender: 'ai' }]);
    } catch (error) {
      console.error("Chatbot API Error:", error);
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: "I'm having trouble connecting to the server. Please try again later.", sender: 'ai' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReplyAction = async (text: string) => {
    const userMsg = { id: Date.now(), text, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const systemPrompt = `You are Navya, the official AI Assistant for Nagrik Setu, the AI-assisted citizen grievance redressal platform.
Your job is to help citizens understand how to use the platform. Be concise, polite, and helpful. Use simple language.

Context about the platform:
- To file a complaint, users should click on the "File Complaint" link in the navigation bar. They can provide a description (using text or voice), upload photos/videos, and tag their location using the interactive map. The AI will automatically route it to the right department.
- To check the status of a complaint, users can click on "Track Status" in the navigation bar and enter their Grievance ID, or they can log in as a Citizen and go to "My Dashboard" to see all their complaints.
- If a grievance is marked as "Resolved" but the citizen is not satisfied, they can submit feedback from the Track Status page, which will automatically reopen the case and escalate it to the Super Admin with Critical priority.
- Citizens can login using the demo number 8888888888.
- The platform uses AI for automatic duplicate detection, department routing, and priority assignment.
- Do not provide code or technical details. Focus on guiding the citizen.`;

      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
        { role: "user", content: text }
      ];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: apiMessages,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      const botText = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that right now.";
      
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: botText, sender: 'ai' }]);
    } catch (error) {
      console.error("Chatbot API Error:", error);
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: "I'm having trouble connecting to the server. Please try again later.", sender: 'ai' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed z-50 md:bottom-8 md:right-8 bottom-24 right-4 bg-primary text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl hover:bg-primary-hover transition-all duration-300 animate-pulse-subtle flex items-center justify-center overflow-hidden ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        {true ? (
          <div className="w-10 h-10 flex items-center justify-center">
            <DotLottieReact src="/animations/chatbot.json" loop autoplay style={{ width: '100%', height: '100%' }} />
          </div>
        ) : (
          <MessageSquare size={24} />
        )}
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
              <h3 className="font-semibold text-sm">Navya - AI Assistant</h3>
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
            <button onClick={() => handleQuickReplyAction('How do I file a complaint?')} className="text-xs bg-white dark:bg-surface-dark border border-primary/20 dark:border-blue-900/50 text-primary dark:text-blue-400 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white dark:hover:bg-blue-900 dark:hover:text-blue-300 transition-colors shadow-sm">
              How do I file a complaint?
            </button>
            <button onClick={() => handleQuickReplyAction('How can I check my status?')} className="text-xs bg-white dark:bg-surface-dark border border-primary/20 dark:border-blue-900/50 text-primary dark:text-blue-400 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white dark:hover:bg-blue-900 dark:hover:text-blue-300 transition-colors shadow-sm">
              How can I check my status?
            </button>
            <button onClick={() => handleQuickReplyAction('What if I am not satisfied with the resolution?')} className="text-xs bg-white dark:bg-surface-dark border border-primary/20 dark:border-blue-900/50 text-primary dark:text-blue-400 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white dark:hover:bg-blue-900 dark:hover:text-blue-300 transition-colors shadow-sm">
              Not satisfied with resolution?
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
