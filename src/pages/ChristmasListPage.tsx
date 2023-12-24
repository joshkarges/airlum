import { Button, Typography } from "@mui/material";
import moment from "moment";
import { useEffect } from "react";
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

const useStyles = makeStyles({
  title: {
    wordBreak: "break-word",
  },
});

export const ChristmasListPage = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const user = useUser();
  const { exchangeEvent: exchangeEventUrlParam } = useParams<{
    exchangeEvent: string;
  }>();
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

  return (
    <Flex flexDirection="column" p={3}>
      {!!user ? (
        <Flex flexDirection="column">
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
              </Flex>
            )}
          </FetchedComponent>
          <FetchedComponent resource={wishLists}>
            {(data) => (
              <Flex flexDirection="column" p={3}>
                <Flex justifyContent="flex-end">
                  {!_.find(data, (list) => list.author.uid === user.uid) ? (
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
                  {_.map(_.sortBy(_.values(data), "createdAt"), (list) => {
                    return (
                      <div key={list.id}>
                        <WishListCard list={list} user={user} />
                      </div>
                    );
                  })}
                  <Flex alignItems="center">
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
