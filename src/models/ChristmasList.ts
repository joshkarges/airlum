export type Idea = {
  description: string;
  timestamp: number;
  id: string;
};


export type ChristmasList = {
  ideas: Idea[],
  exchangeEvent: string,
};

export type ChristmasListOnServer = ChristmasList & {
  createdAt: number,
  user: {
    email: string,
    uid: string,
    displayName: string,
  },
  updatedAt: number,
  id: string,
};

export type EditMyListFormType = {
  ideas: Idea[],
};

export const wishListToForm = (wishList: ChristmasListOnServer): EditMyListFormType => {
  return {
    ideas: wishList.ideas,
  };
}