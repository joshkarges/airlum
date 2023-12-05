import { Button, Card, IconButton } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import firebase from "firebase/compat/app";
import { Flex } from "../components/Flex";
import { ModalContext, ModalType } from "../components/modals/ModalContext";
import { SignIn } from "../components/SignIn";
import { setUser } from "../redux/slices/user";
import { useExchangeEvent, useUser, useWishLists } from "../redux/selectors";
import { User } from "../models/User";
import { useParams } from "react-router-dom";
import {
  checkHealth,
  getAllWishListsFromServer,
  getExchangeEventFromServer,
} from "../api/ChristmasListApi";
import {
  exchangeEvent,
  getExchangeEventAction,
} from "../redux/slices/exchangeEvent";
import {
  getAllWishListsAction /* setWishLists */,
} from "../redux/slices/wishLists";
import { EditMyList } from "../components/modals/EditMyList";
import { EditOutlined } from "@mui/icons-material";
import { WishListCard } from "../components/WishListCard";
import { FetchedComponent } from "../components/fetchers/FetchedComponent";
import { anyIsIdle, useReduxState } from "../utils/fetchers";
import _ from "lodash";

export const ChristmasListPage = () => {
  const { setModal } = useContext(ModalContext);
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
        <FetchedComponent resource={wishLists}>
          {(data) => (
            <Flex flexDirection="column" p={3}>
              {!_.find(data, (list) => list.user.uid === user.uid) ? (
                <Flex justifyContent="flex-end">
                  <Button
                    variant="contained"
                    onClick={() => setModal(ModalType.EditMyList)}
                  >
                    Start My List
                  </Button>
                </Flex>
              ) : null}
              <Flex gap="32px" flexWrap="wrap">
                {_.map(data, (list) => {
                  return <WishListCard list={list} user={user} />;
                })}
              </Flex>
            </Flex>
          )}
        </FetchedComponent>
      ) : (
        <Flex>
          <SignIn signInSuccessUrl={window.location.href} />
        </Flex>
      )}
      <EditMyList />
    </Flex>
  );
};
