import { Button, ButtonGroup, Dialog, DialogTitle } from "@mui/material";
import _ from "lodash";
import { useCallback, useEffect, useState, VFC } from "react";
import { useDispatch } from "react-redux";
import { useGame } from "../../redux/selectors";
import { setGame } from "../../redux/slices/game";
import { getPlayerIndex, setupGame } from "../../utils/splendor";
import { oxfordCommaList } from "../../utils/utils";
import {
  useFetchedResource,
  useSelectorWithPrefix,
} from "../../utils/fetchers";
import { writeSplendorGame } from "../../api/SplendorApi";
import { endGame, startGame } from "../../redux/slices/gameRecord";
import { FetchedComponent } from "../fetchers/FetchedComponent";

type EndGameModalProps = {};
export const EndGameModal: VFC<EndGameModalProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const game = useGame();
  const dispatch = useDispatch();
  const playerIndex = getPlayerIndex(game);
  const gameRecord = useSelectorWithPrefix("gameRecord");
  const [writeResponse, sendGameToServer] =
    useFetchedResource(writeSplendorGame);
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
    const newGame = setupGame(2);
    dispatch(setGame(newGame));
    dispatch(startGame(newGame));
  }, [dispatch]);

  useEffect(() => {
    if (isGameOver) {
      setIsOpen(true);
      sendGameToServer(gameRecord);
      dispatch(endGame(game));
    }
  }, [dispatch, game, gameRecord, isGameOver, sendGameToServer]);

  useEffect(() => {
    if (gameRecord.endTime > 0) {
      sendGameToServer(gameRecord);
    }
  }, [gameRecord, sendGameToServer]);

  return (
    <Dialog open={isOpen && isGameOver} onClose={closeAndStartNewGame}>
      <DialogTitle>{`Player${
        playerIndicesWithMostPoints.length > 1 ? "s" : ""
      } ${oxfordCommaList(
        playerIndicesWithMostPoints.map((idx) => `#${idx}`)
      )} Won! (${game.turn / game.players.length} moves)`}</DialogTitle>
      <FetchedComponent resource={writeResponse}>
        {(data) => <div>{`Recorded game: ${data}`}</div>}
      </FetchedComponent>
      <ButtonGroup>
        <Button onClick={closeAndStartNewGame}>Start New Game</Button>
      </ButtonGroup>
    </Dialog>
  );
};
