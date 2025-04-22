type ManifestField = {
  field: string;
  required?: boolean;
  type?: string;
  default?: any;
};

const serviceManifests: Record<string, ManifestField[]> = {};

export const registerServiceManifest = async (
  serviceId: string,
  manifest: ManifestField[]
): Promise<void> => {
  const existing = serviceManifests[serviceId] || [];
  const merged = [...existing, ...manifest];

  const deduped = Object.values(
    merged.reduce((acc, field) => {
      acc[field.field] = field;
      return acc;
    }, {} as Record<string, ManifestField>)
  );

  serviceManifests[serviceId] = deduped;
};

export const updateServiceManifest = async (
  serviceId: string,
  manifest: ManifestField[]
): Promise<void> => {
  await registerServiceManifest(serviceId, manifest);
};

export const resetServiceManifests = async (): Promise<void> => {
  Object.keys(serviceManifests).forEach(key => delete serviceManifests[key]);
};

export const getServiceManifest = (serviceId: string): ManifestField[] => {
  return serviceManifests[serviceId] || [];
};
