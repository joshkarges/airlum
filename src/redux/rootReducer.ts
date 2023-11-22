import { combineReducers, StateFromReducersMapObject } from 'redux';
import { game } from './slices/game';
import { actionOnDeck } from './slices/actionOnDeck';
import { gameState } from './slices/gameState';
import { user } from './slices/user';
import { exchangeEvent } from './slices/exchangeEvent';

const reducerMap = {
  game,
  actionOnDeck,
  gameState,
  user,
  exchangeEvent,
};

export type State = StateFromReducersMapObject<typeof reducerMap>;

export const rootReducer = combineReducers(reducerMap);