type Message = {
  id: string;
  body: string;
  timestamp: number;
};

type MessageQueue = Record<string, Record<string, Message[]>>; // serviceId -> clientId -> messages
type AcknowledgedMessages = Record<string, Record<string, Set<string>>>; // serviceId -> clientId -> set of message IDs

const queues: MessageQueue = {};
const acknowledged: AcknowledgedMessages = {};

export async function enqueueMessage(
  serviceId: string,
  clientId: string,
  body: string,
  id: string
): Promise<void> {
  queues[serviceId] = queues[serviceId] || {};
  queues[serviceId][clientId] = queues[serviceId][clientId] || [];

  const alreadyExists = queues[serviceId][clientId].some(msg => msg.id === id);
  if (alreadyExists) return;

  queues[serviceId][clientId].push({
    id,
    body,
    timestamp: Date.now(),
  });
}

export async function acknowledgeMessage(
  serviceId: string,
  clientId: string,
  messageId: string
): Promise<void> {
  acknowledged[serviceId] = acknowledged[serviceId] || {};
  acknowledged[serviceId][clientId] = acknowledged[serviceId][clientId] || new Set();

  acknowledged[serviceId][clientId].add(messageId);

  // Remove acknowledged messages from queue
  queues[serviceId][clientId] = (queues[serviceId][clientId] || []).filter(
    msg => msg.id !== messageId
  );
}

export async function getPendingMessagesForService(
  serviceId: string,
  clientId: string
): Promise<Message[]> {
  return queues[serviceId]?.[clientId] || [];
}

export async function simulateServiceReconnect(serviceId: string): Promise<void> {
  // No-op in this mock; the queue is already persistent
}

export async function clearQueue(): Promise<void> {
  for (const service in queues) {
    delete queues[service];
  }
  for (const service in acknowledged) {
    delete acknowledged[service];
  }
}
