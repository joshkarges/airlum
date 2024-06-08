import { makeStyles } from "tss-react/mui";
import { OnDeck } from "../components/splendor/OnDeck";
import { Table } from "../components/splendor/Table";
import { useGame } from "../redux/selectors";
import { Playermat } from "../components/splendor/PlayerMat";
import { Opponents } from "../components/splendor/Opponents";
import { EndGameModal } from "../components/splendor/EndGameModal";
import { ChooseNobleModal } from "../components/splendor/ChooseNobleModal";
import { useDispatch } from "react-redux";
import { startGameRecord } from "../redux/slices/gameRecord";
import { useEffect, useState } from "react";
import { Button, Dialog, DialogTitle, TextField } from "@mui/material";
import { useFetchedResource, useSelectorWithPrefix } from "../utils/fetchers";
import { writeSplendorGame } from "../api/SplendorApi";
import { FetchedComponent } from "../components/fetchers/FetchedComponent";
import { Formik } from "formik";
import * as Yup from "yup";
import { setGame } from "../redux/slices/game";
import { initialSetUpGameForm, setupGame } from "../utils/splendor";
import { Flex } from "../components/Flex";
import { setShowGameSetup } from "../redux/slices/showGameSetup";

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
  dialog: {
    padding: theme.spacing(2),
  },
}));

export const SplendorPage = () => {
  const { classes } = useStyles();
  const game = useGame();
  const dispatch = useDispatch();
  const showGameSetup = useSelectorWithPrefix("showGameSetup");
  useEffect(() => {
    dispatch(startGameRecord(game));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  return (
    <div className={classes.container}>
      <Dialog open={showGameSetup}>
        <DialogTitle>Setup Game</DialogTitle>
        <Formik
          initialValues={initialSetUpGameForm}
          validationSchema={Yup.object({
            numberOfHumans: Yup.number().required().min(1).max(4),
            numberOfAi: Yup.number()
              .required()
              .min(0)
              .max(3)
              .when(["numberOfHumans"], ([numberOfHumans], schema) => {
                return schema.max(4 - numberOfHumans, "4 Maximum Players");
              }),
          })}
          onSubmit={(values) => {
            dispatch(setShowGameSetup(false));
            const newGame = setupGame(values);
            dispatch(startGameRecord(newGame));
            dispatch(setGame(newGame));
          }}
        >
          {(props) => (
            <>
              <Flex rowGap="8px" flexDirection="column" p="16px" pt={0}>
                <TextField
                  label="Number of AI"
                  value={props.values.numberOfAi}
                  onChange={props.handleChange("numberOfAi")}
                  type="number"
                />
                <TextField
                  label="Number of Humans"
                  value={props.values.numberOfHumans}
                  onChange={props.handleChange("numberOfHumans")}
                  type="number"
                />
              </Flex>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                onClick={() => props.submitForm()}
              >
                Start Game
              </Button>
            </>
          )}
        </Formik>
      </Dialog>
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
