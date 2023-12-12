import { Button, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { FetchingActionResponse } from "../utils/fetchers";
import { Flex } from "./Flex";

type DeleteButtonWithConfirmationProps = {
  onDelete: () => Promise<FetchingActionResponse<any>>;
  itemName: string;
};

export const DeleteButtonWithConfirmation = ({
  onDelete,
  itemName,
}: DeleteButtonWithConfirmationProps) => {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = useCallback(async () => {
    setLoading(true);
    const { error } = await onDelete();
    setLoading(false);
    if (!error) {
      setConfirming(false);
    }
  }, [onDelete]);

  return (
    <Flex justifyContent="space-evenly" alignItems="center">
      {confirming ? (
        <>
          <Button variant="contained" onClick={handleDelete} color="error">
            Yes
          </Button>
          <Typography>{loading ? "Deleting..." : "Are you sure?"}</Typography>
          <Button
            variant="outlined"
            onClick={() => setConfirming(false)}
            autoFocus
          >
            Cancel
          </Button>
        </>
      ) : (
        <Button
          onClick={() => setConfirming(true)}
          variant="outlined"
          color="error"
          size="small"
        >
          {`Delete ${itemName}`}
        </Button>
      )}
    </Flex>
  );
};
