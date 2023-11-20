import { Button } from "@mui/material";
import { useContext } from "react";
import { Flex } from "../components/Flex";
import { ModalContext, ModalType } from "../components/modals/ModalContext";

export const ChristmasListPage = () => {
  const {setModal} = useContext(ModalContext);
  return (
    <Flex flexDirection="column" p={3}>
      <Flex justifyContent="flex-end">
        <Button variant="contained" onClick={() => setModal(ModalType.EditMyList)}>Edit My List</Button>
      </Flex>
      <Flex></Flex>
    </Flex>
  );
};