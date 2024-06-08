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
import { endGameRecord, startGameRecord } from "../../redux/slices/gameRecord";
import { FetchedComponent } from "../fetchers/FetchedComponent";
import { setShowGameSetup } from "../../redux/slices/showGameSetup";

type EndGameModalProps = {};
export const EndGameModal: VFC<EndGameModalProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const game = useGame();
  const dispatch = useDispatch();
  const playerIndex = getPlayerIndex(game);
  const gameRecord = useSelectorWithPrefix("gameRecord");
  const [writeResponse, sendGameToServer] =
    useFetchedResource(writeSplendorGame);
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
  const [needToSendRecord, setNeedToSendRecord] = useState(false);

  const closeAndStartNewGame = useCallback(() => {
    setIsOpen(false);
    dispatch(setShowGameSetup(true));
  }, [dispatch]);

  useEffect(() => {
    if (isGameOver) {
      setIsOpen(true);
      dispatch(endGameRecord(game));
      setNeedToSendRecord(true);
    }
  }, [dispatch, game, gameRecord, isGameOver, sendGameToServer]);

  useEffect(() => {
    if (needToSendRecord) {
      sendGameToServer(gameRecord);
      setNeedToSendRecord(false);
    }
  }, [needToSendRecord, gameRecord, sendGameToServer]);

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
