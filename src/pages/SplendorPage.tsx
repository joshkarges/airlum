import { makeStyles } from "tss-react/mui";
import React, { useEffect, useState /* useRef, useMemo */ } from "react";
import { OnDeck } from "../components/splendor/OnDeck";
import { Table } from "../components/splendor/Table";
import { useGame } from "../redux/selectors";
import { runGame, setupGame, Strategy } from "../utils/splendor";
import { Playermat } from "../components/splendor/PlayerMat";

const useStyles = makeStyles()((theme) => ({
  container: {
    background: "rgb(245, 245, 245)",
  },
  tableAndOnDeck: {
    display: "flex",
  },
}));

export const SplendorPage = () => {
  const { classes } = useStyles();
  // const ref = useRef([] as string[]);
  // const [gameLogs, setGameLogs] = useState<string[]>([]);
  const game = useGame();
  // const gameLogs = useMemo(() => runGame(4), []);

  // useEffect(() => {
  //   if (!gameLogs.length) {
  //     setGameLogs(runGame(4, Strategy.AlphaBeta));
  //   }
  // }, [gameLogs.length]);

  return (
    <div className={classes.container}>
      <div className={classes.tableAndOnDeck}>
        <Table game={game} />
        <OnDeck />
        {/* {gameLogs.map((log, i) => (
        <React.Fragment key={i}>
          <div>{log}</div>
          <br />
        </React.Fragment>
      ))} */}
      </div>
      <Playermat />
    </div>
  );
};
