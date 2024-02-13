import { produce } from "immer";
import _ from "lodash";
import {
  createExchangeEvent,
  deleteExchangeEvent,
  getAllExchangeEvents,
  getExchangeEventFromServer,
  updateExchangeEvent,
} from "../../api/ChristmasListApi";
import { ExchangeEvent } from "../../models/functions";
import {
  FetchedStatusString,
  Fetcher,
  isPendingAction,
  isSettingAction,
  isSuccessAction,
  makeFetchingActionCreator,
  makeIdleFetchedResource,
  makeSingleMultiReducer,
  MultiSingleState,
  UnsureReducer,
} from "../../utils/fetchers";
import { clearAllAction } from "./user";

const makeExchangeEventAction = <Req, Res>(fn: Fetcher<Res, [Req]>) => {
  return makeFetchingActionCreator(
    `exchangeEvent/${_.get(fn, "displayName")}`,
    fn
  );
};

export const getExchangeEventAction = makeExchangeEventAction(
  getExchangeEventFromServer
);

export const getAllExchangeEventsAction =
  makeExchangeEventAction(getAllExchangeEvents);

export const createExchangeEventAction =
  makeExchangeEventAction(createExchangeEvent);
export const updateExchangeEventAction =
  makeExchangeEventAction(updateExchangeEvent);
export const deleteExchangeEventAction =
  makeExchangeEventAction(deleteExchangeEvent);

export const emptyExchangeEvent: ExchangeEvent = {
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
  options: {
    selfListRequired: true,
    extraListsAllowed: true,
    maxExtraLists: 50,
    maxIdeasPerList: 50,
  },
  drawNames: {
    matches: [],
    gifters: [],
    type: "noTwoWay",
  },
};

export const exchangeEventGetter = makeSingleMultiReducer(
  getExchangeEventAction.type,
  getAllExchangeEventsAction.type,
  emptyExchangeEvent,
  {
    getSingleElementPath: (action) => action.opts.exchangeEvent,
  }
);

export const exchangeEvent: UnsureReducer<MultiSingleState<ExchangeEvent>> =
  produce((state, action) => {
    const newState = exchangeEventGetter(state, action);
    if (isPendingAction(action, updateExchangeEventAction)) {
      const { id, ...newData } = action.opts;
      newState.data[id].data = {
        ...newState.data[id].data,
        ...newData,
        updatedAt: action.timestamp,
      };
    }
    if (isPendingAction(action, deleteExchangeEventAction)) {
      const { exchangeEventId } = action.opts;
      delete newState.data[exchangeEventId];
    }
    if (isSuccessAction(action, createExchangeEventAction)) {
      newState.data[action.data.id] = {
        status: FetchedStatusString.Success,
        data: action.data,
        timestamp: action.timestamp,
      };
    }
    if (isSettingAction(action, clearAllAction)) {
      return makeIdleFetchedResource({});
    }
    return newState;
  });
