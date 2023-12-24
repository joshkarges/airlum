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
  isSuccessAction,
  makeFetchingActionCreator,
  makeSingleMultiReducer,
  MultiSingleState,
  UnsureReducer,
} from "../../utils/fetchers";

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
  users: {},
};

export const exchangeEventGetter = makeSingleMultiReducer(
  getExchangeEventAction.type,
  getAllExchangeEventsAction.type,
  emptyExchangeEvent,
  {
    getSingleElementPath: (action) => action.opts.exchangeEvent,
  }
);

export const exchangeEvent: UnsureReducer<MultiSingleState<ExchangeEvent>> = (
  state,
  action
) => {
  const newState = exchangeEventGetter(state, action);
  if (isPendingAction(action, updateExchangeEventAction)) {
    const { id, ...newData } = action.opts;
    return _.mergeWith(
      {},
      newState,
      {
        data: {
          [id]: {
            data: {
              ...newData,
              updatedAt: action.timestamp,
            },
          },
        },
      },
      (objValue, srcValue, key) => {
        if (key === "users") {
          return srcValue;
        }
      }
    );
  }
  if (isPendingAction(action, deleteExchangeEventAction)) {
    const { exchangeEventId } = action.opts;
    const { [exchangeEventId]: _, ...newData } = newState.data;
    return {
      ...newState,
      data: newData,
    };
  }
  if (isSuccessAction(action, createExchangeEventAction)) {
    return {
      ...newState,
      data: {
        ...newState.data,
        [action.data.id]: {
          status: FetchedStatusString.Success,
          data: action.data,
          timestamp: action.timestamp,
        },
      },
    };
  }
  return newState;
};
