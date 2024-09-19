import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { useParams } from "react-router-dom";
import { Flex } from "../components/Flex";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
  Theme,
  Typography,
} from "@mui/material";
import { Delete, Edit, Person, Save, Share } from "@mui/icons-material";
import {
  anyIsError,
  anyIsIdle,
  anyIsPending,
  anyIsSuccess,
  errorMessage,
  useEffectIfNotFetchedYet,
  useFetchedResource,
} from "../utils/fetchers";
import {
  deleteMember,
  editMemberName,
  finishTimedTeam,
  getTimedTeam,
  joinTimedTeam,
  resetTimedTeam,
  startTimedTeam,
} from "../api/SplendorApi";
import { FetchedComponent } from "../components/fetchers/FetchedComponent";
import { makeStyles } from "@mui/styles";
import { useQuery } from "../utils/routing";
import { useEffect, useState } from "react";
import { TimedTeam, TimedTeamMember } from "../models/functions";
import { Loading } from "../components/fetchers/Loading";
import { TimedTeamForm } from "../components/TimedTeamForm";

const db = firebase.firestore();
if (window.location.hostname === "localhost") {
  db.useEmulator("localhost", 8080);
}

const useStyles = makeStyles((theme: Theme) => ({
  card: {
    minWidth: "min(400px, calc(100% - 32px))",
  },
  secondaryListItem: {
    display: "flex",
    columnGap: "16px",
  },
}));

const INITIAL_TIMED_TEAM: TimedTeam = {
  id: "",
  name: "",
  author: "",
  members: [],
  numPerTeam: [],
  duration: 0,
  started: false,
  finished: false,
  startedAt: 0,
};

