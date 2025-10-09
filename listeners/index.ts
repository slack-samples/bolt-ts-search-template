import type { App } from '@slack/bolt';
import events from './events/index.js';
import functions from './functions/index.js';

const registerListeners = (app: App) => {
  functions.register(app);
  events.register(app);
};

export default registerListeners;
