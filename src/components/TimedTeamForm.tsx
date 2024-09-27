import { Delete, Add, ScheduleSend } from "@mui/icons-material";
import {
  TextField,
  IconButton,
  Typography,
  Button,
  Theme,
} from "@mui/material";
import { Formik, Form } from "formik";
import { TimedTeam, UpsertTimedTeamResponse } from "../models/functions";
import {
  anyIsError,
  anyIsPending,
  errorMessage,
  useFetchedResource,
} from "../utils/fetchers";
import { FetchedComponent } from "./fetchers/FetchedComponent";
import { Loading } from "./fetchers/Loading";
import { Flex } from "./Flex";
import * as Yup from "yup";
import { makeStyles } from "@mui/styles";
import { joinTimedTeam, upsertTimedTeam } from "../api/SplendorApi";

const useStyles = makeStyles((theme: Theme) => ({
  form: {
    display: "flex",
    flexDirection: "column",
    rowGap: "16px",
  },
}));

const EMPTY_FORM = {
  name: "",
  duration: 120,
  author: "",
  numPerTeam: [
    { teamName: "bad guys", numPlayers: 1 },
    { teamName: "good guys", numPlayers: 0 },
  ],
};

type TimedTeamFormProps = {
  game?: TimedTeam;
};
export const TimedTeamForm = ({ game }: TimedTeamFormProps) => {
  const classes = useStyles();
  const [upsertTimedTeamResponse, fetchUpsertTimedTeam] =
    useFetchedResource(upsertTimedTeam);
  const [joinTeamResponse, fetchJoinTeam] = useFetchedResource(joinTimedTeam);
  return (
    <Formik
      initialValues={game || EMPTY_FORM}
      onSubmit={() => {}}
      validationSchema={Yup.object({
        gameName: Yup.string().required("Required"),
        duration: Yup.number().required("Required"),
        author: Yup.string().required("Required"),
        numPerTeam: Yup.array().of(
          Yup.object({
            teamName: Yup.string().required("Required"),
            numPlayers: Yup.number().required("Required"),
          })
        ),
      })}
    >
      {(params) => (
        <Form className={classes.form}>
          <Flex flexDirection="column" rowGap="8px">
            <TextField
              name="name"
              label="Game Name"
              value={params.values.name}
              onChange={(e) => params.handleChange(e)}
              autoComplete="off"
            />
            <TextField
              name="duration"
              label="Duration in seconds"
              type="number"
              value={params.values.duration}
              onChange={(e) => params.handleChange(e)}
            />
            {!game && (
              <TextField
                name="author"
                label="Author"
                value={params.values.author}
                onChange={(e) => params.handleChange(e)}
              />
            )}
            {params.values.numPerTeam.map((team, index) => (
              <Flex key={`${team}-${index}`} columnGap="8px">
                <TextField
                  name={`numPerTeam[${index}].teamName`}
                  label="Team Name"
                  value={params.values.numPerTeam[index].teamName}
                  onChange={(e) => params.handleChange(e)}
                />
                <TextField
                  name={`numPerTeam[${index}].numPlayers`}
                  label="Number of Players"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={params.values.numPerTeam[index].numPlayers}
                  onChange={(e) => {
                    if (e.target.value === "0") {
                      // Find any other team with 0 players and set it to 1
                      const otherTeamIndex = params.values.numPerTeam.findIndex(
                        (team, i) => i !== index && team.numPlayers === 0
                      );
                      if (otherTeamIndex !== -1) {
                        params.setValues({
                          ...params.values,
                          numPerTeam: params.values.numPerTeam.map((team, i) =>
                            i === otherTeamIndex
                              ? { ...team, numPlayers: 1 }
                              : team
                          ),
                        });
                      }
                    }
                    params.handleChange(e);
                  }}
                />
                <Flex alignItems="center">
                  <IconButton
                    onClick={() =>
                      params.setValues({
                        ...params.values,
                        numPerTeam: params.values.numPerTeam.filter(
                          (_, i) => i !== index
                        ),
                      })
                    }
                  >
                    <Delete />
                  </IconButton>
                </Flex>
              </Flex>
            ))}
            <Typography>
              The team with 0 players will have any number of players
            </Typography>
            <Button
              onClick={() =>
                params.setValues({
                  ...params.values,
                  numPerTeam: [
                    ...params.values.numPerTeam,
                    { teamName: "", numPlayers: 1 },
                  ],
                })
              }
              startIcon={<Add />}
              variant="outlined"
            >
              Add Team
            </Button>
          </Flex>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ScheduleSend />}
            onClick={async () => {
              const { response } = await fetchUpsertTimedTeam({
                name: params.values.name,
                duration: params.values.duration,
                author: params.values.author,
                numPerTeam: params.values.numPerTeam,
                gameId: game?.id,
              });
              if (!response || game) return;
              fetchJoinTeam({
                id: response.id,
                user: params.values.author,
                isAuthor: true,
              });
            }}
          >
            {`${game ? "Update" : "Create"} Timed Team`}
          </Button>
          {anyIsError(upsertTimedTeamResponse) &&
            errorMessage(upsertTimedTeamResponse)}
          {anyIsPending(upsertTimedTeamResponse) && <Loading />}
          {!game && (
            <FetchedComponent
              resource={[upsertTimedTeamResponse, joinTeamResponse as any]}
            >
              {(
                upsertTimedTeamData: UpsertTimedTeamResponse,
                joinTeamData: any
              ) => (
                <a
                  href={`/timed-teams/${upsertTimedTeamData.id}?memberKey=${joinTeamData?.memberKey}`}
                >
                  <Button variant="outlined">
                    Go To Game: {upsertTimedTeamData.id}
                  </Button>
                </a>
              )}
            </FetchedComponent>
          )}
        </Form>
      )}
    </Formik>
  );
};
