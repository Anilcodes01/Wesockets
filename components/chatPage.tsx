"use client";

import { useSocket } from "@/app/hooks/useSocket";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { Message } from "@/app/types/message";
import { Send, Loader, User, MessageSquare } from "lucide-react";

interface ChatProps {
  selectedUserId: string | null;
  selectedUserName: string | null;
  selectedUserAvatarUrl: string | null;
}

export default function ChatPage({
  selectedUserId,
  selectedUserName,
  selectedUserAvatarUrl,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();

  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [shouldScrollSmooth, setShouldScrollSmooth] = useState(true);

  console.log(shouldScrollSmooth);

  const socket = useSocket(status === "authenticated" ? session?.user.id : "");

  const scrollToBottom = (smooth = true) => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      setShouldScrollSmooth(false);
      scrollToBottom(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (!messages.length) return;

    const container = messageContainerRef.current;
    if (!container) return;

    const isScrolledToBottom = () => {
      const threshold = 100;
      return (
        container.scrollHeight - container.scrollTop - container.clientHeight <=
        threshold
      );
    };

    if (isScrolledToBottom() || messages.length <= 1) {
      setTimeout(() => {
        scrollToBottom(true);
      }, 50);
    }
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
          setTimeout(() => {
            scrollToBottom(true);
          }, 100);
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

  const renderAvatar = (isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return session?.user?.avatarUrl ? (
        <img
          src={session.user.avatarUrl}
          alt="Your avatar"
          className="h-8 w-8 rounded-full"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center">
          <span className="text-blue-600 font-medium text-sm">
            {session?.user?.name?.charAt(0) || "Y"}
          </span>
        </div>
      );
    } else {
      return selectedUserAvatarUrl ? (
        <img
          src={selectedUserAvatarUrl}
          alt={`${selectedUserName}'s avatar`}
          className="h-8 w-8 rounded-full"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-green-200 flex items-center justify-center">
          <span className="text-green-600 font-medium text-sm">
            {selectedUserName?.charAt(0) || "U"}
          </span>
        </div>
      );
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
      <div className="px-4 py-3 bg-white border-b flex gap-2 items-center border-gray-200">
        <div className="flex-shrink-0">
          {selectedUserAvatarUrl ? (
            <img
              src={selectedUserAvatarUrl}
              alt={selectedUserName || "User"}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-green-200 flex items-center justify-center">
              <span className="text-green-600 font-medium text-lg">
                {selectedUserName?.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <h2 className="text-lg font-semibold text-gray-800">
          {selectedUserName || "Unknown User"}
        </h2>
      </div>

      <div
        ref={messageContainerRef}
        className="flex-1 hide-scrollbar bg-white overflow-y-auto p-4"
      >
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
            {messages.map((message) => {
              const isCurrentUser = message.senderId === session.user.id;
              return (
                <div
                  key={message.id}
                  className={`flex items- gap-2 ${
                    isCurrentUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {renderAvatar(isCurrentUser)}
                  </div>
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${
                      isCurrentUser
                        ? "bg-green-600 text-white "
                        : "bg-gray-200 text-black "
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                    <span className="text-xs opacity-75 block mt-1">
                      {(() => {
                        const date = new Date(message.createdAt);
                        let hours = date.getHours();
                        const minutes = date
                          .getMinutes()
                          .toString()
                          .padStart(2, "0");
                        const ampm = hours >= 12 ? "PM" : "AM";
                        hours = hours % 12 || 12;
                        return `${hours}:${minutes} ${ampm}`;
                      })()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 text-black rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
