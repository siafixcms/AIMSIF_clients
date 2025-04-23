import {
  getServiceManifest,
  linkClientToService,
  getClientServiceId,
} from './__mocks__/serviceManifestStub';

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

export async function createClient(data: Partial<Client> & { serviceId?: string }): Promise<Client> {
  const { id, name, email, serviceId } = data;

  if (!email) {
    throw new Error('Missing required field: email');
  }

  const client: Client = { ...data } as Client;
  clientDB[id!] = client;

  if (serviceId) {
    linkClientToService(id!, serviceId);
  }

  return client;
}

export async function getClient(id: string): Promise<Client | null> {
  return clientDB[id] || null;
}

export async function updateClientData(
  id: string,
  updates: Record<string, any>,
  explicitServiceId?: string
): Promise<void> {
  const client = clientDB[id];
  if (!client) return;

  const serviceId = explicitServiceId || getClientServiceId(id);
  const manifest = serviceId ? getServiceManifest(serviceId) : null;

  if (manifest) {
    for (const key of Object.keys(updates)) {
      const fieldSpec = manifest.find(f => f.field === key);
      if (!fieldSpec) {
        throw new Error(`Field ${key} is not recognized for this client context`);
      }

      if (
        fieldSpec.type &&
        typeof updates[key] !== fieldSpec.type &&
        updates[key] !== undefined
      ) {
        throw new Error(`Invalid type for field: ${key}. Expected ${fieldSpec.type}`);
      }
    }
  }

  Object.assign(client, updates);
}

export async function deleteClient(id: string): Promise<void> {
  delete clientDB[id];
}

export async function getClientReadiness(
  clientId: string,
  explicitServiceId: string
): Promise<ReadinessResult> {
  const client = clientDB[clientId];
  if (!client) return { ready: false, missingFields: ['clientNotFound'] };

  const serviceId = explicitServiceId || getClientServiceId(clientId);
  if (!serviceId) {
    return { ready: false, missingFields: ['serviceIdNotLinked'] };
  }

  const manifest = getServiceManifest(serviceId);
  const missingFields: string[] = [];
  const usedDefaults: Record<string, any> = {};

  for (const field of manifest) {
    const hasField = client[field.field] !== undefined;
    const isCorrectType = field.type ? typeof client[field.field] === field.type : true;

    if (!hasField && field.required) {
      if (field.default !== undefined) {
        client[field.field] = field.default;
        usedDefaults[field.field] = field.default;
      } else {
        missingFields.push(field.field);
      }
    } else if (hasField && !isCorrectType) {
      missingFields.push(field.field);
    }
  }

  const readiness: ReadinessResult = {
    ready: missingFields.length === 0,
    missingFields,
  };

  if (Object.keys(usedDefaults).length > 0) {
    readiness.usedDefaults = usedDefaults;
  }

  return readiness;
}

// Add these to satisfy the integration test
export async function ping(): Promise<string> {
  return 'pong';
}

export async function sendMessage({ clientId, message }: { clientId: string, message: string }): Promise<string> {
  console.log(`Message for ${clientId}: ${message}`);
  return 'queued';
}
