import { makeStyles } from "tss-react/mui";
import React, { useEffect, useState /* useRef, useMemo */ } from "react";
import { OnDeck } from "../components/splendor/OnDeck";
import { Table } from "../components/splendor/Table";
import { useGame } from "../redux/selectors";
import { runGame, setupGame, Strategy } from "../utils/splendor";
import { Playermat } from "../components/splendor/PlayerMat";
import { Opponents } from "../components/splendor/Opponents";
import { EndGameModal } from "../components/splendor/EndGameModal";
import { useDispatch } from "react-redux";
import { multipleNoblesTest, useTestGameSetup } from "../utils/tests";
import { ChooseNobleModal } from "../components/splendor/ChooseNobleModal";

const useStyles = makeStyles()((theme) => ({
  container: {
    background: "rgb(245, 245, 245)",
    height: "calc(100vh - 64px)",
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

  useTestGameSetup(multipleNoblesTest);

  return (
    <div className={classes.container}>
      <div className={classes.tableAndOnDeck}>
        <Opponents />
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
      <EndGameModal />
      <ChooseNobleModal />
    </div>
  );
};
