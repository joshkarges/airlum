export type Idea = {
  description: string;
  timestamp: number;
  id: string;
};

export type ChristmasList = {
  name: string,
  email: string,
  ideas: Idea[],
  createdAt: number,
  updatedAt: number,
  id: string,
};
