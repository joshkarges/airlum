import { useSelector } from "react-redux";
import { State } from "./rootReducer"

export const useActionOnDeck = () => useSelector((state: State) => state.actionOnDeck)

export const useGame = () => useSelector((state: State) => state.game);
