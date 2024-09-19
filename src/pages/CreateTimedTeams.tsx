import { Typography } from "@mui/material";
import { Flex } from "../components/Flex";
import { TimedTeamForm } from "../components/TimedTeamForm";

export const CreateTimedTeams = () => {
  return (
    <Flex p="32px" alignItems="center" height="100%" flexDirection="column">
      <Typography variant="h3">Create Timed Team Game</Typography>
      <TimedTeamForm />
    </Flex>
  );
};
