import * as service from '../service';

export const rpcHandlers: Record<string, (...args: any[]) => any> = {
  createClient: service.createClient,
  getClient: service.getClient,
  updateClientData: service.updateClientData,
  deleteClient: service.deleteClient,
  getClientReadiness: service.getClientReadiness,
  registerServiceManifest: service.registerServiceManifest,
};
