'use client';

import { useSocket } from '@/app/hooks/useSocket';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { use } from 'react';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default function ChatPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const socket = useSocket();
  const { data: session } = useSession();

  useEffect(() => {
    if (!socket) return;

    socket.on('receiveMessage', (message: any) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [socket]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !newMessage.trim() || !session?.user.id) return;

    const messageData = {
      content: newMessage,
      senderId: session.user.id,
      receiverId: userId,
    };

    socket.emit('sendMessage', messageData);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col bg-white text-black h-screen p-4">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[70%] ${
              message.senderId === session?.user.id
                ? 'ml-auto bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 text-black border rounded"
          placeholder="Type a message..."
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded"
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}