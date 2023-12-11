import { ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  TextField,
  Theme,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import _ from "lodash";
import { useState } from "react";
import { WishList } from "../models/functions";
import { User } from "../models/User";
import { useUser } from "../redux/selectors";
import {
  addIdeaAction,
  updateWishListMetadataAction,
} from "../redux/slices/wishLists";
import { useDispatcher } from "../utils/fetchers";
import { Flex } from "./Flex";
import { IdeaCard } from "./IdeaCard";

const useStyles = makeStyles((theme: Theme) => ({
  titleInput: {
    "&&": {
      ...theme.typography.h5,
    },
  },
  notesInput: {
    ...theme.typography.subtitle1,
  },
  wishListContainer: {
    maxWidth: 400,
  },
}));

type TitleInputProps = {
  list: WishList;
  canEdit: boolean;
  fieldName: "title" | "notes";
};

const EditableField = ({ list, canEdit, fieldName }: TitleInputProps) => {
  const classes = useStyles();
  const user = useUser();
  const [text, setText] = useState(list[fieldName]);
  const updateListMetadata = useDispatcher(updateWishListMetadataAction);
  const isListAuthor = list.author.uid === user?.uid;
  return isListAuthor && canEdit ? (
    <TextField
      inputProps={{
        className:
          fieldName === "title" ? classes.titleInput : classes.notesInput,
      }}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
      }}
      onBlur={() => {
        // Does this cover everything?  What if the user somehow doesn't blur, but they expect it to be saved?
        if (text !== list[fieldName]) {
          updateListMetadata({
            id: list.id,
            [fieldName]: text,
          });
        }
      }}
      label={fieldName === "notes" ? "Notes" : undefined}
      onClick={(evt) => evt.stopPropagation()}
      multiline={fieldName === "notes"}
      fullWidth
      variant="standard"
    />
  ) : (
    <Typography variant={fieldName === "title" ? "h5" : "subtitle1"}>
      {list[fieldName]}
    </Typography>
  );
};

type WishListCardProps = {
  list: WishList;
  user: User;
};
export const WishListCard = ({ list, user }: WishListCardProps) => {
  const classes = useStyles();
  const [listExpanded, setListExpanded] = useState(true);
  const addIdea = useDispatcher(addIdeaAction);
  return (
    <Accordion
      expanded={listExpanded}
      onChange={(evt, expanded) => setListExpanded(expanded)}
      className={classes.wishListContainer}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <EditableField list={list} canEdit={listExpanded} fieldName="title" />
      </AccordionSummary>
      <AccordionDetails>
        <EditableField list={list} canEdit={listExpanded} fieldName="notes" />
        {_.map(list.ideas, (idea, id) => {
          return <IdeaCard idea={idea} wishList={list} key={id} />;
        })}
        <Flex justifyContent="center">
          <Button
            onClick={() => {
              addIdea({
                wishListId: list.id,
                idea: { title: "", description: "" },
              });
            }}
          >
            Add Idea
          </Button>
        </Flex>
      </AccordionDetails>
    </Accordion>
  );
};
