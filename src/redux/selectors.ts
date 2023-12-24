import { useSelector } from "react-redux";
import { State } from "./rootReducer";

export const useActionOnDeck = () =>
  useSelector((state: State) => state.actionOnDeck);

export const useGame = () => useSelector((state: State) => state.game);

export const useGameState = () =>
  useSelector((state: State) => state.gameState);

export const useUser = () => useSelector((state: State) => state.user.data);

export const useExchangeEvent = () =>
  useSelector((state: State) => state.exchangeEvent);

export const useWishLists = () =>
  useSelector((state: State) => {
    return state.wishLists;
  });
