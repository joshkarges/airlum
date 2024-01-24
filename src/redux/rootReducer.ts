import { combineReducers, StateFromReducersMapObject } from "redux";
import { game } from "./slices/game";
import { actionOnDeck } from "./slices/actionOnDeck";
import { gameState } from "./slices/gameState";
import { user } from "./slices/user";
import { exchangeEvent } from "./slices/exchangeEvent";
import { wishLists } from "./slices/wishLists";
import { userShortNames } from "./slices/userShortNames";

const reducerMap = {
  game,
  actionOnDeck,
  gameState,
  user,
  exchangeEvent,
  wishLists,
  userShortNames,
};

export type State = StateFromReducersMapObject<typeof reducerMap>;

export const rootReducer = combineReducers(reducerMap);

declare module "react-redux" {
  interface ReduxDefaultRootState extends State {}
}
