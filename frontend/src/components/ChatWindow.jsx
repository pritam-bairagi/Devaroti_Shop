import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, X, Loader2, Check, CheckCheck, Smile, Image as ImageIcon, Paperclip, Package, Trash2, Search, Edit } from 'lucide-react';
import { chatAPI, userAPI, productAPI } from '../services/api';
import { useSocket } from '../contexts/useSocket';
import { useAuth } from '../contexts/useAuth';
import toast from 'react-hot-toast';

const ChatWindow = ({ chatId: initialChatId, receiver, onClose, isMobile = false }) => {
  const { user } = useAuth();
  const { socket, on, off, joinChat } = useSocket();
  const [chatId, setChatId] = useState(initialChatId);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const initChat = async () => {
      setLoading(true);
      try {
        if (initialChatId) {
          setChatId(initialChatId);
          await fetchMessages(initialChatId);
          joinChat(initialChatId);
        } else if (receiver?._id || receiver?.id) {
          const targetId = receiver._id || receiver.id;
          const res = await chatAPI.getChatWithUser(targetId);
          if (res.data.success && res.data.chat) {
            setChatId(res.data.chat._id);
            setMessages(res.data.chat.messages || []);
            joinChat(res.data.chat._id);
          } else {
            setMessages([]);
            setChatId(null);
          }
        }
      } catch (err) {
        console.error("Chat init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [initialChatId, receiver?._id, receiver?.id, joinChat]);

  const fetchMessages = async (id) => {
    try {
      const res = await chatAPI.getMessages(id);
      if (res.data.success) {
        setMessages(res.data.messages || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      toast.error("Failed to load messages");
    }
  };

  const fetchSellerProducts = async (q = "") => {
    const targetId = receiver?._id || receiver?.id;
    if (!targetId) return;
    
    setLoadingProducts(true);
    try {
      // Use the existing productAPI to fetch products by seller ID
      const res = await productAPI.getProducts({ 
        seller: targetId, 
        search: q,
        limit: 20
      });
      if (res.data.success) {
        setSellerProducts(res.data.products || []);
      }
    } catch (err) {
      console.error("Failed to fetch seller products", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (showProductSelector) {
       fetchSellerProducts(productSearch);
    }
  }, [showProductSelector]);

  // Debounced search for products
  useEffect(() => {
    if (!showProductSelector) return;
    const timer = setTimeout(() => {
      fetchSellerProducts(productSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [productSearch]);

  useEffect(() => {
    if (!on || !chatId) return;

    const handleNewMessage = (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => {
          // Prevent duplicates if already added locally
          if (prev.some(m => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
        setTimeout(scrollToBottom, 100);
      }
    };

    const handleRemoteTyping = (data) => {
      if (data.userId !== user?._id && data.chatId === chatId) {
        setRemoteTyping(true);
      }
    };

    const handleRemoteStopTyping = (data) => {
      if (data.userId !== user?._id && data.chatId === chatId) {
        setRemoteTyping(false);
      }
    };

    on('new_message', handleNewMessage);
    on('message_updated', (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, message: data.newContent, isEdited: true } : m));
      }
    });
    on('user_typing', handleRemoteTyping);
    on('user_stop_typing', handleRemoteStopTyping);

    return () => {
      off('new_message', handleNewMessage);
      off('user_typing', handleRemoteTyping);
      off('user_stop_typing', handleRemoteStopTyping);
    };
  }, [chatId, user?._id, on, off]);

  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!isTyping && chatId && socket) {
      setIsTyping(true);
      socket.emit('typing', { chatId, userId: user?._id, userName: user?.name });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (chatId && socket) {
        socket.emit('stop_typing', { chatId, userId: user?._id });
      }
      setIsTyping(false);
    }, 2000);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("Image too large (max 5MB)");
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() && !selectedImage && !selectedProduct && !sending) return;

    setSending(true);
    const formData = new FormData();
    formData.append('receiverId', receiver._id || receiver.id);
    if (newMessage.trim()) formData.append('message', newMessage);
    if (chatId) formData.append('chatId', chatId);
    if (selectedProduct) formData.append('productId', selectedProduct._id);
    if (selectedImage) formData.append('image', selectedImage);

    try {
      const res = await chatAPI.sendMessage(formData);

      if (res.data.success) {
        const updatedChat = res.data.chat;
        if (!chatId) {
          setChatId(updatedChat._id);
          joinChat(updatedChat._id);
        }
        const sentMsg = res.data.message || updatedChat.messages[updatedChat.messages.length - 1];
        setMessages(prev => {
           if (prev.some(m => m._id === sentMsg._id)) return prev;
           return [...prev, sentMsg];
        });
        setNewMessage("");
        setSelectedImage(null);
        setImagePreview(null);
        setSelectedProduct(null);
        setTimeout(scrollToBottom, 50);
      }
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (msgId) => {
    if (!editContent.trim()) return;
    try {
      const res = await chatAPI.editMessage(chatId, msgId, { message: editContent });
      if (res.data.success) {
        setMessages(prev => prev.map(m => m._id === msgId ? { ...m, message: editContent, isEdited: true } : m));
        setEditingMessageId(null);
        setEditContent("");
        toast.success("Message updated");
      }
    } catch (err) {
      toast.error("Failed to update message");
    }
  };



  return (
    <div className={`flex flex-col h-full bg-slate-900 text-white ${isMobile ? '' : 'rounded-2xl border border-slate-700 shadow-2xl overflow-hidden'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={receiver?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(receiver?.name || "U")}&background=ff5500&color=fff`} 
              className="w-10 h-10 rounded-full object-cover border-2 border-orange-500/30" 
              alt="" 
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">{receiver?.shopName || receiver?.name}</h3>
            <p className="text-[10px] text-emerald-400">Online</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-4">
            <Loader2 className="animate-spin text-orange-500" size={20} />
          </div>
        ) : (
          messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Send size={24} className="text-slate-500 -rotate-45" />
              </div>
              <h4 className="text-white font-medium mb-1">No messages yet</h4>
              <p className="text-slate-500 text-xs">Start the conversation by sending a message below.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const senderId = msg.sender?._id || msg.sender;
              const currentUserId = user?._id || user?.id;
              const isMe = senderId === currentUserId;
              const isEditing = editingMessageId === msg._id;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  key={idx}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
                >
                  <div className={`max-w-[80%] rounded-2xl text-sm relative ${
                    isMe 
                      ? 'bg-orange-500 text-white rounded-tr-none shadow-lg shadow-orange-500/20' 
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                  }`}>
                    <div className="p-3">
                      {msg.product && (
                        <div className={`mb-2 rounded-xl border border-white/20 overflow-hidden cursor-pointer ${isMe ? 'bg-orange-600/50' : 'bg-slate-900'}`}>
                          <div className="flex items-center gap-3 p-2">
                             <img src={msg.product.image} className="w-12 h-12 rounded-lg object-contain bg-white" alt="" />
                             <div className="min-w-0">
                               <p className="font-bold text-xs truncate">{msg.product.name}</p>
                               <p className={`${isMe ? 'text-orange-100' : 'text-orange-400'} font-bold text-xs`}>৳{msg.product.sellingPrice}</p>
                             </div>
                          </div>
                        </div>
                      )}
                      {msg.image && (
                         <div className="mb-2 rounded-xl overflow-hidden border border-white/10">
                            <img src={msg.image} className="w-full h-auto max-h-64 object-cover" alt="" 
                                 onClick={() => window.open(msg.image, '_blank')} />
                         </div>
                      )}
                      {msg.message && (
                        isEditing ? (
                          <div className="space-y-2 py-1">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full bg-white/10 border border-white/20 rounded p-1.5 text-xs text-white focus:outline-none"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingMessageId(null)} className="text-[10px] hover:underline opacity-80">Cancel</button>
                              <button onClick={() => handleEditMessage(msg._id)} className="text-[10px] bg-white text-orange-500 px-2 py-0.5 rounded font-bold">Save</button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            {msg.isEdited && <span className="text-[8px] opacity-40 italic block mt-0.5">(edited)</span>}
                          </div>
                        )
                      )}
                      
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[9px] opacity-60">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          <>
                            <span className="opacity-60">
                              {msg.read ? <CheckCheck size={12} className="text-emerald-300" /> : <Check size={12} />}
                            </span>
                            {!msg.image && !msg.product && !isEditing && (
                              <button 
                                onClick={() => { setEditingMessageId(msg._id); setEditContent(msg.message); }}
                                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded"
                                title="Edit message"
                              >
                                <Edit size={10} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
                );
              })
          )
        )}

        {remoteTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800/50 text-slate-400 px-4 py-2 rounded-2xl rounded-tl-none border border-slate-700/50 flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"></span>
                <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </span>
              <span className="text-[10px] italic">Someone is typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-800/30 border-t border-slate-700">
        <AnimatePresence>
          {imagePreview && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="mb-3 relative inline-block">
              <img src={imagePreview} className="w-20 h-20 rounded-xl object-cover border-2 border-orange-500" alt="" />
              <button onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white shadow-lg">
                <X size={12} />
              </button>
            </motion.div>
          )}

          {selectedProduct && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="mb-3 p-3 bg-slate-800 rounded-xl border border-orange-500/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={selectedProduct.image} className="w-10 h-10 rounded-lg object-contain bg-white" alt="" />
                <div>
                  <p className="text-xs font-bold truncate max-w-[150px]">{selectedProduct.name}</p>
                  <p className="text-orange-400 text-[10px] font-bold">৳{selectedProduct.sellingPrice}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white">
                <X size={14} />
              </button>
            </motion.div>
          )}

          {showProductSelector && (
             <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="mb-3 bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
                <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Product from Seller</h4>
                   <button onClick={() => { setShowProductSelector(false); setProductSearch(""); }}><X size={14} /></button>
                </div>
                {/* Search Box */}
                <div className="p-2 border-b border-slate-800 bg-slate-800/20">
                   <div className="relative">
                     <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                     <input 
                       type="text"
                       placeholder="Search products..."
                       value={productSearch}
                       onChange={(e) => setProductSearch(e.target.value)}
                       className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-orange-500"
                     />
                   </div>
                </div>
                <div className="max-h-48 overflow-y-auto p-2 grid grid-cols-2 gap-2">
                   {loadingProducts ? <Loader2 className="animate-spin mx-auto col-span-2 my-4 text-orange-500" /> : 
                    sellerProducts.length === 0 ? <p className="col-span-2 text-center text-xs py-4 text-slate-500">No products found</p> :
                    sellerProducts.slice(0, 4).map(p => (
                      <div key={p._id} onClick={() => { setSelectedProduct(p); setShowProductSelector(false); setProductSearch(""); }}
                           className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-orange-500/30 group">
                         <div className="relative w-8 h-8 rounded overflow-hidden bg-white shrink-0">
                           <img src={p.image} className="w-full h-full object-contain" alt="" />
                         </div>
                         <div className="min-w-0 flex-1">
                           <p className="text-[10px] truncate text-slate-200 group-hover:text-orange-400 font-medium">{p.name}</p>
                           <p className="text-[9px] text-orange-400 font-bold">৳{p.sellingPrice}</p>
                         </div>
                      </div>
                    ))}
                    {sellerProducts.length > 4 && (
                      <p className="col-span-2 text-center text-[8px] text-slate-600 mt-1 italic">Use search to find more items...</p>
                    )}
                </div>
             </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex gap-1">
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageSelect} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors hover:bg-slate-800">
              <ImageIcon size={18} />
            </button>
            <button type="button" onClick={() => setShowProductSelector(!showProductSelector)} className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors hover:bg-slate-800">
              <Package size={18} />
            </button>
          </div>
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500 transition-all text-white placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedImage && !selectedProduct) || sending}
            className="w-10 h-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-30 disabled:hover:bg-orange-500 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-orange-500/20"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="text-white" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
