"use client";

import { useSocket } from "@/app/hooks/useSocket";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { Message } from "@/app/types/message";
import { Send, Loader, User, MessageSquare } from "lucide-react";

interface ChatProps {
  selectedUserId: string | null;
}

export default function ChatPage({ selectedUserId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const socket = useSocket(status === "authenticated" ? session?.user.id : "");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (session?.user.id && selectedUserId) {
      setIsLoading(true);
      fetch(
        `/api/messages?senderId=${session.user.id}&receiverId=${selectedUserId}`
      )
        .then((res) => res.json())
        .then((data) => {
          setMessages(data);
          scrollToBottom();
        })
        .catch((err) => {
          console.error("Error loading messages:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setMessages([]);
    }
  }, [session?.user.id, selectedUserId]);

  useEffect(() => {
    if (socket) {
      socket.on("receiveMessage", (message: Message) => {
        if (
          message.senderId === selectedUserId ||
          (message.senderId === session?.user.id &&
            message.receiverId === selectedUserId)
        ) {
          setMessages((prevMessages) => [...prevMessages, message]);
        }
      });

      socket.on("messageSaved", (message: Message) => {
        if (
          message.senderId === selectedUserId ||
          (message.senderId === session?.user.id &&
            message.receiverId === selectedUserId)
        ) {
          setMessages((prevMessages) => [...prevMessages, message]);
        }
      });

      return () => {
        socket.off("receiveMessage");
        socket.off("messageSaved");
      };
    }
  }, [socket, selectedUserId, session?.user.id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !newMessage.trim() || !session?.user.id || !selectedUserId)
      return;

    const messageData = {
      content: newMessage.trim(),
      senderId: session.user.id,
      receiverId: selectedUserId,
    };

    try {
      socket.emit("sendMessage", messageData);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Please Sign In
          </h2>
          <p className="mt-2 text-gray-600">
            You need to be signed in to access the chat.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedUserId) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <User className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">Select a User</h2>
        <p className="mt-2 text-gray-600">
          Choose someone to start chatting with
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">
          Chat with {selectedUserId}
        </h2>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        {isLoading ? (
          <div className="flex justify-center pt-4">
            <Loader className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800">
              No messages yet
            </h3>
            <p className="text-gray-600">Send a message to start chatting</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === session.user.id
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${
                    message.senderId === session.user.id
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-800"
                  }`}
                >
                  <p className="break-words">{message.content}</p>
                  <span className="text-xs opacity-75 block mt-1">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Type your message..."
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
