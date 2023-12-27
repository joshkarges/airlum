import { Button, TextField, Typography } from "@mui/material";
import { Flex } from "./Flex";
import { Comment } from "../models/functions";
import { useUser } from "../redux/selectors";
import { useState } from "react";
import { useDispatcher } from "../utils/fetchers";
import {
  deleteCommentAction,
  updateCommentAction,
} from "../redux/slices/wishLists";
import { RichText } from "./RichText";

type CommentCardProps = {
  comment: Comment;
  wishListId: string;
  ideaId: string;
};

export const CommentCard = ({
  comment,
  wishListId,
  ideaId,
}: CommentCardProps) => {
  const user = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(comment.text);
  const updateComment = useDispatcher(updateCommentAction);
  const deleteComment = useDispatcher(deleteCommentAction);
  const authorFirstName = comment.author.displayName.split(" ")[0];
  const isCommentAuthor = comment.author.uid === user?.uid;
  return (
    <Flex flexDirection="column" gap="8px">
      <Flex>
        <Flex>
          <Typography
            variant="button"
            sx={{
              fontWeight: "bold",
              color: isCommentAuthor ? "blue" : "text.primary",
              whiteSpace: "pre",
            }}
          >
            {`${authorFirstName}: `}
          </Typography>
        </Flex>
        {isCommentAuthor && isEditing ? (
          <TextField
            value={text}
            onChange={(evt) => setText(evt.target.value)}
            variant="standard"
            fullWidth
            multiline
          />
        ) : (
          <RichText content={text} />
        )}
      </Flex>

      {isCommentAuthor && (
        <Flex justifyContent="space-evenly">
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => {
              deleteComment({
                wishListId: wishListId,
                ideaId: ideaId,
                commentId: comment.id,
              });
            }}
          >
            Delete
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              if (isEditing) {
                // save
                updateComment({
                  wishListId: wishListId,
                  ideaId: ideaId,
                  commentId: comment.id,
                  text,
                });
                setIsEditing(false);
              } else {
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? "Save" : "Edit"}
          </Button>
        </Flex>
      )}
    </Flex>
  );
};
