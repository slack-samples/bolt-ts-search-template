import type { Logger } from '@slack/bolt';
import type { WebClient } from '@slack/web-api';
import type { SearchResult, SlackSampleDataResponse } from '../listeners/types';

export const fakeLogger: Logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  setLevel: jest.fn(),
  getLevel: jest.fn(),
  setName: jest.fn(),
};

export const fakeClient: WebClient = {} as WebClient;

export const fakeAck = jest.fn();
export const fakeFail = jest.fn();
export const fakeComplete = jest.fn();

export const fakeSampleData: SearchResult[] = [
  {
    title: 'JavaScript Getting Started',
    description: 'A template for building Slack apps with Bolt for JavaScript.',
    link: 'https://github.com/slack-samples/bolt-js-getting-started',
    date_updated: '2025-01-01',
    external_ref: { id: 'bolt-js-getting-started' },
    content: 'This quickstart guide helps you get a Slack app using Bolt for JavaScript up and running.',
  },
  {
    title: 'Python AI Assistant',
    description: 'A template for building AI-enabled apps with Bolt for Python.',
    link: 'https://github.com/slack-samples/bolt-python-assistant',
    date_updated: '2025-01-02',
    external_ref: { id: 'bolt-python-assistant' },
    content: 'Create an AI assistant using Python and machine learning capabilities.',
  },
  {
    title: 'TypeScript Starter',
    description: 'A starter template for TypeScript Slack apps.',
    link: 'https://github.com/slack-samples/bolt-ts-starter',
    date_updated: '2025-01-03',
    external_ref: { id: 'bolt-ts-starter' },
  },
];

export const fakeSlackResponse: SlackSampleDataResponse = {
  ok: true,
  samples: fakeSampleData,
};
