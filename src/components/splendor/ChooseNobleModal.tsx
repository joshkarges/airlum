import { makeStyles } from "tss-react/mui";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { useCallback, useEffect, useMemo, useState, VFC } from "react";
import { useDispatch } from "react-redux";
import { Noble as NobleModel } from "../../models/Splendor";
import { useGame, useGameState } from "../../redux/selectors";
import { chooseNoble, skipNobleChoice } from "../../redux/slices/game";
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

  const affordableNobles = useMemo(
    () => getAffordableNobles(game, player),
    [game, player]
  );

  const onNobleClick = useCallback(
    (noble: NobleModel) => {
      dispatch(chooseNoble(noble));
      dispatch(setGameState("play"));
      setIsOpen(false);
    },
    [dispatch]
  );

  useEffect(() => {
    if (gameState !== GameState.chooseNobles) {
      setIsOpen(false);
      return;
    }
    if (!affordableNobles.length) {
      // Nothing to choose, so release the turn that was held back for the choice.
      dispatch(skipNobleChoice({ turn: game.turn }));
      dispatch(setGameState("play"));
      return;
    }
    // Only a human with more than one option has a real choice to make.
    if (affordableNobles.length === 1 || !player.isHuman) {
      onNobleClick(affordableNobles[0]);
      return;
    }
    setIsOpen(true);
  }, [
    affordableNobles,
    dispatch,
    game.turn,
    gameState,
    onNobleClick,
    player.isHuman,
  ]);

  return (
    <Dialog open={isOpen}>
      <DialogTitle>Choose A Noble</DialogTitle>
      <DialogContent className={classes.dialog}>
        {affordableNobles.map((noble) => (
          <Noble key={noble.id} {...noble} onClick={onNobleClick} />
        ))}
      </DialogContent>
    </Dialog>
  );
};
