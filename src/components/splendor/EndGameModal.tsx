import { Button, ButtonGroup, Dialog, DialogTitle } from "@mui/material";
import _ from "lodash";
import { useCallback, useEffect, useState, VFC } from "react";
import { useDispatch } from "react-redux";
import { useGame } from "../../redux/selectors";
import { setupGameAction } from "../../redux/slices/game";
import { getPlayerIndex } from "../../utils/splendor";
import { oxfordCommaList } from "../../utils/utils";

type EndGameModalProps = {};
export const EndGameModal: VFC<EndGameModalProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const game = useGame();
  const dispatch = useDispatch();
  const playerIndex = getPlayerIndex(game);
  // game.players[1].points = 16;
  const mostPoints = game.players.reduce((agg, player, i) => {
    if (player.points >= agg) {
      agg = player.points;
    }
    return agg;
  }, 0);
  const playerIndicesWithMostPoints = _.range(0, game.players.length).filter(
    (i) => game.players[i].points === mostPoints
  );
  const isGameOver = playerIndex === 0 && mostPoints >= 15;

  const closeAndStartNewGame = useCallback(() => {
    setIsOpen(false);
    dispatch(setupGameAction(2));
  }, [dispatch]);

  useEffect(() => {
    if (isGameOver) setIsOpen(true);
  }, [isGameOver]);

  return (
    <Dialog open={isOpen && isGameOver} onClose={closeAndStartNewGame}>
      <DialogTitle>{`Player${
        playerIndicesWithMostPoints.length > 1 ? "s" : ""
      } ${oxfordCommaList(
        playerIndicesWithMostPoints.map((idx) => `#${idx}`)
      )} Won! (${game.turn / game.players.length} moves)`}</DialogTitle>
      <ButtonGroup>
        <Button onClick={closeAndStartNewGame}>Start New Game</Button>
      </ButtonGroup>
    </Dialog>
  );
};
