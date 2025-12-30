import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSmile } from 'react-icons/fi';

const EMOJI_CATEGORIES = {
  'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'],
  'Gestures': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  'Objects': ['💼', '📁', '📂', '📄', '📃', '📑', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '📇', '🗃️', '🗳️', '🗄️', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗑️', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️'],
  'Symbols': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️'],
};

const EmojiPicker = ({ onSelect, isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('Smileys & People');

  const handleEmojiClick = (emoji) => {
    onSelect(emoji);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl border border-neutral-200 w-80 h-96 z-50 flex flex-col"
        >
            {/* Categories */}
            <div className="flex border-b border-neutral-200 p-2 overflow-x-auto">
              {Object.keys(EMOJI_CATEGORIES).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {category.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Emojis Grid */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_CATEGORIES[selectedCategory].map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-2xl hover:bg-neutral-100 rounded-lg p-2 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EmojiPicker;
