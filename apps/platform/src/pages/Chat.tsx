import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Container, Button, cn } from "@skola/ui";
import { useAuth } from "../contexts/AuthContext";
import { useChatRooms, useChatMessages, useSendMessage } from "../hooks/useChat";
import type { ChatRoom, Message } from "../lib/api";

export function ChatPage() {
  const { isConnected } = useAccount();
  const { isAuthenticated, signIn, user } = useAuth();

  if (!isConnected) {
    return (
      <div className="py-8">
        <Container>
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="mb-6 rounded-full bg-primary/10 p-6">
              <ChatIcon className="h-12 w-12 text-primary" />
            </div>
            <h1 className="mb-2 text-3xl font-bold">Chat</h1>
            <p className="mb-8 max-w-md text-muted-foreground">
              Connect your wallet to chat with creators and course communities.
            </p>
            <ConnectButton />
          </div>
        </Container>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="py-8">
        <Container>
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="mb-6 rounded-full bg-primary/10 p-6">
              <LockIcon className="h-12 w-12 text-primary" />
            </div>
            <h1 className="mb-2 text-3xl font-bold">Sign In Required</h1>
            <p className="mb-8 max-w-md text-muted-foreground">
              Sign in with your wallet to access chat.
            </p>
            <Button onClick={() => signIn()}>Sign In</Button>
          </div>
        </Container>
      </div>
    );
  }

  return <AuthenticatedChat userId={user!.id} />;
}

function AuthenticatedChat({ userId }: { userId: string }) {
  const [searchParams] = useSearchParams();
  const initialRoomId = searchParams.get("room");

  const { dmRooms, communityRooms, isLoading } = useChatRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialRoomId);
  const [selectedRoomType, setSelectedRoomType] = useState<"dm" | "community" | null>(null);

  useEffect(() => {
    if (initialRoomId) {
      const dm = dmRooms.find((r) => r.id === initialRoomId);
      const community = communityRooms.find((r) => r.id === initialRoomId);
      if (dm) setSelectedRoomType("dm");
      else if (community) setSelectedRoomType("community");
    }
  }, [initialRoomId, dmRooms, communityRooms]);

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoomId(room.id);
    setSelectedRoomType(room.type);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <aside className="w-80 shrink-0 overflow-y-auto border-r border-border">
        <div className="sticky top-0 border-b border-border bg-background p-4">
          <h2 className="font-semibold">Messages</h2>
        </div>

        {communityRooms.length > 0 && (
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
              Course Communities
            </p>
            {communityRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isSelected={selectedRoomId === room.id}
                onClick={() => handleSelectRoom(room)}
              />
            ))}
          </div>
        )}

        {dmRooms.length > 0 && (
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
              Direct Messages
            </p>
            {dmRooms.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                isSelected={selectedRoomId === room.id}
                onClick={() => handleSelectRoom(room)}
              />
            ))}
          </div>
        )}

        {dmRooms.length === 0 && communityRooms.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            <p>No chats yet</p>
            <p className="mt-1 text-sm">
              Purchase a course to join its community chat
            </p>
          </div>
        )}
      </aside>

      <main className="flex flex-1 flex-col">
        {selectedRoomId && selectedRoomType ? (
          <ChatRoom roomId={selectedRoomId} userId={userId} />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Select a conversation to start chatting
          </div>
        )}
      </main>
    </div>
  );
}

function RoomItem({
  room,
  isSelected,
  onClick,
}: {
  room: ChatRoom;
  isSelected: boolean;
  onClick: () => void;
}) {
  const displayName = room.type === "dm"
    ? room.otherUser?.username || truncateAddress(room.otherUser?.address || "")
    : room.course?.title || "Community";

  const avatar = room.type === "dm"
    ? room.otherUser?.avatar
    : room.course?.thumbnail;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-lg p-3 text-left transition-colors",
        isSelected ? "bg-primary/10" : "hover:bg-muted"
      )}
    >
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
        {avatar ? (
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            {room.type === "dm" ? (
              <UserIcon className="h-5 w-5" />
            ) : (
              <UsersIcon className="h-5 w-5" />
            )}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{displayName}</p>
        {room.lastMessage && (
          <p className="text-sm text-muted-foreground truncate">
            {room.lastMessage.content}
          </p>
        )}
      </div>
    </button>
  );
}

function ChatRoom({ roomId, userId }: { roomId: string; userId: string }) {
  const { messages, isLoading, addMessage } = useChatMessages(roomId);
  const { sendMessage, isLoading: isSending } = useSendMessage();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const content = input.trim();
    setInput("");

    try {
      const message = await sendMessage(roomId, content);
      addMessage(message);
    } catch {
      setInput(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === userId}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isSending}>
            Send
          </Button>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div className={cn("flex gap-3", isOwn && "flex-row-reverse")}>
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
        {message.sender.avatar ? (
          <img src={message.sender.avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <UserIcon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className={cn("max-w-[70%]", isOwn && "text-right")}>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">
            {message.sender.username || truncateAddress(message.sender.address)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <div
          className={cn(
            "mt-1 rounded-lg px-3 py-2 text-sm",
            isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
