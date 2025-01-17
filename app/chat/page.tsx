"use client";

import { useState } from 'react';
import { User } from 'next-auth';
import ChatPage from './[userId]/page';
import Sidebar from '@/components/Sidebar';
import Users from '@/components/UsersBar';


const ChatLayout = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1">
            <Sidebar />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col mt-16 overflow-hidden">
        <main className="flex-1 flex">
          {/* Chat Area */}
          <div className="flex-1 mt-16 flex flex-col bg-white">
            <ChatPage selectedUserId={selectedUser?.id || null} />
          </div>

          {/* Users Sidebar - Desktop only */}
          <div className="hidden mt-16 lg:flex lg:flex-col w-64 border-l border-gray-200 bg-white">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Active Users</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Users onSelectUser={setSelectedUser} />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200">
        <Sidebar isMobile={true} />
      </div>
    </div>
  );
};

export default ChatLayout;