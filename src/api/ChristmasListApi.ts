import { ChristmasList } from "../models/ChristmasList";
import firebase from 'firebase/compat/app';

const FUNCTIONS_URI = process.env.REACT_APP_FUNCTIONS_URI || '';

const getAuthHeader = async () => {
  const currentUser = firebase.auth().currentUser;
  if (!currentUser) {
    throw new Error('Not authenticated. Make sure you\'re signed in!');
  }
  const token = await currentUser.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
  }
};

export const setWishListOnServer = async (list: ChristmasList) => {
  console.log('Set List Request', list);
  const authHeader = await getAuthHeader();
  const response = await fetch(`${FUNCTIONS_URI}/setWishList`, {
    method: 'POST',
    body: JSON.stringify(list),
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
  });
  const jsonResponse = await response.json();
  console.log('Set List Response', jsonResponse);
  return jsonResponse;
};

export const getWishListFromServer = async () => {
  console.log('Get List Request');
  const authHeader = await getAuthHeader();
  const response = await fetch(`${FUNCTIONS_URI}/getWishList`, { method: 'GET', headers: authHeader });
  const jsonResponse = await response.json();
  console.log('Get List Response', jsonResponse);
  return jsonResponse as {success: boolean, error?: string, data: ChristmasList};
};

export const getExchangeEventFromServer = async (exchangeEvent: string) => {
  console.log('Get Exchange Event Request');
  const authHeader = await getAuthHeader();
  const response = await fetch(`${FUNCTIONS_URI}/getExchangeEvent/${exchangeEvent}`, { method: 'GET', headers: authHeader });
  const jsonResponse = await response.json();
  console.log('Get Exchange Event Response', jsonResponse);
  return jsonResponse as {success: boolean, error?: string, data: any};
};