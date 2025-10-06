import type { App } from '@slack/bolt';
import events from './events';
import functions from './functions';

const registerListeners = (app: App) => {
  functions.register(app);
  events.register(app);
};

export default registerListeners;
