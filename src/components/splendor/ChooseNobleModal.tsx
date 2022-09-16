import { makeStyles } from "tss-react/mui";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { useEffect, useState, VFC } from "react";
import { useDispatch } from "react-redux";
import { Noble as NobleModel } from "../../models/Splendor";
import { useGame, useGameState } from "../../redux/selectors";
import { chooseNoble } from "../../redux/slices/game";
import { GameState, setGameState } from "../../redux/slices/gameState";
import { getAffordableNobles, getPlayerIndex } from "../../utils/splendor";
import { Noble } from "./Noble";

const useStyles = makeStyles()((theme) => ({
  dialog: {
    padding: theme.spacing(2),
    display: "flex",
    gap: theme.spacing(1),
  },
}));

type ChooseNobleModalProps = {};
export const ChooseNobleModal: VFC<ChooseNobleModalProps> = () => {
  const { classes } = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const game = useGame();
  const gameState = useGameState();
  const dispatch = useDispatch();
  const playerIndex = getPlayerIndex(game);
  const player = game.players[playerIndex];

  const affordableNobles = getAffordableNobles(game, player);

  useEffect(() => {
    if (gameState === GameState.chooseNobles) {
      setIsOpen(true);
    }
  }, [gameState]);

  const onNobleClick = (noble: NobleModel) => {
    dispatch(chooseNoble(noble));
    dispatch(setGameState("play"));
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen}>
      <DialogTitle>Choose A Noble</DialogTitle>
      <DialogContent className={classes.dialog}>
        {affordableNobles.map((noble) => (
          <Noble {...noble} onClick={onNobleClick} />
        ))}
      </DialogContent>
    </Dialog>
  );
};
