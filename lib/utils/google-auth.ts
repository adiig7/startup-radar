import { GoogleAuth } from 'google-auth-library';
import { parseGoogleCredentials } from './credentials';

let auth: GoogleAuth | null = null;

export function getGoogleAuth(): GoogleAuth {
  if (!auth) {
    const credentialsEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialsEnv) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set in environment');
    }

    const parsed = parseGoogleCredentials(credentialsEnv);

    auth = parsed.isFilePath
      ? new GoogleAuth({
          keyFilename: parsed.path,
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        })
      : new GoogleAuth({
          credentials: parsed,
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
  }
  return auth;
}
