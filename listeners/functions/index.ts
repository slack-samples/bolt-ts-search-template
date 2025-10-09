import type { App } from '@slack/bolt';
import { filtersCallback } from './filters.js';
import { searchCallback } from './search.js';

const register = (app: App) => {
  app.function('search', { autoAcknowledge: false }, searchCallback);
  app.function('filters', { autoAcknowledge: false }, filtersCallback);
};

export default { register };
