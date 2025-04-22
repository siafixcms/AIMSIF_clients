type Client = {
  id: string;
  name: string;
  email: string;
  [key: string]: any;
};

type ReadinessResult = {
  ready: boolean;
  missingFields?: string[];
  usedDefaults?: Record<string, any>;
};

const clientDB: Record<string, Client> = {};

export async function createClient(data: Partial<Client>): Promise<Client> {
  const { id, name, email } = data;

  if (!email) {
    throw new Error('Missing required field: email');
  }

  const client: Client = {
    ...data,
  } as Client;

  clientDB[id!] = client;
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

const serviceFieldRequirements: Record<string, string[]> = {
  'auth-service': ['emailVerified'],
  'billing-service': [],
  'marketing-service': [],
  default: [],
};

export async function getClientReadiness(clientId: string, serviceId: string): Promise<ReadinessResult> {
  const client = clientDB[clientId];
  if (!client) return { ready: false, missingFields: ['clientNotFound'] };

  const requiredFields = serviceFieldRequirements[serviceId] || serviceFieldRequirements.default;
  const missingFields: string[] = requiredFields.filter(field => !client[field]);

  const usedDefaults: Record<string, any> = {};
  if (!client.region) {
    usedDefaults.region = 'EU';
  }

  const allMissing = [...missingFields];
  if (!client.timezone && serviceId === 'auth-service') {
    allMissing.push('timezone');
  }

  const readiness: ReadinessResult = {
    ready: allMissing.length === 0,
    missingFields: allMissing,
  };

  if (Object.keys(usedDefaults).length > 0) {
    readiness.usedDefaults = usedDefaults;
  }

  return readiness;
}
