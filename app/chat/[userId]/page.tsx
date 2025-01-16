"use client";

import { useSocket } from "@/app/hooks/useSocket";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { use } from "react";
import { Message } from "@/app/types/message";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default function ChatPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const receiverId = resolvedParams.userId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const socket = useSocket(status === "authenticated" ? session?.user.id : "");

  // Function to scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (session?.user.id && receiverId) {
      fetch(
        `/api/messages?senderId=${session.user.id}&receiverId=${receiverId}`
      )
        .then((res) => res.json())
        .then((data) => {
          setMessages(data);
          setIsLoading(false);
          // Scroll to bottom after initial messages load
          scrollToBottom();
        })
        .catch((err) => {
          console.error("Error loading messages:", err);
          setIsLoading(false);
        });
    }
  }, [session?.user.id, receiverId]);

  useEffect(() => {
    if (socket) {
      console.log("Socket connected:", socket.connected);
      console.log("Session user ID:", session?.user.id);
      console.log("Receiver ID:", receiverId);

      // Listening for incoming messages
      socket.on("receiveMessage", (message: Message) => {
        console.log("Incoming message:", message);
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      // Listen for message saved confirmation
      socket.on("messageSaved", (message: Message) => {
        console.log("Message saved:", message);
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      // Cleanup listeners on component unmount
      return () => {
        socket.off("receiveMessage");
        socket.off("messageSaved");
      };
    }
  }, [socket, session?.user.id, receiverId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !newMessage.trim() || !session?.user.id) return;

    console.log("Sending message:", {
      content: newMessage,
      senderId: session.user.id,
      receiverId: receiverId,
    });

    const messageData = {
      content: newMessage.trim(),
      senderId: session.user.id,
      receiverId: receiverId,
    };

    try {
      socket.emit("sendMessage", messageData);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (status === "loading" || isLoading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Please sign in to continue</div>;
  }

  return (
    <div className="flex flex-col bg-white text-black h-screen p-4">
      <div className="text-black bg-sky-400 px-4 py-1 text-xl font-bold rounded-lg shadow-md">
        Chat with {receiverId}
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg max-w-[70%] ${
              message.senderId === session.user.id
                ? "ml-auto bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
          >
            <div className="break-words">{message.content}</div>
            <div className="text-xs mt-1 opacity-75">
              {new Date(message.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {/* Scroll anchor div */}
        <div ref={messagesEndRef} />
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
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}