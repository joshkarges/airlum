import { ChristmasList, ChristmasListOnServer } from "../models/ChristmasList";
import firebase from 'firebase/compat/app';

const FUNCTIONS_URI = process.env.REACT_APP_FUNCTIONS_URI || '';

const getAuthHeader = async () => {
  const currentUser = firebase.auth().currentUser;
  if (!currentUser) {
    console.warn('Not authenticated. Make sure you\'re signed in!');
    return;
  }
  const token = await currentUser.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
  }
};

export const checkHealth = async () => {
  console.log('Check Health Request');
  const authHeader = await getAuthHeader();
  const response = await fetch(`${FUNCTIONS_URI}/health`, { method: 'GET', headers: authHeader });
  console.log('Check Health Response', response);
  return response;
};

export const setWishListOnServer = async (request: {list: ChristmasList, docId?: string}) => {
  const { list, docId } = request;
  console.log('Set List Request', list);
  const authHeader = await getAuthHeader();
  const response = await fetch(`${FUNCTIONS_URI}/setWishList`, {
    method: 'POST',
    body: JSON.stringify({
      ...list,
      docId,
    }),
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
  return jsonResponse as {success: boolean, error?: string, data: ChristmasListOnServer};
};

export const getExchangeEventFromServer = async (exchangeEvent: string) => {
  console.log('Get Exchange Event Request');
  const authHeader = await getAuthHeader();
  const response = await fetch(`${FUNCTIONS_URI}/getExchangeEvent/${exchangeEvent}`, { method: 'GET', headers: authHeader });
  const jsonResponse = await response.json();
  console.log('Get Exchange Event Response', jsonResponse);
  return jsonResponse as {success: boolean, error?: string, data: any};
};

export const getAllWishListsFromServer = async (exchangeEvent: string) => {
  console.log('Get All Wish Lists Request', exchangeEvent);
  const authHeader = await getAuthHeader();
  const response = await fetch(`${FUNCTIONS_URI}/getAllWishLists/${exchangeEvent}`, { method: 'GET', headers: authHeader });
  const jsonResponse = await response.json();
  console.log('Get All Wish Lists Response', jsonResponse);
  return jsonResponse as {success: boolean, error?: string, data: ChristmasListOnServer[]};
};