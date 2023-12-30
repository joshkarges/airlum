import { Close } from "@mui/icons-material";
import { Chip, Dialog, IconButton, Typography } from "@mui/material";
import _ from "lodash";
import { useContext, useMemo } from "react";
import { IdeaMarkStatus } from "../../models/functions";
import { useUser, useWishLists } from "../../redux/selectors";
import { Flex } from "../Flex";
import { ModalContext, ModalType } from "./ModalContext";

export const MyClaimsModal = () => {
  const { modal, setModal } = useContext(ModalContext);
  const user = useUser();
  const wishLists = useWishLists();
  const claims = useMemo(() => {
    return _.orderBy(
      _.map(
        _.filter(
          wishLists.data,
          (list) => list.author.uid !== user?.uid || list.isExtra
        ),
        (list, id) => {
          return {
            recipient: list.title,
            gifts: _.filter(
              list.ideas,
              (idea) =>
                idea.mark?.author.uid === user?.uid &&
                idea.mark?.status === IdeaMarkStatus.Completed
            ),
          };
        }
      ),
      ({ gifts }) => gifts.length,
      "desc"
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, wishLists.data]);
  return (
    <Dialog open={modal === ModalType.MyClaims} onClose={() => setModal(null)}>
      <Flex flexDirection="column" p="32px" minWidth="300px" gap="32px">
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="h4">My Claims</Typography>
          <IconButton onClick={() => setModal(null)}>
            <Close />
          </IconButton>
        </Flex>
        {claims.length === 0 ? (
          <Typography>No other users</Typography>
        ) : (
          claims.map(({ recipient, gifts }) => {
            return (
              <Flex flexDirection="column">
                <Typography>{`${recipient} (${gifts.length})`}</Typography>
                <Flex gap="8px">
                  {gifts.map((gift) => {
                    return <Chip label={gift.title} />;
                  })}
                </Flex>
              </Flex>
            );
          })
        )}
      </Flex>
    </Dialog>
  );
};
