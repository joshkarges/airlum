import { ChristmasList } from "../models/ChristmasList";
import { v4 as uuid } from 'uuid';

const FUNCTIONS_URI = process.env.REACT_APP_FUNCTIONS_URI || '';

export const createWishList = async (list: Omit<ChristmasList, 'name' | 'email' | 'createdAt' | 'updatedAt' | 'id'>) => {
  const fullList = {
    ...list,
    name: 'Josh Karges',
    email: 'joshkarges@gmail.com',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    id: uuid(),
  };
  console.log('Create List Request', fullList);
  const response = await fetch(`${FUNCTIONS_URI}/createWishList`, {
    method: 'POST',
    body: JSON.stringify(fullList),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const jsonResponse = await response.json();
  console.log('Create List Response', jsonResponse);
  return jsonResponse;
};