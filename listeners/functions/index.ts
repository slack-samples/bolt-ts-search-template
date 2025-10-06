import type { App } from '@slack/bolt';
import filtersCallback from './filters';
import searchCallback from './search';

const register = (app: App) => {
  app.function('search', { autoAcknowledge: false }, searchCallback);
  app.function('filters', { autoAcknowledge: false }, filtersCallback);
};

export default { register };
