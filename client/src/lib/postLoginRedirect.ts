const POST_LOGIN_REDIRECT_KEY = 'mindfullife-post-login-redirect';

const canUseSessionStorage = () => typeof window !== 'undefined';

export const readPostLoginRedirectPath = () => {
  if (!canUseSessionStorage()) return null;
  return window.sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
};

export const setPostLoginRedirectPath = (path: string) => {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, path);
};

export const clearPostLoginRedirectPath = () => {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
};
