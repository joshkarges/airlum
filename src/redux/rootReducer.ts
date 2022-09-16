import { combineReducers, StateFromReducersMapObject } from 'redux';
import { game } from './slices/game';
import { actionOnDeck } from './slices/actionOnDeck';
import { gameState } from './slices/gameState';

const reducerMap = {
  game,
  actionOnDeck,
  gameState,
};

export type State = StateFromReducersMapObject<typeof reducerMap>;

export const rootReducer = combineReducers(reducerMap);