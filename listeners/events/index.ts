import type { App } from '@slack/bolt';
import { entityDetailsRequestedCallback } from './entity-details-requested.js';

const register = (app: App) => {
  app.event('entity_details_requested', entityDetailsRequestedCallback);
};

export default { register };
