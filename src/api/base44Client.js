import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, serverUrl, token, functionsVersion } = appParams;

const getPlatformClientConfig = () => ({
  appId,
  serverUrl,
  token,
  functionsVersion,
  requiresAuth: false
});

// This wrapper is the migration seam for replacing Base44-backed
// auth/entities/functions/integrations later without changing callers.
const createPlatformClient = () => {
  // For now, keep the exact Base44 client behavior and surface.
  return createClient(getPlatformClientConfig());
};

// Keep the public API shape stable for all existing imports.
export const base44 = createPlatformClient();
