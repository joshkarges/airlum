import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { useParams } from "react-router-dom";
import { Flex } from "../components/Flex";
import {
  Button,
  Card,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Theme,
  Typography,
} from "@mui/material";
import { Delete, Person, Share } from "@mui/icons-material";
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
  finishTimedTeam,
  getTimedTeam,
  joinTimedTeam,
  startTimedTeam,
} from "../api/SplendorApi";
import { FetchedComponent } from "../components/fetchers/FetchedComponent";
import { makeStyles } from "@mui/styles";
import { useQuery } from "../utils/routing";
import { useEffect, useState } from "react";
import { TimedTeam, TimedTeamMember } from "../models/functions";
import { Loading } from "../components/fetchers/Loading";

const db = firebase.firestore();
if (window.location.hostname === "localhost") {
  db.useEmulator("localhost", 8080);
}

const useStyles = makeStyles((theme: Theme) => ({
  card: {
    minWidth: "min(400px, calc(100% - 32px))",
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
  });
  const isAuthor = timedTeam.data.author === member.user;
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
    if (joinTeamResponse.data.memberKey) {
      db.collection("timedTeams")
        .doc(gameId)
        .collection("teams")
        .doc(joinTeamResponse.data.memberKey)
        .onSnapshot({
          next: (doc) => {
            const data = doc.data();
            if (data) {
              setMember(data as TimedTeamMember);
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
  }, [gameId, joinTeamResponse]);

  return (
    <Flex
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      rowGap="16px"
    >
      <FetchedComponent resource={timedTeam}>
        {(data) => (
          <Flex flexDirection="column" rowGap="16px">
            <Typography variant="h1">{`${data?.name}`}</Typography>
            <Flex alignItems="center">
              <Typography variant="h3">{`code: ${gameId}`}</Typography>
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
                  {...(isAuthor
                    ? {
                        secondaryAction: (
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
                        ),
                      }
                    : {})}
                >
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText primary={memberName} />
                </ListItem>
              ))}
            </List>
          )}
        </FetchedComponent>
        {anyIsPending(deleteMemberResponse) && <Loading />}
      </Card>
      {joinTeamResponse.data.memberKey ? (
        member.team ? (
          <Typography>{`You are on team "${member.team}"`}</Typography>
        ) : timedTeam.data.started ? (
          <Typography>{`Time left: ${timeLeft} seconds`}</Typography>
        ) : (
          <Typography>Waiting for game to begin...</Typography>
        )
      ) : timedTeam.data.finished ? (
        <Typography>Teams have already been assigned</Typography>
      ) : anyIsIdle(joinTeamResponse) ? (
        <Flex columnGap="8px">
          <TextField
            label="User"
            value={userText}
            onChange={(e) => {
              setUserText(e.target.value);
            }}
          />
          <Button
            onClick={async () => {
              const { response } = await fetchJoinTeam({
                id: gameId,
                user: userText,
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
      ) : anyIsPending(joinTeamResponse) ? (
        <Loading />
      ) : anyIsError(joinTeamResponse) ? (
        <Typography color="red">{errorMessage(joinTeamResponse)}</Typography>
      ) : null}
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
        {(data) => <Typography>Teams Are Assigned!</Typography>}
      </FetchedComponent>
    </Flex>
  );
};
