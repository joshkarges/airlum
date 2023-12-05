import { getExchangeEventFromServer } from "../../api/ChristmasListApi";
import { ExchangeEvent } from "../../models/functions";
import {
  makeFetchedResourceReducer,
  makeFetchingActionCreator,
} from "../../utils/fetchers";

export const getExchangeEventAction = makeFetchingActionCreator(
  "getExchangeEventAction",
  getExchangeEventFromServer,
  {
    parser: (response) => response.data,
  }
);

export const exchangeEvent = makeFetchedResourceReducer(
  getExchangeEventAction.type,
  null as ExchangeEvent | null
);
