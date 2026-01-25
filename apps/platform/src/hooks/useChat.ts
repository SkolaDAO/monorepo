import { useState, useEffect, useCallback, useRef } from "react";
import { api, type ChatRoom, type Message } from "../lib/api";

interface ChatRoomsResponse {
  dmRooms: ChatRoom[];
  communityRooms: ChatRoom[];
}

export function useChatRooms() {
  const [data, setData] = useState<ChatRoomsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<ChatRoomsResponse>("/chat/rooms");
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch chat rooms"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (api.isAuthenticated()) {
      fetchRooms();
    } else {
      setIsLoading(false);
    }
  }, [fetchRooms]);

  return {
    dmRooms: data?.dmRooms ?? [],
    communityRooms: data?.communityRooms ?? [],
    isLoading,
    error,
    refetch: fetchRooms,
  };
}

export function useChatMessages(roomId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);

  const fetchMessages = useCallback(
    async (page = 1) => {
      if (!roomId) return;

      setIsLoading(true);
      try {
        const response = await api.get<{ messages: Message[]; hasMore: boolean }>(
          `/chat/rooms/${roomId}/messages`,
          { page, limit: 50 }
        );

        if (page === 1) {
          setMessages(response.messages);
        } else {
          setMessages((prev) => [...response.messages, ...prev]);
        }
        setHasMore(response.hasMore);
        pageRef.current = page;
      } catch {
        console.error("Failed to fetch messages");
      } finally {
        setIsLoading(false);
      }
    },
    [roomId]
  );

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchMessages(pageRef.current + 1);
    }
  }, [fetchMessages, isLoading, hasMore]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  useEffect(() => {
    if (roomId) {
      pageRef.current = 1;
      fetchMessages(1);
    } else {
      setMessages([]);
    }
  }, [roomId, fetchMessages]);

  return {
    messages,
    isLoading,
    hasMore,
    loadMore,
    addMessage,
    refetch: () => fetchMessages(1),
  };
}

export function useSendMessage() {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (roomId: string, content: string) => {
    setIsLoading(true);
    try {
      const message = await api.post<Message>(`/chat/rooms/${roomId}/messages`, { content });
      return message;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading };
}

export function useStartDM() {
  const [isLoading, setIsLoading] = useState(false);

  const startDM = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await api.post<{ roomId: string }>(`/chat/dm/${userId}`);
      return response.roomId;
    } finally {
      setIsLoading(false);
    }
  };

  return { startDM, isLoading };
}

export function useCourseCommunityRoom(courseId: string | null) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRoom = useCallback(async () => {
    if (!courseId || !api.isAuthenticated()) return;

    setIsLoading(true);
    try {
      const response = await api.get<{ roomId: string }>(`/chat/course/${courseId}/community`);
      setRoomId(response.roomId);
    } catch {
      console.error("Failed to fetch community room");
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  return { roomId, isLoading, refetch: fetchRoom };
}
