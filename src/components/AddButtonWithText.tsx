import {
  Button,
  ButtonProps,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { AddCircleOutline } from "@mui/icons-material";
import { InputAdornment, TextField } from "@mui/material";
import { useCallback, useState } from "react";
import { FetchingActionResponse } from "../utils/fetchers";
import { Flex } from "./Flex";

type AddIdeaButtonProps = ButtonProps & {
  commitText: (text: string) => Promise<FetchingActionResponse<any>>;
  buttonText: string;
  initialText?: string;
  placeholder?: string;
};

export const AddButtonWithText = ({
  commitText,
  buttonText,
  initialText,
  placeholder,
  ...buttonProps
}: AddIdeaButtonProps) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initialText ?? "");
  const [addLoading, setAddLoading] = useState(false);
  const commitIdea = useCallback(
    async (title: string) => {
      if (!title) {
        setEditing(false);
        return;
      }
      setAddLoading(true);
      const { error } = await commitText(title);
      // TODO: Show the error as an indicator to the user.
      setAddLoading(false);
      if (!error) {
        setEditing(false);
        setText("");
      }
    },
    [commitText]
  );
  return (
    <Flex justifyContent="center">
      {editing ? (
        <TextField
          value={text}
          onChange={(evt) => setText(evt.target.value)}
          onKeyDown={(evt) => {
            if (evt.key === "Enter") {
              commitIdea(text);
            }
            if (evt.key === "Escape") {
              setEditing(false);
              setText("");
            }
          }}
          size="small"
          autoFocus
          fullWidth
          onBlur={() => commitIdea(text)}
          placeholder={placeholder}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {addLoading ? (
                  <CircularProgress />
                ) : (
                  <IconButton onClick={() => commitIdea(text)} disabled={!text}>
                    <AddCircleOutline color={text ? "primary" : "disabled"} />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
        />
      ) : (
        <Button
          onClick={() => setEditing(true)}
          fullWidth
          variant="contained"
          size="small"
          {...buttonProps}
        >
          {buttonText}
        </Button>
      )}
    </Flex>
  );
};
