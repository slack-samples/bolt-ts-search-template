import type { App } from '@slack/bolt';
import searchCallback from './search';

const register = (app: App) => {
  app.function('search', searchCallback);
  app.function('filters', searchCallback);
};

export default { register };
