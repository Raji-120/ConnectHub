import React, { useState, useRef } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  X,
  FileText,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '🚀', '🎉', '😂', '👀', '✨', '🙌', '💯', '👏', '💡'];

export const MessageInput = ({
  onSendMessage,
  onTyping,
  placeholder = 'Type a message...',
  disabled = false,
  uploading = false,
  onFileUpload,
}) => {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    if (onTyping) {
      onTyping();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if ((!content.trim() && !selectedFile) || disabled || uploading) return;

    if (onSendMessage) {
      onSendMessage(content.trim(), selectedFile);
    }

    setContent('');
    removeSelectedFile();
    setShowEmojiPicker(false);
  };

  const addEmoji = (emoji) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="p-4 bg-gray-950/80 border-t border-gray-800 shrink-0 relative">
      {/* Emoji Quick Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-30 p-2.5 rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl flex items-center gap-1.5 animate-fadeIn">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="w-8 h-8 rounded-xl hover:bg-gray-800 flex items-center justify-center text-lg hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Selected file preview pill */}
      {selectedFile && (
        <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/30 text-xs text-brand-300">
          <FileText className="w-3.5 h-3.5" />
          <span className="font-semibold truncate max-w-xs">{selectedFile.name}</span>
          <span className="text-[10px] text-gray-400">
            ({Math.round(selectedFile.size / 1024)} KB)
          </span>
          <button
            type="button"
            onClick={removeSelectedFile}
            className="p-0.5 rounded hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Container */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-gray-900 border border-gray-800 focus-within:border-brand-500/80 focus-within:ring-2 focus-within:ring-brand-500/20 rounded-2xl p-1.5 transition"
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition"
          title="Attach a file"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition"
          title="Add Emoji"
        >
          <Smile className="w-4 h-4" />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || uploading}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-2 py-1 text-sm text-gray-100 placeholder-gray-500 outline-none"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!content.trim() && !selectedFile) || disabled || uploading}
          className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/30 transition disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          title="Send Message"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
