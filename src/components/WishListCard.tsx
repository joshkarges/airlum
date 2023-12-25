import { ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  colors,
  TextField,
  Theme,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import classNames from "classnames";
import _ from "lodash";
import { useCallback, useState } from "react";
import { WishList, User } from "../models/functions";
import { useUser } from "../redux/selectors";
import {
  addIdeaAction,
  deleteExtraWishListAction,
  updateWishListMetadataAction,
} from "../redux/slices/wishLists";
import { useDispatcher } from "../utils/fetchers";
import { AddButtonWithText } from "./AddButtonWithText";
import { DeleteButtonWithConfirmation } from "./DeleteButtonWithConfirmation";
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
    backgroundColor: theme.palette.primary.light,
    borderRadius: 4,
    color: theme.palette.getContrastText(theme.palette.primary.light),
  },
  extraWishListContainer: {
    backgroundColor: colors.purple[50],
  },
  ownWishListContainer: {
    backgroundColor: colors.amber[50],
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
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);
  const addIdea = useDispatcher(addIdeaAction);
  const deleteExtraWishlist = useDispatcher(deleteExtraWishListAction);
  const addIdeaFromTitle = useCallback(
    (title: string) => {
      return addIdea({
        wishListId: list.id,
        idea: { title, description: "" },
      });
    },
    [addIdea, list.id]
  );
  return (
    <Accordion
      expanded={listExpanded}
      onChange={(evt, expanded) => setListExpanded(expanded)}
      className={classNames(classes.wishListContainer, {
        [classes.extraWishListContainer]: list.isExtra,
        [classes.ownWishListContainer]:
          list.author.uid === user?.uid && !list.isExtra,
      })}
      color="primary"
      elevation={3}
    >
      <AccordionSummary expandIcon={<ExpandMore />} color="primary">
        <EditableField list={list} canEdit={listExpanded} fieldName="title" />
      </AccordionSummary>
      <AccordionDetails>
        <Flex flexDirection="column" gap="16px">
          <EditableField list={list} canEdit={listExpanded} fieldName="notes" />
          <Flex flexDirection="column">
            {_.map(list.ideas, (idea, id) => {
              return (
                <IdeaCard
                  idea={idea}
                  wishList={list}
                  key={id}
                  expandedIdeaId={expandedIdeaId}
                  setExpandedIdeaId={setExpandedIdeaId}
                />
              );
            })}
            {_.isEmpty(list.ideas) && (
              <DeleteButtonWithConfirmation
                onDelete={() => deleteExtraWishlist({ wishListId: list.id })}
                itemName="Wish List"
              />
            )}
          </Flex>
          <AddButtonWithText
            commitText={addIdeaFromTitle}
            buttonText="Add Idea"
          />
        </Flex>
      </AccordionDetails>
    </Accordion>
  );
};
