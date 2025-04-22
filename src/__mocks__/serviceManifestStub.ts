const serviceManifests: Record<string, Record<string, any>> = {};

export const registerServiceManifest = async (
  serviceId: string,
  manifest: Record<string, any>
): Promise<void> => {
  serviceManifests[serviceId] = manifest;
};

export const updateServiceManifest = async (
  serviceId: string,
  manifest: Record<string, any>
): Promise<void> => {
  serviceManifests[serviceId] = {
    ...(serviceManifests[serviceId] || {}),
    ...manifest,
  };
};

export const resetServiceManifests = async (): Promise<void> => {
  Object.keys(serviceManifests).forEach(key => delete serviceManifests[key]);
};
