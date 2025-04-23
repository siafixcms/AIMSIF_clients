/**
 * @capability client:multi-service-readiness
 * Verifies readiness status is correctly computed across multiple services.
 * - Each service defines its own manifest with potentially overlapping or unique fields.
 * - Readiness must be computed independently for each service.
 * - Shared fields must not cause conflict.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  createClient,
  updateClientData,
  getClientReadiness,
} from '../../src/service';
import {
  registerServiceManifest,
  resetServiceManifests,
} from '../../src/__mocks__/serviceManifestStub';
import { clearDatabase } from '../../src/db/test-utils';

describe('Client Service – Multi-Service Manifest Interaction', () => {
  const clientId = 'client-composite';
  const baseData = {
    id: clientId,
    name: 'Compo Corp',
    email: 'admin@compo.io',
  };

  beforeEach(async () => {
    await clearDatabase();
    await resetServiceManifests();
  });

  it('evaluates readiness independently for services with different field needs', async () => {
    await createClient(baseData);

    await registerServiceManifest('billing-service', [
      { field: 'vatNumber', required: true, type: 'string' },
    ]);
    await registerServiceManifest('auth-service', [
      { field: 'emailVerified', required: true, type: 'boolean' },
    ]);

    // Add only one field
    await updateClientData(clientId, { vatNumber: 'LV12345678' });

    const billingStatus = await getClientReadiness(clientId, 'billing-service');
    const authStatus = await getClientReadiness(clientId, 'auth-service');

    expect(billingStatus?.ready).toBe(true);
    expect(authStatus?.ready).toBe(false);
    expect(authStatus?.missingFields).toContain('emailVerified');
  });

  it('does not interfere or overwrite shared fields between services', async () => {
    await createClient(baseData);

    await registerServiceManifest('auth-service', [
      { field: 'email', required: true, type: 'string' },
    ]);
    await registerServiceManifest('marketing-service', [
      { field: 'email', required: true, type: 'string' },
    ]);

    const authStatus = await getClientReadiness(clientId, 'auth-service');
    const marketingStatus = await getClientReadiness(clientId, 'marketing-service');

    expect(authStatus?.ready).toBe(true);
    expect(marketingStatus?.ready).toBe(true);
  });
});
