import { useEffect, useRef, type ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { apiClient } from '../api/client';
import type { MessagePushEvent } from '../types/messaging';

function wsUrl(): string {
  const base = apiClient.defaults.baseURL ?? 'http://localhost:8080';
  return base.replace(/^http/, 'ws') + '/ws';
}

/**
 * Owns one STOMP connection for the life of a logged-in session, mounted once near the app root
 * (see App.tsx) rather than inside InboxPage, so the topbar's unread badge stays live even when
 * Inbox isn't open. No context value is exposed - every consumer just reads the React Query
 * caches this invalidates (['conversations'], ['conversations', id, 'messages']) the normal way.
 *
 * The push itself is never trusted as data - see MessagePushEvent's own doc comment - this only
 * ever triggers a refetch through the existing REST endpoints (conversationApi), so a missed or
 * out-of-order frame can never leave the UI in a wrong state.
 */
export function MessagingProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!session) {
      clientRef.current?.deactivate();
      clientRef.current = null;
      return;
    }

    const client = new Client({
      brokerURL: wsUrl(),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/user/queue/messages', (frame) => {
          const event = JSON.parse(frame.body) as MessagePushEvent;
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['conversations', event.conversationId, 'messages'] });
        });
      },
    });
    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
    // Reconnect if the logged-in user changes (e.g. logout then a different login), not on every
    // unrelated session field update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.tenantCode, session?.email]);

  return <>{children}</>;
}
