import assert from 'node:assert/strict';
import test from 'node:test';
import connectDB from '../src/config/database.ts';

type EventHandler = (...args: unknown[]) => unknown;

test('connectDB connects to MongoDB and registers lifecycle handlers', async () => {
  const originalUri = process.env.MONGODB_URI;
  process.env.MONGODB_URI = 'mongodb://example.test/mindful';

  const connectionHandlers = new Map<string, EventHandler>();
  const processHandlers = new Map<string, EventHandler>();
  let closeCalled = false;
  const exitCodes: number[] = [];
  const logMessages: string[] = [];
  const errorMessages: string[] = [];

  const dbClient = {
    connect: async (uri: string) => {
      assert.equal(uri, process.env.MONGODB_URI);
      return { connection: { host: 'example.test' } };
    },
    connection: {
      on: (event: string, handler: EventHandler) => {
        connectionHandlers.set(event, handler);
        return undefined;
      },
      close: async () => {
        closeCalled = true;
      },
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

    assert.deepEqual([...connectionHandlers.keys()].sort(), ['disconnected', 'error']);
    assert.equal(typeof processHandlers.get('SIGINT'), 'function');
    assert.equal(logMessages[0], ' MongoDB Connected: example.test');
    assert.equal(errorMessages.length, 0);

    await processHandlers.get('SIGINT')?.();
    assert.equal(closeCalled, true);
    assert.deepEqual(exitCodes, [0]);

    const errorHandler = connectionHandlers.get('error');
    errorHandler?.('socket hang up');
    assert.equal(errorMessages[0], 'MongoDB error: socket hang up');

    const disconnectedHandler = connectionHandlers.get('disconnected');
    disconnectedHandler?.();
    assert.equal(logMessages[1], 'MongoDB disconnected');
  } finally {
    console.log = originalLog;
    console.error = originalError;
    if (originalUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalUri;
    }
  }
});

test('connectDB exits with status 1 when the connection fails', async () => {
  const originalUri = process.env.MONGODB_URI;
  process.env.MONGODB_URI = 'mongodb://example.test/mindful';

  const errorMessages: string[] = [];
  const exitCodes: number[] = [];

  const dbClient = {
    connect: async () => {
      throw new Error('authentication failed');
    },
    connection: {
      on: () => undefined,
      close: async () => undefined,
    },
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
    assert.equal(errorMessages[0], 'MongoDB connection failed: authentication failed');
  } finally {
    console.error = originalError;
    if (originalUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalUri;
    }
  }
});
