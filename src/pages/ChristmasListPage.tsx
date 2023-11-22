import { Button, Card } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import firebase from 'firebase/compat/app';
import { Flex } from "../components/Flex";
import { ModalContext, ModalType } from "../components/modals/ModalContext";
import { SignIn } from "../components/SignIn";
import { setUser } from "../redux/slices/user";
import { useUser } from "../redux/selectors";
import { User } from "../models/User";
import { useParams } from "react-router-dom";
import { getExchangeEventFromServer } from "../api/ChristmasListApi";
import { exchangeEvent, setExchangeEvent } from "../redux/slices/exchangeEvent";

export const ChristmasListPage = () => {
  const {setModal} = useContext(ModalContext);
  const dispatch = useDispatch();
  const user = useUser();
  const {exchangeEvent} = useParams<{exchangeEvent: string}>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unregister = firebase.auth().onAuthStateChanged(authUser => {
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
    if (!exchangeEvent) return;
    const fetchExchangeEvent = async () => {
      setLoading(true);
      const response = await getExchangeEventFromServer(exchangeEvent);
      setLoading(false);
      if (!response.success) console.error(`Error fetching exchange event ${response.error}`);
      dispatch(setExchangeEvent(response.data));
    };
    fetchExchangeEvent();
  }, [user]);

  return (
    <Flex flexDirection="column" p={3}>
      {!!user ? (
        <Flex flexDirection="column" p={3}>
          <Flex justifyContent="flex-end">
            <Button variant="contained" onClick={() => setModal(ModalType.EditMyList)}>Edit My List</Button>
          </Flex>
          <Flex>
            <Card>
              <Flex flexDirection="column" p={3}>
                <h1>My List</h1>
                
              </Flex>
            </Card>
          </Flex>
        </Flex>
      ) : (
        <Flex>
          <SignIn signInSuccessUrl='/christmas-list' />
        </Flex>
      )}
    </Flex>
  );
};