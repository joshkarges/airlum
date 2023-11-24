import { AddCircleOutline, DeleteOutline } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogTitle,
  IconButton,
  LinearProgress,
  TextField,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { Formik, FormikProps } from "formik";

import _ from "lodash";
import { useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import * as uuid from "uuid";
import { setWishListOnServer } from "../../api/ChristmasListApi";
import {
  EditMyListFormType,
  Idea,
  wishListToForm,
} from "../../models/functions";
import { useUser, useWishLists } from "../../redux/selectors";
import { setWishList } from "../../redux/slices/wishLists";
import { Flex } from "../Flex";
import { ModalContext, ModalType } from "./ModalContext";

const useStyles = makeStyles((theme) => ({
  formContainer: {
    zIndex: 1,
    padding: 24,
  },
  modalContainer: {
    minWidth: 600,
  },
  ideaTextField: {
    flexGrow: 1,
  },
}));

const initalFormValues: EditMyListFormType = {
  ideas: [] as Idea[],
};

const getFormikProps = (
  props: FormikProps<EditMyListFormType>,
  name: string
) => ({
  name,
  onBlur: props.handleBlur,
  onChange: props.handleChange,
  value: _.get(props.values, name),
});

export const EditMyList = () => {
  const classes = useStyles();
  const { modal, setModal } = useContext(ModalContext);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const user = useUser()!;
  const { exchangeEvent: exchangeEventUrlParam } = useParams<{
    exchangeEvent: string;
  }>();
  const wishLists = useWishLists();
  const myWishList = wishLists.find(({ user: { uid } }) => uid === user.uid);

  return (
    <Dialog open={modal === ModalType.EditMyList}>
      <Flex flexDirection="column" className={classes.modalContainer}>
        <DialogTitle>Edit My List</DialogTitle>
        {loading && <LinearProgress />}
        {error && <Typography color="error">{error.message}</Typography>}
        <Formik
          initialValues={
            myWishList ? wishListToForm(myWishList) : initalFormValues
          }
          onSubmit={(values) => {
            dispatch(
              setWishList({
                userId: user?.uid,
                list: values,
                exchangeEvent: exchangeEventUrlParam,
              })
            );
            setWishListOnServer({
              ...values,
              exchangeEvent: exchangeEventUrlParam,
              docId: myWishList?.docId,
            });
            setModal(null);
          }}
        >
          {(props) => (
            <Flex
              flexDirection="column"
              className={classes.formContainer}
              gap="8px"
            >
              {props.values.ideas.map((idea, i) => (
                <Flex gap="8px" alignItems="center" flexGrow={1}>
                  <Typography variant="h6">Idea {i + 1}</Typography>
                  <TextField
                    className={classes.ideaTextField}
                    key={`idea-${idea.id}`}
                    multiline
                    {...getFormikProps(props, `ideas[${i}].description`)}
                  />
                  <IconButton
                    onClick={() =>
                      props.setFieldValue(
                        "ideas",
                        props.values.ideas.filter(({ id }) => id !== idea.id)
                      )
                    }
                  >
                    <DeleteOutline />
                  </IconButton>
                </Flex>
              ))}
              <Button
                startIcon={<AddCircleOutline />}
                onClick={() => {
                  const newIdea = {
                    description: "",
                    timestamp: Date.now(),
                    id: uuid.v4(),
                  };
                  props.setFieldValue("ideas", [
                    ...props.values.ideas,
                    newIdea,
                  ]);
                }}
              >
                Add Gift Idea
              </Button>
              <Flex flexGrow={1} gap="8px" justifyContent="flex-end">
                <Button variant="contained" onClick={() => setModal(null)}>
                  Cancel
                </Button>
                <Button variant="contained" onClick={props.submitForm}>
                  Save
                </Button>
              </Flex>
            </Flex>
          )}
        </Formik>
      </Flex>
    </Dialog>
  );
};
