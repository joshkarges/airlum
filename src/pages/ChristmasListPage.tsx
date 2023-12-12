import { Button, Typography } from "@mui/material";
import moment from "moment";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import firebase from "firebase/compat/app";
import { Flex } from "../components/Flex";
import { SignIn } from "../components/SignIn";
import { setUser } from "../redux/slices/user";
import { useUser } from "../redux/selectors";
import { User } from "../models/User";
import { useParams } from "react-router-dom";
import { getExchangeEventAction } from "../redux/slices/exchangeEvent";
import {
  createWishListAction,
  getAllWishListsAction /* setWishLists */,
} from "../redux/slices/wishLists";
import { EditMyList } from "../components/modals/EditMyList";
import { WishListCard } from "../components/WishListCard";
import { FetchedComponent } from "../components/fetchers/FetchedComponent";
import { anyIsIdle, useDispatcher, useReduxState } from "../utils/fetchers";
import _ from "lodash";
import { AddButtonWithText } from "../components/AddButtonWithText";

export const ChristmasListPage = () => {
  const dispatch = useDispatch();
  const user = useUser();
  const { exchangeEvent: exchangeEventUrlParam } = useParams<{
    exchangeEvent: string;
  }>();
  const [exchangeEvent, fetchExchangeEvent] = useReduxState(
    "exchangeEvent",
    getExchangeEventAction
  );
  const [wishLists, fetchAllWishLists] = useReduxState(
    "wishLists",
    getAllWishListsAction
  );
  const createNewWishList = useDispatcher(createWishListAction);

  useEffect(() => {
    const unregister = firebase.auth().onAuthStateChanged((authUser) => {
      if (!!authUser) {
        dispatch(setUser(authUser.toJSON() as User));
      }
    });
    return () => {
      unregister();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!user) return;
    if (!exchangeEventUrlParam) return;
    if (anyIsIdle(exchangeEvent)) {
      fetchExchangeEvent({
        exchangeEvent: exchangeEventUrlParam,
      });
    }
  }, [exchangeEvent, exchangeEventUrlParam, fetchExchangeEvent, user]);

  useEffect(() => {
    if (!user) return;
    if (!exchangeEventUrlParam) return;
    if (anyIsIdle(wishLists))
      fetchAllWishLists({ exchangeEvent: exchangeEventUrlParam });
  }, [dispatch, exchangeEventUrlParam, fetchAllWishLists, user, wishLists]);

  return (
    <Flex flexDirection="column" p={3}>
      {!!user ? (
        <Flex flexDirection="column">
          <FetchedComponent resource={exchangeEvent}>
            {(data) => (
              <Flex
                flexDirection="column"
                p={3}
                justifyContent="center"
                gap="16px"
              >
                <Typography variant="h2">{data.name}</Typography>
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
      ) : (
        <Flex>
          <SignIn signInSuccessUrl={window.location.href} />
        </Flex>
      )}
      <EditMyList />
    </Flex>
  );
};
