import {
  Button,
  Icon,
  IconButton,
  TextField,
  Theme,
  Typography,
} from "@mui/material";
import * as Yup from "yup";
import { Flex } from "../components/Flex";
import { anyIsPending, useFetchedResource } from "../utils/fetchers";
import { createTimedTeam, joinTimedTeam } from "../api/SplendorApi";
import { Form, Formik } from "formik";
import { Add, Delete, ScheduleSend } from "@mui/icons-material";
import { makeStyles } from "@mui/styles";
import { FetchedComponent } from "../components/fetchers/FetchedComponent";
import {
  CreateTimedTeamResponse,
  JoinTimedTeamResponse,
} from "../models/functions";
import { Loading } from "../components/fetchers/Loading";

const useStyles = makeStyles((theme: Theme) => ({
  form: {
    display: "flex",
    flexDirection: "column",
    rowGap: "16px",
  },
}));

export const CreateTimedTeams = () => {
  const classes = useStyles();
  const [createTimedTeamResponse, fetchCreateTimedTeam] =
    useFetchedResource(createTimedTeam);
  const [joinTeamResponse, fetchJoinTeam] = useFetchedResource(joinTimedTeam);
  return (
    <Flex p="32px" alignItems="center" height="100%" flexDirection="column">
      <Typography variant="h3">Create Timed Team Game</Typography>
      <Formik
        initialValues={{
          gameName: "",
          duration: 120,
          author: "",
          numPerTeam: [
            { teamName: "bad guys", numPlayers: 1 },
            { teamName: "good guys", numPlayers: 0 },
          ],
        }}
        onSubmit={async (values) => {
          const { response } = await fetchCreateTimedTeam({
            name: values.gameName,
            duration: values.duration,
            author: values.author,
            numPerTeam: values.numPerTeam,
          });
          if (!response) return;
          fetchJoinTeam({
            id: response.id,
            user: values.author,
          });
        }}
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
                name="gameName"
                label="Game Name"
                value={params.values.gameName}
                onChange={(e) => params.handleChange(e)}
              />
              <TextField
                name="duration"
                label="Duration in seconds"
                type="number"
                value={params.values.duration}
                onChange={(e) => params.handleChange(e)}
              />
              <TextField
                name="author"
                label="Author"
                value={params.values.author}
                onChange={(e) => params.handleChange(e)}
              />
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
                        const otherTeamIndex =
                          params.values.numPerTeam.findIndex(
                            (team, i) => i !== index && team.numPlayers === 0
                          );
                        if (otherTeamIndex !== -1) {
                          params.setValues({
                            ...params.values,
                            numPerTeam: params.values.numPerTeam.map(
                              (team, i) =>
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
              type="submit"
              startIcon={<ScheduleSend />}
            >
              Create Timed Team
            </Button>
            {anyIsPending(createTimedTeamResponse) && <Loading />}
            <FetchedComponent
              resource={[createTimedTeamResponse, joinTeamResponse as any]}
            >
              {(
                createTimedTeamData: CreateTimedTeamResponse,
                joinTeamData: any
              ) => (
                <a
                  href={`/timed-teams/${createTimedTeamData.id}?memberKey=${joinTeamData?.memberKey}`}
                >
                  <Button variant="outlined">
                    Go To Game: {createTimedTeamData.id}
                  </Button>
                </a>
              )}
            </FetchedComponent>
          </Form>
        )}
      </Formik>
    </Flex>
  );
};
