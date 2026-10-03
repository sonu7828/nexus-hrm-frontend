import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { useChatbot } from './useChatbot';
import { ChatWindow } from './ChatWindow';

const ChatbotWidget = () => {
  const chatbot = useChatbot();
  const [dragConstraints, setDragConstraints] = React.useState({ left: 0, right: 0, top: 0, bottom: 0 });

  React.useEffect(() => {
    const handleResize = () => {
      const btnSize = 64;
      const bottomOffset = 24; // bottom-6 is 24px
      const rightOffset = 24;  // right-6 is 24px

      const maxDragUp = window.innerHeight - bottomOffset - btnSize;
      const maxDragLeft = window.innerWidth - rightOffset - btnSize;

      setDragConstraints({
        left: -Math.max(0, maxDragLeft),
        right: 0,
        top: -Math.max(0, maxDragUp),
        bottom: 0
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <ChatWindow {...chatbot} />

      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-[100] no-print flex flex-col items-end">
        <AnimatePresence>
          {!chatbot.isOpen && (
            <motion.button
              drag
              dragMomentum={false}
              dragElastic={0.1}
              dragConstraints={dragConstraints}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={chatbot.toggleOpen}
              className="mt-4 relative w-16 h-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-full shadow-[0_10px_25px_rgba(79,70,229,0.5)] flex items-center justify-center border-4 border-white/20 backdrop-blur-xl transition-shadow cursor-grab active:cursor-grabbing"
            >
              <Sparkles className="absolute top-3 right-3 text-white/60 animate-pulse" size={14} />
              <Bot size={28} className="drop-shadow-lg" />
              
              {chatbot.hasUnread && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 border-2 border-white rounded-full animate-bounce shadow-lg"></span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </>
  );
};

export default ChatbotWidget;
