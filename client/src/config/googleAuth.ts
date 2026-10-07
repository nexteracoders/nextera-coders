/**
 * Google Cloud Console OAuth 2.0 Client Configuration
 * Uses official Google Identity Services (GIS) SDK
 */

export interface GoogleUserProfile {
  email: string;
  name: string;
  avatar?: string;
  credential?: string;
}

// Declare global types for Google Identity Services SDK
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          cancel: () => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
            error_callback?: (error: any) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

/**
 * Get configured Google OAuth Web Client ID from environment variables
 */
export const getGoogleClientId = (): string => {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
};

/**
 * Ensure Google Identity Services SDK script is loaded and ready
 */
export const ensureGsiLoaded = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve();
        } else if (checks > 40) {
          clearInterval(interval);
          reject(new Error('Google Identity Services SDK took too long to initialize.'));
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve();
        } else if (checks > 20) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    };
    script.onerror = () => reject(new Error('Could not load Google Identity Services SDK. Check your internet connection.'));
    document.head.appendChild(script);
  });
};

/**
 * Trigger Google Sign-In popup via Google Cloud Console OAuth
 * Returns user profile info (email, name, photo)
 */
export const signInWithGoogle = async (): Promise<GoogleUserProfile> => {
  const clientId = getGoogleClientId();

  if (!clientId) {
    throw new Error(
      'Google Client ID is missing. Please make sure VITE_GOOGLE_CLIENT_ID is configured in client/.env'
    );
  }

  // Ensure GSI script is loaded
  await ensureGsiLoaded();

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services SDK is not available. Please refresh the page and try again.');
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          if (!tokenResponse.access_token) {
            reject(new Error('No access token received from Google.'));
            return;
          }

          try {
            // Fetch verified user profile info directly from Google OAuth API
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
              },
            });

            if (!response.ok) {
              throw new Error(`Failed to retrieve profile from Google: ${response.statusText}`);
            }

            const profile = await response.json();

            if (!profile.email) {
              throw new Error('Google account has no associated email address.');
            }

            resolve({
              email: profile.email,
              name: profile.name || profile.given_name || 'Google Developer',
              avatar: profile.picture,
            });
          } catch (fetchErr: any) {
            reject(new Error(fetchErr.message || 'Error fetching Google user profile'));
          }
        },
        error_callback: (error: any) => {
          reject(new Error(error?.message || 'Google authentication popup failed'));
        },
      });

      // Prompt user with Google account selection popup
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      reject(new Error(err.message || 'Failed to initialize Google Sign-In'));
    }
  });
};
