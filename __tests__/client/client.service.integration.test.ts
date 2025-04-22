import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  createClient,
  getClient,
  updateClientData,
  deleteClient,
  getClientReadiness,
} from '../../src/client.service';
import {
  registerServiceManifest,
  updateServiceManifest,
  resetServiceManifests,
} from '../../src/__mocks__/serviceManifestStub';
import { clearDatabase } from '../../src/db/test-utils';

describe('Client Service Integration – CRUD + Dynamic Schema', () => {
  const clientId = 'client-xyz';
  const defaultClient = {
    id: clientId,
    name: 'Beta Tester',
    email: 'test@beta.io',
  };
  const serviceId = 'auth-service';

  beforeEach(async () => {
    await clearDatabase();
    await resetServiceManifests();
  });

  describe('Client CRUD', () => {
    /**
     * @capability createClient
     * @description Creates a client with required base fields.
     */
    it('creates a client with required base fields', async () => {
      const client = await createClient(defaultClient);
      expect(client).toHaveProperty('id', clientId);
      expect(client).toHaveProperty('email', defaultClient.email);
    });

    /**
     * @capability createClient
     * @description Fails to create a client if required fields are missing.
     */
    it('fails to create a client if required fields are missing', async () => {
      await expect(
        createClient({ id: 'bad-client', name: 'No Email' })
      ).rejects.toThrow('Missing required field: email');
    });

    /**
     * @capability getClient
     * @description Retrieves an existing client.
     */
    it('retrieves an existing client', async () => {
      await createClient(defaultClient);
      const client = await getClient(clientId);
      expect(client).not.toBeNull();
      expect(client?.name).toBe(defaultClient.name);
    });

    /**
     * @capability updateClientData
     * @description Updates client dynamic fields.
     */
    it('updates client dynamic fields', async () => {
      await createClient(defaultClient);
      await updateClientData(clientId, { customKey: 'ABC123' });
      const updated = await getClient(clientId);
      expect(updated?.customKey).toBe('ABC123');
    });

    /**
     * @capability deleteClient
     * @description Deletes a client.
     */
    it('deletes a client', async () => {
      await createClient(defaultClient);
      await deleteClient(clientId);
      const client = await getClient(clientId);
      expect(client).toBeNull();
    });
  });

  describe('Service Manifest + Readiness Logic', () => {
    /**
     * @capability getClientReadiness
     * @description Flags readiness as false if required fields are missing.
     */
    it('flags readiness as false if required fields are missing', async () => {
      await createClient(defaultClient);
      await registerServiceManifest(serviceId, [
        { field: 'emailVerified', required: true, type: 'boolean' },
      ]);

      const readiness = await getClientReadiness(clientId, serviceId);
      expect(readiness?.ready).toBe(false);
      expect(readiness?.missingFields).toContain('emailVerified');
    });

    /**
     * @capability updateClientData
     * @description Validates data types against manifest.
     */
    it('validates data types against manifest', async () => {
      await createClient(defaultClient);
      await registerServiceManifest(serviceId, [
        { field: 'age', required: true, type: 'number' },
      ]);

      await expect(
        updateClientData(clientId, { age: 'not-a-number' })
      ).rejects.toThrow('Invalid type for field: age. Expected number');
    });

    /**
     * @capability getClientReadiness
     * @description Honors default values if provided in manifest.
     */
    it('honors default values if provided in manifest', async () => {
      await createClient(defaultClient);
      await registerServiceManifest(serviceId, [
        { field: 'region', required: true, type: 'string', default: 'EU' },
      ]);

      const readiness = await getClientReadiness(clientId, serviceId);
      expect(readiness?.ready).toBe(true);
      expect(readiness?.usedDefaults).toEqual({ region: 'EU' });
    });

    /**
     * @capability getClientReadiness
     * @description Resets readiness when manifest changes to include more required fields.
     */
    it('resets readiness when manifest changes to include more required fields', async () => {
      await createClient(defaultClient);
      await registerServiceManifest(serviceId, [
        { field: 'emailVerified', required: true, type: 'boolean' },
      ]);
      await updateClientData(clientId, { emailVerified: true });

      let readiness = await getClientReadiness(clientId, serviceId);
      expect(readiness?.ready).toBe(true);

      await updateServiceManifest(serviceId, [
        { field: 'emailVerified', required: true, type: 'boolean' },
        { field: 'timezone', required: true, type: 'string' },
      ]);

      readiness = await getClientReadiness(clientId, serviceId);
      expect(readiness?.ready).toBe(false);
      expect(readiness?.missingFields).toContain('timezone');
    });

    /**
     * @capability registerServiceManifest
     * @description Avoids duplicate manifest entries on re-registration.
     */
    it('avoids duplicate manifest entries on re-registration', async () => {
      await registerServiceManifest(serviceId, [
        { field: 'emailVerified', required: true, type: 'boolean' },
      ]);
      await registerServiceManifest(serviceId, [
        { field: 'emailVerified', required: true, type: 'boolean' },
      ]);
      const readiness = await getClientReadiness(clientId, serviceId);
      expect(readiness?.missingFields).toContain('emailVerified');
      const missingFields = readiness?.missingFields || [];
      expect(new Set(missingFields).size).toBe(missingFields.length);
    });

    /**
     * @capability updateClientData
     * @description Throws if updating with extra undeclared fields.
     */
    it('throws if updating with extra undeclared fields', async () => {
      await createClient(defaultClient);
      await registerServiceManifest(serviceId, [
        { field: 'apiKey', required: true, type: 'string' },
      ]);

      await expect(
        updateClientData(clientId, { unauthorizedField: 'oops' })
      ).rejects.toThrow('Field unauthorizedField is not recognized for this client context');
    });
  });
});
