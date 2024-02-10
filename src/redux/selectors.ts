import { useCallback } from "react";
import { useSelector } from "react-redux";
import { State } from "./rootReducer";
import { ExchangeEvent } from "../models/functions";
import { FetchedResource } from "../utils/fetchers";

export const useActionOnDeck = () =>
  useSelector((state: State) => state.actionOnDeck);

export const useGame = () => useSelector((state: State) => state.game);

export const useGameState = () =>
  useSelector((state: State) => state.gameState);

export const useUser = () => useSelector((state: State) => state.user.data);

export const useExchangeEvents = () =>
  useSelector((state: State) => state.exchangeEvent);

export const useExchangeEvent = (exchangeEventId: string) => {
  return useSelector((state: State) => {
    return state.exchangeEvent.data[exchangeEventId] as
      | FetchedResource<ExchangeEvent>
      | undefined;
  });
};

export const useWishLists = () =>
  useSelector((state: State) => {
    return state.wishLists;
  });

export const useGetUserShortName = () => {
  const shortNameMap = useSelector((state: State) => state.userShortNames);
  return useCallback((uid: string) => shortNameMap[uid], [shortNameMap]);
};
