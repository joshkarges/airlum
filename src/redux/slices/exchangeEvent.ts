import { getExchangeEventFromServer } from "../../api/ChristmasListApi";
import { ExchangeEvent } from "../../models/functions";
import {
  makeFetchedResourceReducer,
  makeFetchingActionCreator,
} from "../../utils/fetchers";

export const getExchangeEventAction = makeFetchingActionCreator(
  "getExchangeEventAction",
  getExchangeEventFromServer
);

const emptyExchangeEvent: ExchangeEvent = {
  id: "",
  createdAt: 0,
  updatedAt: 0,
  name: "",
  description: "",
  author: {
    email: "",
    uid: "",
    displayName: "",
  },
  date: 0,
  users: [],
};

export const exchangeEvent = makeFetchedResourceReducer(
  getExchangeEventAction.type,
  emptyExchangeEvent
);
