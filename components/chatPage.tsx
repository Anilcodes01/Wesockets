"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import { EmptyChat } from "./EmptyChat";
import { ChatHeader } from "./ChatHeader";
import { MessageInput } from "./MessageInput";
import { useMessages } from "@/app/hooks/useMessages";
import { useScrollToBottom } from "@/app/hooks/useScrollToBottom";

interface ChatProps {
  selectedUserId: string | null;
  selectedUserName: string | null;
  selectedUserAvatarUrl: string | null;
  onBack?: () => void;
}

export default function ChatPage({
  selectedUserId,
  selectedUserName,
  selectedUserAvatarUrl,
  onBack,
}: ChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const { data: session, status } = useSession();
  const { messages, isLoading, socket } = useMessages(selectedUserId);
  const { messageContainerRef, scrollToBottom, isScrolledToBottom } =
    useScrollToBottom();

  useEffect(() => {
    if (selectedUserId) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [selectedUserId, scrollToBottom]);

  useEffect(() => {
    if (!messages.length) return;

    const shouldScroll =
      isScrolledToBottom() ||
      messages[messages.length - 1].senderId === session?.user.id;
    if (shouldScroll) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, scrollToBottom, isScrolledToBottom, session?.user.id]);

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [isLoading, messages.length, scrollToBottom]);

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
        <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center">
          <span className="text-blue-600  font-medium text-sm">
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
        <div className="h-6 w-6 rounded-full bg-green-200 flex items-center justify-center">
          <span className="text-green-600 font-medium text-sm">
            {selectedUserName?.charAt(0) || "U"}
          </span>
        </div>
      );
    }
  };

  if (status === "loading") return <EmptyChat type="loading" />;
  if (!session) return <EmptyChat type="no-session" />;
  if (!selectedUserId) return <EmptyChat type="no-user" />;

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        selectedUserAvatarUrl={selectedUserAvatarUrl}
        selectedUserName={selectedUserName}
        onBack={onBack}
      />

      <div
        ref={messageContainerRef}
        className="flex-1 hide-scrollbar bg-white overflow-y-auto p-4 scroll-smooth"
      >
        {isLoading ? (
          <EmptyChat type="loading" />
        ) : messages.length === 0 ? (
          <EmptyChat type="no-messages" />
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isCurrentUser={message.senderId === session.user.id}
                renderAvatar={renderAvatar}
              />
            ))}
          </div>
        )}
      </div>

      <MessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSubmit={sendMessage}
      />
    </div>
  );
}
