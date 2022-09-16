import { Button, ButtonGroup, Dialog, DialogTitle } from "@mui/material";
import { useEffect, useState, VFC } from "react";
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
  const { idx: playerIndicesWithMostPoints, points: mostPoints } =
    game.players.reduce(
      (agg, player, i) => {
        if (player.points >= agg.points) {
          agg.idx.push(i);
          agg.points = player.points;
        }
        return agg;
      },
      { idx: [] as number[], points: 0 }
    );
  const isGameOver = playerIndex === 0 && mostPoints >= 15;

  useEffect(() => {
    if (isGameOver) setIsOpen(true);
  }, [isGameOver]);

  return (
    <Dialog open={isOpen && isGameOver} onClose={() => setIsOpen(false)}>
      <DialogTitle>{`Player${
        playerIndicesWithMostPoints.length > 1 ? "s" : ""
      } ${oxfordCommaList(
        playerIndicesWithMostPoints.map((idx) => `#${idx}`)
      )} Won!`}</DialogTitle>
      <ButtonGroup>
        <Button variant="outlined" onClick={() => setIsOpen(false)}>
          Close
        </Button>
        <Button
          onClick={() => {
            setIsOpen(false);
            dispatch(setupGameAction(2));
          }}
        >
          Start New Game
        </Button>
      </ButtonGroup>
    </Dialog>
  );
};
