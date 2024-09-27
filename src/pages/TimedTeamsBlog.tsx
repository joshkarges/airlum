import { Typography } from "@mui/material";
import timedGameSetupImage from "../assets/timedGameSetup.png";
import timedGameImage from "../assets/timedGame.png";
import { Flex } from "../components/Flex";
import { useStyles } from "./styles";

export const TimedTeamsBlog = () => {
  const classes = useStyles();
  return (
    <>
      <Typography variant="h2" className={classes.header}>
        Timed Teams Blog
      </Typography>
      <div className={classes.bodyContainer}>
        <Typography variant="body1">
          There's many games where all the players work collaboratively except
          for a select few who are trying to sabotage the group. I wanted to
          create a game where everyone is working together, but there's a time
          limit. The game is called Timed Teams, and it's a game where everyone
          is on a team, but players are assigned to a new team after a certain
          amount of time. A good example of this game is from a series of{" "}
          <a href="https://www.youtube.com/watch?v=ryoCH63aE30">
            youtube videos by Harstem
          </a>{" "}
          in StarCraft 2 where players control a single army, and then after 2
          minutes, one person turns into a sabateur.
        </Typography>
        <br />
        <Typography variant="body1">
          This app allows a game author to defined the name of the game, the
          number of teams, and the time limit until teams are assigned.
        </Typography>
        <br />
        <Flex justifyContent="center" flexWrap="wrap">
          <img
            src={timedGameSetupImage}
            alt="screenshot of the timed teams game settings"
            // height={300}
            className={classes.img}
          />
        </Flex>
        <Typography variant="body1">
          This was an exercise in using web-sockets to sync multiple players
          together. Players will immediately see when other players join, edit
          their name, leave the game, when the game starts, and what team
          they're assigned to.
          <br />
          We use firestore snapshots to accomplish this which adds a listener to
          database documents, and whenever the document changes, the client is
          notified.
        </Typography>
        <Flex justifyContent="center" flexWrap="wrap">
          <img
            src={timedGameImage}
            alt="screenshot of the timed teams game waiting to start"
            // height={300}
            className={classes.img}
          />
        </Flex>
        <Typography variant="body1">
          <a href="/timed-teams">Create your own game here!</a>
        </Typography>
        <br />
      </div>
    </>
  );
};
