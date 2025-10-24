import { APP_DOMAIN, APP_NAME, PREFIX } from '@clientfuse/models';

export const environment = {
  production: true,
  API_URL: `${PREFIX}`,
  CLIENT_APP_URL: `https://app.${APP_DOMAIN}`,
  APP_NAME: APP_NAME,
};
