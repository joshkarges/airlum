import { combineReducers, StateFromReducersMapObject } from 'redux';
import { game } from './slices/game';
import { actionOnDeck } from './slices/actionOnDeck';

const reducerMap = {
  game,
  actionOnDeck,
};

export type State = StateFromReducersMapObject<typeof reducerMap>;

export const rootReducer = combineReducers(reducerMap);