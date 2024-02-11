import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  CircularProgress,
  IconButton,
  TextField,
  Theme,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import _ from "lodash";
import React, { useCallback, useState } from "react";
import { Idea, IdeaMarkStatus, WishList } from "../models/functions";
import { useGetUserShortName, useUser } from "../redux/selectors";
import {
  addCommentAction,
  deleteIdeaAction,
  markIdeaAction,
  updateIdeaMetadataAction,
} from "../redux/slices/wishLists";
import { useDispatcher } from "../utils/fetchers";
import { CommentCard } from "./CommentCard";
import { Flex } from "./Flex";
import {
  CheckCircle,
  RadioButtonUnchecked,
  RemoveCircle,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { AddButtonWithText } from "./AddButtonWithText";
import { DeleteButtonWithConfirmation } from "./DeleteButtonWithConfirmation";
import { RichText } from "./RichText";

const useStyles = makeStyles((theme: Theme) => ({
  ideaContainer: {
    borderRadius: 4,
  },
  titleInput: {
    "&&": {
      ...theme.typography.h6,
    },
  },
  descriptionInput: {
    "&&": {
      ...theme.typography.body1,
    },
  },
  noShrink: {
    flexShrink: 0,
  },
}));

type TitleInputProps = {
  wishListId: string;
  idea: Idea;
  canEdit: boolean;
  fieldName: "title" | "description";
};

const EditableField = ({
  idea,
  canEdit,
  wishListId,
  fieldName,
}: TitleInputProps) => {
  const classes = useStyles();
  const user = useUser();
  const [text, setText] = useState(idea[fieldName]);
  const updateIdeaMetadata = useDispatcher(updateIdeaMetadataAction);
  const isIdeaAuthor = idea.author.uid === user?.uid;
  return isIdeaAuthor && canEdit ? (
    <TextField
      label={fieldName === "title" ? "Idea" : "Description"}
      inputProps={{
        className:
          fieldName === "title" ? classes.titleInput : classes.descriptionInput,
      }}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
      }}
      onBlur={() => {
        // Does this cover everything?  What if the user somehow doesn't blur, but they expect it to be saved?
        if (text !== idea[fieldName]) {
          updateIdeaMetadata({
            wishListId,
            ideaId: idea.id,
            [fieldName]: text,
          });
        }
      }}
      onClick={(evt) => evt.stopPropagation()}
      multiline={fieldName === "description"}
      fullWidth
      variant="standard"
    />
  ) : (
    <RichText
      variant={fieldName === "title" ? "h6" : "body1"}
      content={idea[fieldName]}
    />
  );
};

const MarkIconByStatus = {
  [IdeaMarkStatus.Completed]: CheckCircle,
  [IdeaMarkStatus.Deleted]: RemoveCircle,
  [IdeaMarkStatus.Incomplete]: RadioButtonUnchecked,
  [IdeaMarkStatus.Reserved]: CheckCircle, // Do we need this?
};

type IdeaProps = {
  wishList: WishList;
  idea: Idea;
  expandedIdeaId: string | null;
  setExpandedIdeaId: React.Dispatch<React.SetStateAction<string | null>>;
};

export const IdeaCard = ({
  idea,
  wishList,
  expandedIdeaId,
  setExpandedIdeaId,
}: IdeaProps) => {
  const classes = useStyles();
  const user = useUser();
  const ideaExpanded = expandedIdeaId === idea.id;
  const addComment = useDispatcher(addCommentAction);
  const addCommentFromText = useCallback(
    (text: string) => {
      return addComment({
        wishListId: wishList.id,
        ideaId: idea.id,
        text,
      });
    },
    [addComment, idea.id, wishList.id]
  );
  const deleteIdea = useDispatcher(deleteIdeaAction);
  const onDelete = useCallback(() => {
    return deleteIdea({ wishListId: wishList.id, ideaId: idea.id });
  }, [deleteIdea, idea.id, wishList.id]);
  const markIdea = useDispatcher(markIdeaAction);
  const [markLoading, setMarkLoading] = useState(false);
  const getShortName = useGetUserShortName();
  const currentMarkStatus = idea.mark?.status ?? IdeaMarkStatus.Incomplete;
  const MarkIcon = MarkIconByStatus[currentMarkStatus];
  const nextMarkStatus =
    currentMarkStatus === IdeaMarkStatus.Incomplete
      ? IdeaMarkStatus.Completed
      : IdeaMarkStatus.Incomplete;
  const canMark =
    !markLoading &&
    (currentMarkStatus === IdeaMarkStatus.Incomplete ||
      idea.mark?.author.uid === user?.uid);
  return (
    <Accordion
      expanded={ideaExpanded}
      onChange={(evt, expanded) => setExpandedIdeaId(expanded ? idea.id : null)}
      elevation={3}
      className={classes.ideaContainer}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Flex gap="8px" alignItems="center" flexGrow={1}>
          {wishList.author.uid !== user?.uid || wishList.isExtra ? (
            <Flex flexDirection="column" alignItems="center">
              <IconButton
                className={classes.noShrink}
                onClick={async (evt) => {
                  evt.stopPropagation();
                  setMarkLoading(true);
                  // TODO: Show some indicator when marking fails
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { response, error } = await markIdea({
                    wishListId: wishList.id,
                    ideaId: idea.id,
                    status: nextMarkStatus,
                  });
                  setMarkLoading(false);
                }}
                disabled={!canMark}
              >
                {markLoading ? (
                  <CircularProgress style={{ width: 24, height: 24 }} />
                ) : (
                  <MarkIcon color="success" />
                )}
              </IconButton>
              {idea.mark && ideaExpanded && (
                <Typography variant="caption">
                  {getShortName(idea.mark.author.uid)}
                </Typography>
              )}
            </Flex>
          ) : null}
          <Flex flexDirection="column" flexGrow={1}>
            {(wishList.isExtra ||
              (wishList.author.uid !== user?.uid &&
                wishList.author.uid !== idea.author.uid)) && (
              <Typography variant="caption">{`${getShortName(
                idea.author.uid
              )} added this`}</Typography>
            )}
            <EditableField
              idea={idea}
              canEdit={ideaExpanded}
              wishListId={wishList.id}
              fieldName="title"
            />
          </Flex>
        </Flex>
      </AccordionSummary>
      <AccordionDetails>
        <Flex flexDirection="column" gap="16px">
          <EditableField
            idea={idea}
            canEdit={ideaExpanded}
            wishListId={wishList.id}
            fieldName="description"
          />
          {idea.author.uid === user?.uid && (
            <DeleteButtonWithConfirmation onDelete={onDelete} itemName="Idea" />
          )}
          <Flex flexDirection="column">
            <Typography variant="overline">Comments</Typography>
            {_.map(_.values(idea.comments), (comment) => (
              <CommentCard
                comment={comment}
                wishListId={wishList.id}
                ideaId={idea.id}
                key={comment.id}
              />
            ))}
          </Flex>
          <AddButtonWithText
            commitText={addCommentFromText}
            buttonText="Add Comment"
          />
        </Flex>
      </AccordionDetails>
    </Accordion>
  );
};
