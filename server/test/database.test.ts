import assert from 'node:assert/strict';
import test from 'node:test';
import connectDB from '../src/config/database.ts';

type EventHandler = (...args: unknown[]) => unknown;

test('connectDB connects to PostgreSQL and registers a shutdown handler', async () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:5432/mindfullife';
  const processHandlers = new Map<string, EventHandler>();
  let disconnectCalled = false;
  const exitCodes: number[] = [];
  const logMessages: string[] = [];
  const errorMessages: string[] = [];

  const dbClient = {
    $connect: async () => undefined,
    $disconnect: async () => {
      disconnectCalled = true;
    },
  };

  const processRef = {
    on: (event: string, handler: EventHandler) => {
      processHandlers.set(event, handler);
      return processRef;
    },
    exit: (code?: number) => {
      exitCodes.push(code ?? 0);
    },
  };

  const originalLog = console.log;
  const originalError = console.error;
  console.log = (message?: unknown) => {
    logMessages.push(String(message));
  };
  console.error = (message?: unknown) => {
    errorMessages.push(String(message));
  };

  try {
    await connectDB(dbClient, processRef);

    assert.equal(typeof processHandlers.get('SIGINT'), 'function');
    assert.equal(logMessages[0], 'PostgreSQL connected');
    assert.equal(errorMessages.length, 0);

    await processHandlers.get('SIGINT')?.();
    assert.equal(disconnectCalled, true);
    assert.deepEqual(exitCodes, [0]);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  }
});

test('connectDB exits with status 1 when the connection fails', async () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:5432/mindfullife';
  const errorMessages: string[] = [];
  const exitCodes: number[] = [];

  const dbClient = {
    $connect: async () => {
      throw new Error('authentication failed');
    },
    $disconnect: async () => undefined,
  };

  const processRef = {
    on: () => processRef,
    exit: (code?: number) => {
      exitCodes.push(code ?? 0);
    },
  };

  const originalError = console.error;
  console.error = (message?: unknown) => {
    errorMessages.push(String(message));
  };

  try {
    await connectDB(dbClient, processRef);

    assert.deepEqual(exitCodes, [1]);
    assert.equal(errorMessages[0], 'PostgreSQL connection failed: authentication failed');
  } finally {
    console.error = originalError;
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  }
});

test('connectDB exits with status 1 when DATABASE_URL is missing', async () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  const errorMessages: string[] = [];
  const exitCodes: number[] = [];

  const dbClient = {
    $connect: async () => undefined,
    $disconnect: async () => undefined,
  };

  const processRef = {
    on: () => processRef,
    exit: (code?: number) => {
      exitCodes.push(code ?? 0);
    },
  };

  const originalError = console.error;
  console.error = (message?: unknown) => {
    errorMessages.push(String(message));
  };

  try {
    await connectDB(dbClient, processRef);

    assert.deepEqual(exitCodes, [1]);
    assert.equal(errorMessages[0], 'PostgreSQL connection failed: DATABASE_URL is required.');
  } finally {
    console.error = originalError;
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  }
});
