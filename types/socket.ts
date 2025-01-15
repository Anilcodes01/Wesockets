export interface ServerToClientEvents {
    receiveMessage: (message: {
      id: string;
      content: string;
      senderId: string;
      receiverId: string;
      createdAt: Date;
    }) => void;
    userStatusChange: (update: { userId: string; isActive: boolean }) => void;
  }
  
  export interface ClientToServerEvents {
    sendMessage: (message: {
      content: string;
      receiverId: string;
    }) => void;
    setUserStatus: (status: { isActive: boolean }) => void;
  }