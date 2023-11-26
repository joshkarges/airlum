import { EditOutlined } from "@mui/icons-material";
import { Card, IconButton } from "@mui/material";
import { useContext } from "react";
import { ChristmasList } from "../models/functions";
import { User } from "../models/User";
import { useExchangeEvent } from "../redux/selectors";
import { Flex } from "./Flex";
import { ModalContext, ModalType } from "./modals/ModalContext";

type WishListCardProps = {
  list: ChristmasList;
  user: User;
};
export const WishListCard = ({ list, user }: WishListCardProps) => {
  const { setModal } = useContext(ModalContext);
  const exchangeEvent = useExchangeEvent();
  return (
    <Card>
      <Flex flexDirection="column" p={3}>
        <Flex>
          <h1>{list.user.displayName}</h1>
          {list.user.uid === user.uid ? (
            <Flex alignItems="center">
              <IconButton onClick={() => setModal(ModalType.EditMyList)}>
                <EditOutlined />
              </IconButton>
            </Flex>
          ) : null}
        </Flex>
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
};
