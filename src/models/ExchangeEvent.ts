export type ExchangeEvent = {
  createdAt: number;
  updatedAt: number;
  name: string;
  description: string;
  ledger: {
    [uid: string]: {
      [ideaId: string]: {
        completedBy: string;
        completedAt: number;
        ideaTimestamp: number;
      },
    },
  }[],
  users: {
    email: string;
    joinedAt: number;
    uid: string;
  }[]
};