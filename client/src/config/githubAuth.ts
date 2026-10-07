/**
 * GitHub OAuth 2.0 Configuration and Helper
 */

export const getGitHubClientId = (): string => {
  return (import.meta.env.VITE_GITHUB_CLIENT_ID || 'Iv23liVgPL4RNzMWQmNN').trim();
};

/**
 * Trigger GitHub OAuth 2.0 popup and return authorization code
 */
export const signInWithGitHub = (): Promise<{ code: string }> => {
  return new Promise((resolve, reject) => {
    const clientId = getGitHubClientId();

    if (!clientId) {
      reject(new Error('GitHub Client ID is missing. Please set VITE_GITHUB_CLIENT_ID in client/.env'));
      return;
    }

    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
      clientId
    )}&scope=${encodeURIComponent('read:user user:email')}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      githubUrl,
      'github_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},status=yes,scrollbars=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // If popup was blocked, fallback to direct window redirect
      window.location.href = githubUrl;
      return;
    }

    // Message listener for popup redirect callback
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === 'GITHUB_OAUTH_CODE') {
        window.removeEventListener('message', handleMessage);
        clearInterval(pollTimer);

        if (event.data.code) {
          resolve({ code: event.data.code });
        } else if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          reject(new Error('GitHub authorization was not completed.'));
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Watch for manual closing of popup window
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer);
        window.removeEventListener('message', handleMessage);
        reject(new Error('popup_closed'));
      }
    }, 500);
  });
};
