import { Button, Card } from "@mui/material";
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
import { exchangeEvent, setExchangeEvent } from "../redux/slices/exchangeEvent";
import { setWishLists } from "../redux/slices/wishLists";
import { EditMyList } from "../components/modals/EditMyList";

export const ChristmasListPage = () => {
  const { setModal } = useContext(ModalContext);
  const dispatch = useDispatch();
  const user = useUser();
  const { exchangeEvent: exchangeEventUrlParam } = useParams<{
    exchangeEvent: string;
  }>();
  const exchangeEvent = useExchangeEvent();
  const wishLists = useWishLists();
  const [loading, setLoading] = useState(false);

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
    const fetchExchangeEvent = async () => {
      setLoading(true);
      const response = await getExchangeEventFromServer(exchangeEventUrlParam);
      setLoading(false);
      if (!response.success)
        console.error(`Error fetching exchange event ${response.error}`);
      if (response.data) dispatch(setExchangeEvent(response.data));
    };
    fetchExchangeEvent();
  }, [dispatch, exchangeEventUrlParam, user]);

  useEffect(() => {
    if (!user) return;
    if (!exchangeEventUrlParam) return;
    const fetchAllWishLists = async () => {
      setLoading(true);
      const response = await getAllWishListsFromServer(exchangeEventUrlParam);
      setLoading(false);
      if (!response.success)
        console.error(`Error fetching all wish lists ${response.error}`);
      dispatch(setWishLists(response.data));
    };
    fetchAllWishLists();
  }, [dispatch, exchangeEventUrlParam, user]);

  return (
    <Flex flexDirection="column" p={3}>
      {!!user ? (
        <Flex flexDirection="column" p={3}>
          <Flex justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={() => setModal(ModalType.EditMyList)}
            >
              Edit My List
            </Button>
          </Flex>
          <Flex gap="32px" flexWrap="wrap">
            {wishLists.map((list) => {
              return (
                <Card>
                  <Flex flexDirection="column" p={3}>
                    <h1>{list.user.displayName}</h1>
                    {list.ideas.map((idea) => {
                      return (
                        <Flex p="8px">
                          <p>{idea.description}</p>
                        </Flex>
                      );
                    })}
                  </Flex>
                </Card>
              );
            })}
          </Flex>
        </Flex>
      ) : (
        <Flex>
          <SignIn signInSuccessUrl="/christmas-list" />
        </Flex>
      )}
      <EditMyList />
    </Flex>
  );
};
