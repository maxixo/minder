import assert from 'node:assert/strict';
import test from 'node:test';
import prisma from '../src/lib/prisma.ts';
import {
  deleteSavedInspirationQuote,
  getSavedInspirationQuotes,
  saveInspirationQuote,
} from '../src/controllers/inspirationController.ts';

const createResponse = () => {
  const state: { statusCode: number; payload?: any } = { statusCode: 200 };
  const response = {
    status: (statusCode: number) => {
      state.statusCode = statusCode;
      return response;
    },
    json: (payload: unknown) => {
      state.payload = payload;
      return response;
    },
  } as any;

  return { response, state };
};

test('getSavedInspirationQuotes lists only the authenticated user quotes', async () => {
  const originalDelegate = prisma.savedInspirationQuote;
  const { response, state } = createResponse();

  prisma.savedInspirationQuote = {
    ...originalDelegate,
    findMany: async (args: unknown) => {
      assert.deepEqual(args, {
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
      return [{
        id: 'quote-1',
        quoteKey: 'quote-abc',
        text: 'Stay close to what steadies you.',
        author: 'MindfulLife',
        source: 'collection',
        attribution: null,
        createdAt: new Date('2026-06-11T08:00:00.000Z'),
        updatedAt: new Date('2026-06-11T08:00:00.000Z'),
      }];
    },
  } as typeof prisma.savedInspirationQuote;

  try {
    await getSavedInspirationQuotes({ user: { id: 'user-1' } } as any, response);

    assert.equal(state.statusCode, 200);
    assert.equal(state.payload.data[0].quoteKey, 'quote-abc');
  } finally {
    prisma.savedInspirationQuote = originalDelegate;
  }
});

test('saveInspirationQuote upserts a favorite under the authenticated user', async () => {
  const originalDelegate = prisma.savedInspirationQuote;
  const { response, state } = createResponse();

  prisma.savedInspirationQuote = {
    ...originalDelegate,
    upsert: async (args: any) => {
      assert.equal(args.where.userId_quoteKey.userId, 'user-1');
      assert.equal(args.create.userId, 'user-1');
      assert.equal(args.create.text, 'Stay present.');
      return {
        id: 'quote-1',
        ...args.create,
        createdAt: new Date('2026-06-11T08:00:00.000Z'),
        updatedAt: new Date('2026-06-11T08:00:00.000Z'),
      };
    },
  } as typeof prisma.savedInspirationQuote;

  try {
    await saveInspirationQuote({
      user: { id: 'user-1' },
      body: {
        quoteKey: 'quote-abc',
        text: 'Stay present.',
        author: 'MindfulLife',
        source: 'collection',
        attribution: null,
      },
    } as any, response);

    assert.equal(state.statusCode, 201);
    assert.equal(state.payload.data.text, 'Stay present.');
  } finally {
    prisma.savedInspirationQuote = originalDelegate;
  }
});

test('deleteSavedInspirationQuote scopes removal to the authenticated user', async () => {
  const originalDelegate = prisma.savedInspirationQuote;
  const { response, state } = createResponse();

  prisma.savedInspirationQuote = {
    ...originalDelegate,
    deleteMany: async (args: unknown) => {
      assert.deepEqual(args, {
        where: {
          id: 'quote-1',
          userId: 'user-1',
        },
      });
      return { count: 1 };
    },
  } as typeof prisma.savedInspirationQuote;

  try {
    await deleteSavedInspirationQuote({
      user: { id: 'user-1' },
      params: { id: 'quote-1' },
    } as any, response);

    assert.equal(state.statusCode, 200);
    assert.equal(state.payload.data, null);
  } finally {
    prisma.savedInspirationQuote = originalDelegate;
  }
});
