import { Button, Typography } from "@mui/material";
import moment from "moment";
import { useContext, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { Flex } from "../components/Flex";
import { useUser } from "../redux/selectors";
import {
  ExchangeEvent,
  GetExchangeEventRequest,
  GetExchangeEventResponse,
} from "../models/functions";
import { useParams } from "react-router-dom";
import { getExchangeEventAction } from "../redux/slices/exchangeEvent";
import {
  createWishListAction,
  CREATING_WISHLIST_ID,
  getAllWishListsAction /* setWishLists */,
} from "../redux/slices/wishLists";
import { WishListCard } from "../components/WishListCard";
import { FetchedComponent } from "../components/fetchers/FetchedComponent";
import {
  anyIsIdle,
  FetchedResource,
  Fetcher,
  FetchingActionResponse,
  useDispatcher,
  useReduxState,
} from "../utils/fetchers";
import _ from "lodash";
import { AddButtonWithText } from "../components/AddButtonWithText";
import { makeStyles } from "@mui/styles";
import { Checklist } from "@mui/icons-material";
import { ModalContext, ModalType } from "../components/modals/ModalContext";

const useStyles = makeStyles({
  title: {
    wordBreak: "break-word",
  },
  wishListContainer: {
    width: 400,
  },
});

export const GiftExchangeEventPage = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const user = useUser();
  const { exchangeEvent: exchangeEventUrlParam } = useParams<{
    exchangeEvent: string;
  }>();
  const { setModal } = useContext(ModalContext);
  const [exchangeEvent, fetchExchangeEvent] = useReduxState(
    `exchangeEvent.data.${exchangeEventUrlParam}` as any,
    getExchangeEventAction
  ) as [
    FetchedResource<ExchangeEvent>,
    Fetcher<
      FetchingActionResponse<GetExchangeEventResponse>,
      [GetExchangeEventRequest]
    >
  ];
  const [wishLists, fetchAllWishLists] = useReduxState(
    "wishLists",
    getAllWishListsAction
  );
  const createNewWishList = useDispatcher(createWishListAction);

  // Fetch exchange event.
  useEffect(() => {
    if (!user) return;
    if (!exchangeEventUrlParam) return;
    if (anyIsIdle(exchangeEvent)) {
      fetchExchangeEvent({
        exchangeEvent: exchangeEventUrlParam,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchangeEvent, exchangeEventUrlParam, fetchExchangeEvent, user]);

  // Fetch Wish Lists.
  useEffect(() => {
    if (!user) return;
    if (!exchangeEventUrlParam) return;
    if (anyIsIdle(wishLists))
      fetchAllWishLists({ exchangeEvent: exchangeEventUrlParam });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dispatch,
    exchangeEventUrlParam,
    fetchAllWishLists,
    user,
    wishLists.status,
  ]);

  const { listsInOrder, numExtraLists } = useMemo(() => {
    const {
      extraLists = [],
      userLists = [],
      ownList = [],
    } = _.groupBy(wishLists.data, (list) =>
      list.isExtra
        ? "extraLists"
        : list.author.uid === user?.uid
        ? "ownList"
        : "userLists"
    );
    return {
      listsInOrder: [
        ...ownList,
        ..._.orderBy(userLists, "createdAt", "desc"),
        ..._.orderBy(extraLists, "createdAt", "asc"),
      ],
      numExtraLists: extraLists.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, wishLists.data]);

  const hasOwnList = useMemo(() => {
    return !!_.find(
      wishLists.data,
      (list) =>
        list.author.uid === user?.uid || list.id === CREATING_WISHLIST_ID
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, wishLists.data]);

  return (
    <Flex flexDirection="column" p={3}>
      {!!user ? (
        <Flex flexDirection="column" gap="32px">
          <FetchedComponent resource={exchangeEvent}>
            {(data) => (
              <Flex
                flexDirection="column"
                justifyContent="center"
                overflow="hidden"
              >
                <Typography variant="h2" className={classes.title}>
                  {data.name}
                </Typography>
                <Typography variant="subtitle1">{data.description}</Typography>
                <Typography variant="subtitle1">
                  {moment(data.date).format("dddd, MMMM Do YYYY")}
                </Typography>
                {/** TODO: Add edit button.  Maybe it opens a modal / drawer ? */}
                <Button
                  startIcon={<Checklist />}
                  onClick={() => setModal(ModalType.MyClaims)}
                  variant="outlined"
                >
                  My Claims
                </Button>
              </Flex>
            )}
          </FetchedComponent>
          <FetchedComponent resource={wishLists}>
            {(data) => (
              <Flex flexDirection="column">
                <Flex justifyContent="flex-end">
                  {!hasOwnList ? (
                    <Button
                      variant="contained"
                      onClick={() =>
                        createNewWishList({
                          exchangeEvent: exchangeEventUrlParam,
                          isExtra: false,
                        })
                      }
                    >
                      Start My List
                    </Button>
                  ) : null}
                </Flex>
                <Flex gap="32px" flexWrap="wrap">
                  {listsInOrder.map((list) => {
                    return (
                      <div key={list.id} className={classes.wishListContainer}>
                        <WishListCard
                          list={list}
                          user={user}
                          event={exchangeEvent.data}
                        />
                      </div>
                    );
                  })}
                  <Flex alignItems="center">
                    {exchangeEvent.data.options.extraListsAllowed &&
                      (hasOwnList ||
                        !exchangeEvent.data.options.selfListRequired) &&
                      numExtraLists <=
                        exchangeEvent.data.options.maxExtraLists && (
                        <AddButtonWithText
                          commitText={(text) => {
                            return createNewWishList({
                              title: text,
                              exchangeEvent: exchangeEventUrlParam,
                              isExtra: true,
                            });
                          }}
                          buttonText="Create List For Someone Else"
                          initialText="Extra List"
                          size="large"
                        />
                      )}
                  </Flex>
                </Flex>
              </Flex>
            )}
          </FetchedComponent>
        </Flex>
      ) : null}
    </Flex>
  );
};
