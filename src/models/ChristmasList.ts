export type Idea = {
  description: string;
  timestamp: number;
  id: string;
};

export type ChristmasList = {
  ideas: Idea[],
  exchangeEvent: string,
};