export const TimedGame = () => {
  const classes = useStyles();
  const { gameId } = useParams<{ gameId: string }>();
  const queryParams = useQuery();
  const memberKey = queryParams.get("memberKey") || "";
  const [timedTeamResource, fetchTimedTeam] = useFetchedResource(getTimedTeam, {
    initialData: INITIAL_TIMED_TEAM,
  });
  const [timedTeam, setTimedTeam] = useState(timedTeamResource);
  const [userText, setUserText] = useState("");
  const [member, setMember] = useState<TimedTeamMember>({
    user: "",
    memberKey,
    team: "",
    isAuthor: false,
  });
  const isAuthor = member.isAuthor;
  const [timeLeft, setTimeLeft] = useState(120);
  const [joinTeamResponse, fetchJoinTeam] = useFetchedResource(joinTimedTeam, {
    initialData: { memberKey },
  });
  const [deleteMemberResponse, fetchDeleteMember] =
    useFetchedResource(deleteMember);
  const [startGameResponse, fetchStartGame] =
    useFetchedResource(startTimedTeam);
  const [finishGameResponse, fetchFinishGame] =
    useFetchedResource(finishTimedTeam);
  const [resetGameResponse, fetchResetGame] =
    useFetchedResource(resetTimedTeam);
  const [editMemberResponse, fetchEditMember] =
    useFetchedResource(editMemberName);
  const [editMemberText, setEditMemberText] = useState(member.user);
  const [isEditingName, setIsEditingName] = useState(false);
  useEffectIfNotFetchedYet(timedTeamResource, fetchTimedTeam, { id: gameId });
  useEffect(() => {
    if (timedTeamResource) {
      setTimedTeam(timedTeamResource);
      if (anyIsSuccess(timedTeamResource) && timedTeamResource.data)
        setTimeLeft(timedTeamResource.data.duration);
    }
  }, [timedTeamResource]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!timedTeam.data.finished && timedTeam.data.started) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTimeLeft = prev - 1;
          if (newTimeLeft <= 0) {
            clearInterval(interval);
          }
          return newTimeLeft;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timedTeam.data.started]);

  useEffect(() => {
    if (timeLeft <= 0 && isAuthor) {
      fetchFinishGame({ id: gameId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(() => {
    db.collection("timedTeams")
      .doc(gameId)
      .onSnapshot({
        next: (doc) => {
          const data = doc.data();
          if (data) {
            setTimedTeam((prev) => ({
              ...prev,
              data: data as TimedTeam,
            }));
            setTimeLeft(data.duration);
          }
        },
        error: (error) => {
          console.error("error", error);
        },
        complete: () => {
          console.log("complete");
        },
      });
  }, [gameId]);

  useEffect(() => {
    if (memberKey) {
      db.collection("timedTeams")
        .doc(gameId)
        .collection("teams")
        .doc(memberKey)
        .onSnapshot({
          next: (doc) => {
            const data = doc.data();
            if (data) {
              setMember(data as TimedTeamMember);
              setEditMemberText(data.user);
            } else {
              setMember({
                user: "",
                memberKey: "",
                team: "",
                isAuthor: false,
              });
              // Remove memberKey from query params
              queryParams.delete("memberKey");
              window.history.replaceState(
                null,
                "",
                `${window.location.pathname}?${queryParams.toString()}`
              );
            }
          },
          error: (error) => {
            console.error("error", error);
          },
          complete: () => {
            console.log("complete");
          },
        });
    }
  }, [gameId, memberKey, queryParams]);

  return (
    <Flex
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      rowGap="16px"
      pb="32px"
    >
      <FetchedComponent resource={timedTeam}>
        {(data) => (
          <Flex flexDirection="column" rowGap="16px">
            <Typography variant="h1">{`${data?.name}`}</Typography>
            <Flex alignItems="center">
              <Typography
                variant="h3"
                fontFamily="monospace"
              >{`code: ${gameId}`}</Typography>
              <div>
                <IconButton
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}${window.location.pathname}`
                    );
                  }}
                >
                  <Share />
                </IconButton>
              </div>
            </Flex>
            {isAuthor && (
              <Accordion defaultExpanded={false}>
                <AccordionSummary expandIcon={<Edit />}>Edit</AccordionSummary>
                <AccordionDetails>
                  <TimedTeamForm game={data} />
                </AccordionDetails>
              </Accordion>
            )}
            <Typography>{`Duration: ${data.duration} seconds`}</Typography>
            {data.numPerTeam.map(({ teamName, numPlayers }) => (
              <Typography key={teamName}>{`${teamName}: ${
                numPlayers || "Any"
              } players`}</Typography>
            ))}
            <Typography>{`Members: ${data.members.length}`}</Typography>
            {isAuthor && data.started && (
              <>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => {
                    fetchResetGame({
                      id: gameId,
                    });
                  }}
                >
                  Reset
                </Button>
                <FetchedComponent resource={resetGameResponse}>
                  {(data) => null}
                </FetchedComponent>
              </>
            )}
          </Flex>
        )}
      </FetchedComponent>
      <Card className={classes.card}>
        <FetchedComponent resource={timedTeam}>
          {(data) => (
            <List dense>
              {data?.members.map((memberName) => (
                <ListItem
                  selected={memberName === member.user}
                  key={memberName}
                >
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  {isEditingName && memberName === member.user ? (
                    <TextField
                      variant="standard"
                      value={editMemberText}
                      onChange={(e) => setEditMemberText(e.target.value)}
                    />
                  ) : (
                    <ListItemText primary={memberName} />
                  )}
                  <ListItemSecondaryAction
                    className={classes.secondaryListItem}
                  >
                    {memberName === member.user && (
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={async () => {
                          if (isEditingName) {
                            await fetchEditMember({
                              id: gameId,
                              memberKey: member.memberKey,
                              username: editMemberText,
                            });
                            setIsEditingName(false);
                          } else {
                            setIsEditingName(true);
                          }
                        }}
                      >
                        {anyIsPending(editMemberResponse) ? (
                          <CircularProgress />
                        ) : isEditingName ? (
                          <Save />
                        ) : (
                          <Edit />
                        )}
                      </IconButton>
                    )}
                    {isAuthor && (
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => {
                          fetchDeleteMember({
                            id: gameId,
                            user: memberName,
                          });
                        }}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </FetchedComponent>
        {anyIsPending(deleteMemberResponse) && <Loading />}
      </Card>
      {member.memberKey ? ( // They've joined
        member.team ? (
          <Typography>{`You are on team "${member.team}"`}</Typography>
        ) : timedTeam.data.started ? (
          <Typography>{`Time left: ${timeLeft} seconds`}</Typography>
        ) : (
          <Typography>Waiting for game to begin...</Typography>
        )
      ) : timedTeam.data.finished ? ( // The game has already finished and they didn't join
        <Typography>The game has already finished</Typography>
      ) : timedTeam.data.started ? ( // The game has already started and they didn't join
        <Typography>The game has already started</Typography>
      ) : anyIsPending(joinTeamResponse) ? ( // Joining the game
        <Loading />
      ) : anyIsError(joinTeamResponse) ? ( // Error joining the game
        <Typography color="red">{errorMessage(joinTeamResponse)}</Typography>
      ) : (
        <Flex columnGap="8px">
          <TextField
            label="User"
            value={userText}
            onChange={(e) => {
              setUserText(e.target.value);
            }}
            error={timedTeam?.data?.members.includes(userText)}
            helperText={
              timedTeam?.data?.members.includes(userText)
                ? "Username already taken"
                : ""
            }
          />
          <Button
            onClick={async () => {
              const { response } = await fetchJoinTeam({
                id: gameId,
                user: userText,
                isAuthor: false,
              });
              if (response) {
                queryParams.set("memberKey", response.memberKey);
                window.history.replaceState(
                  null,
                  "",
                  `${window.location.pathname}?${queryParams.toString()}`
                );
              }
            }}
            variant="contained"
            disabled={!userText || timedTeam?.data?.members.includes(userText)}
          >
            Join
          </Button>
        </Flex>
      )}
      {isAuthor && !timedTeam.data.started && (
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            fetchStartGame({ id: gameId });
          }}
        >
          Start Game
        </Button>
      )}
      {anyIsPending(startGameResponse) && <Loading />}
      <FetchedComponent resource={finishGameResponse}>
        {(data) => (
          <>
            {timedTeam.data.finished && (
              <Typography>Teams Are Assigned!</Typography>
            )}
          </>
        )}
      </FetchedComponent>
    </Flex>
  );
};
