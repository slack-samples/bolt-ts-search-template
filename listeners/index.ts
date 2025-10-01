import type { App } from '@slack/bolt';
import functions from './functions';

const registerListeners = (app: App) => {
  functions.register(app);
};

export default registerListeners;
