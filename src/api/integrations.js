import { base44 } from './base44Client';

const getLegacyCoreIntegrations = () => {
  // Legacy Base44 integration compatibility: keep using the SDK-backed
  // integration surface until these actions move to app-owned APIs.
  return base44.integrations.Core;
};

const createIntegrationsBoundary = () => {
  const core = getLegacyCoreIntegrations();

  return {
    // Integrations access entrypoint
    Core: core,

    // Future migration seam: uploads, functions, email/SMS, image
    // generation, and file extraction should move behind app-owned
    // server/API layers without breaking current importers first.
    InvokeLLM: core.InvokeLLM,
    SendEmail: core.SendEmail,
    SendSMS: core.SendSMS,
    UploadFile: core.UploadFile,
    GenerateImage: core.GenerateImage,
    ExtractDataFromUploadedFile: core.ExtractDataFromUploadedFile,
  };
};

const integrationsBoundary = createIntegrationsBoundary();

export const Core = integrationsBoundary.Core;
export const InvokeLLM = integrationsBoundary.InvokeLLM;
export const SendEmail = integrationsBoundary.SendEmail;
export const SendSMS = integrationsBoundary.SendSMS;
export const UploadFile = integrationsBoundary.UploadFile;
export const GenerateImage = integrationsBoundary.GenerateImage;
export const ExtractDataFromUploadedFile = integrationsBoundary.ExtractDataFromUploadedFile;
