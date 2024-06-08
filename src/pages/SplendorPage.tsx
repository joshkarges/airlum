import { makeStyles } from "tss-react/mui";
import { OnDeck } from "../components/splendor/OnDeck";
import { Table } from "../components/splendor/Table";
import { useGame } from "../redux/selectors";
import { Playermat } from "../components/splendor/PlayerMat";
import { Opponents } from "../components/splendor/Opponents";
import { EndGameModal } from "../components/splendor/EndGameModal";
import { ChooseNobleModal } from "../components/splendor/ChooseNobleModal";
import { useDispatch } from "react-redux";
import { startGame } from "../redux/slices/gameRecord";
import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { useFetchedResource, useSelectorWithPrefix } from "../utils/fetchers";
import { writeSplendorGame } from "../api/SplendorApi";
import { FetchedComponent } from "../components/fetchers/FetchedComponent";

const useStyles = makeStyles()((theme) => ({
  container: {
    height: "100vh",
    maxWidth: 1000,
  },
  tableAndOnDeck: {
    background: "rgb(245, 245, 245)",
    display: "flex",
    justifyContent: "space-between",
  },
}));

export const SplendorPage = () => {
  const { classes } = useStyles();
  const game = useGame();
  const dispatch = useDispatch();
  const [setupOpen, setSetupOpen] = useState(true);
  useEffect(() => {
    dispatch(startGame(game));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  return (
    <div className={classes.container}>
      <div className={classes.tableAndOnDeck}>
        <Opponents />
        <Table game={game} />
        <OnDeck />
      </div>
      <Playermat />
      <EndGameModal />
      <ChooseNobleModal />
    </div>
  );
};
