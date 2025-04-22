// src/client.service.ts

type Client = {
  id: string;
  name: string;
  email: string;
  [key: string]: any;
};

const clientDB: Record<string, Client> = {};

export async function createClient(data: Client): Promise<Client> {
  const { id, name, email } = data;

  if (!email) {
    throw new Error('Missing required field: email');
  }

  const client: Client = { ...data };
  clientDB[id] = client;
  return client;
}

export async function getClient(id: string): Promise<Client | null> {
  return clientDB[id] || null;
}

export async function updateClientData(id: string, updates: Record<string, any>): Promise<void> {
  if (!clientDB[id]) return;
  Object.assign(clientDB[id], updates);
}

export async function deleteClient(id: string): Promise<void> {
  delete clientDB[id];
}

export async function getClientReadiness(id: string): Promise<boolean> {
  // Stub for now until tested directly
  return true;
}
