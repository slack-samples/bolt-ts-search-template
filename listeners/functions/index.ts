import type { App } from '@slack/bolt';
import searchCallback from './search';

const register = (app: App) => {
  app.function('search', { autoAcknowledge: false }, searchCallback);
  app.function('filters', { autoAcknowledge: false }, searchCallback);
};

export default { register };
