import { Session } from 'next-auth';

export const createAvatarRenderer = (
  session: Session | null,
  selectedUserAvatarUrl: string | null,
  selectedUserName: string | null
) => {
  return (isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return session?.user?.avatarUrl ? (
        <img
          src={session.user.avatarUrl}
          alt="Your avatar"
          className="h-8 w-8 rounded-full"
        />
      ) : (
        <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center">
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
        <div className="h-6 w-6 rounded-full bg-green-200 flex items-center justify-center">
          <span className="text-green-600 font-medium text-sm">
            {selectedUserName?.charAt(0) || "U"}
          </span>
        </div>
      );
    }
  };
};