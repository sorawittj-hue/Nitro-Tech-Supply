import type { ClientMessage, ServerMessage } from '../protocol/messages';

export interface MessageTransport {
  send(message: ClientMessage): void;
  onMessage(handler: (message: ServerMessage) => void): () => void;
  onConnectionChange(handler: (isConnected: boolean) => void): () => void;
  isConnected(): boolean;
  dispose(): void;
}
