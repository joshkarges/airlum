import { combineReducers, StateFromReducersMapObject } from "redux";
import { game } from "./slices/game";
import { gameRecord } from "./slices/gameRecord";
import { actionOnDeck } from "./slices/actionOnDeck";
import { gameState } from "./slices/gameState";
import { showGameSetup } from "./slices/showGameSetup";

const reducerMap = {
  game,
  gameRecord,
  actionOnDeck,
  gameState,
  showGameSetup,
};

export type State = StateFromReducersMapObject<typeof reducerMap>;

export const rootReducer = combineReducers(reducerMap);

declare module "react-redux" {
  interface ReduxDefaultRootState extends State {}
}
