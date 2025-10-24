// Parses Google Cloud service account credentials from environment variable
export const parseGoogleCredentials = (credentialsEnv: string): any => {
  if (credentialsEnv.includes('/') || credentialsEnv.includes('\\')) {
    return { isFilePath: true, path: credentialsEnv };
  }

  let credentials;
  try {
    credentials = JSON.parse(credentialsEnv);
  } catch (directParseError) {
    if (!/^[A-Za-z0-9+/=\s]*$/.test(credentialsEnv)) {
      throw new Error('Credentials contain invalid characters - not valid base64 or JSON');
    }

    const decoded = Buffer.from(credentialsEnv.trim(), 'base64').toString('utf-8');
    credentials = JSON.parse(decoded);
  }

  if (!credentials.client_email) {
    throw new Error('Credentials missing client_email field');
  }
  if (!credentials.private_key) {
    throw new Error('Credentials missing private_key field');
  }

  if (credentials.private_key && typeof credentials.private_key === 'string') {
    if (!credentials.private_key.includes('\n') && credentials.private_key.includes('\\n')) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
  }

  return credentials;
}
