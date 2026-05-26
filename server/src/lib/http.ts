import type { Response } from 'express';

const getErrorMessage = (error: unknown) => (
  error instanceof Error ? error.message : 'An unexpected error occurred.'
);

export const sendInternalServerError = (
  res: Response,
  error: unknown,
  context: string,
) => {
  const message = getErrorMessage(error);
  console.error(`${context}: ${message}`);

  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : message,
  });
};
