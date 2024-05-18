import { makeStyles } from "tss-react/mui";
import _ from "lodash";
import { VFC } from "react";
import { useDispatch } from "react-redux";
import { Color } from "../../models/Splendor";
import { useActionOnDeck, useGame, useGameState } from "../../redux/selectors";
import { prepCoin } from "../../redux/slices/actionOnDeck";
import { Coin } from "./Coin";
import { getNumCoins } from "../../utils/splendor";
import { GameState } from "../../redux/slices/gameState";

const useStyles = makeStyles()((theme) => ({
  coinsContainer: {
    display: "flex",
    gap: 6,
    flexDirection: "column",
    margin: 4,
  },
}));

type TableCoinsProps = {};
export const TableCoins: VFC<TableCoinsProps> = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const actionOnDeck = useActionOnDeck();
  const game = useGame();
  const gameState = useGameState();

  const onCoinClick = (color: Color) => {
    if (gameState !== GameState.play) return;
    if (actionOnDeck.type !== "takeCoins" && actionOnDeck.type !== "none")
      return;

    // No more that 3 coins.
    const numCoinsOnDeck = -getNumCoins(actionOnDeck.coinCost);
    if (numCoinsOnDeck >= 3) return;

    // Can't take the same color if the stack has less than 4.
    if (actionOnDeck.coinCost[color] && game.coins[color] < 4) return;

    // Can't take more of the same color if you've already got multiple colors.
    const hasDifferentColors =
      _.reduce(
        actionOnDeck.coinCost,
        (uniqueColors, cost) => {
          return uniqueColors + (!!cost ? 1 : 0);
        },
        0
      ) > 1;
    if (hasDifferentColors && actionOnDeck.coinCost[color]) return;

    // No more after taking 2 of the same color.
    const hasTwoOfSameColor = _.some(actionOnDeck.coinCost, (cost) => {
      return -cost >= 2;
    });
    if (hasTwoOfSameColor) return;

    dispatch(prepCoin(color));
  };

  return (
    <div className={classes.coinsContainer}>
      <Coin
        count={game.coins.yellow + Math.min(0, actionOnDeck.coinCost.yellow)}
        color={Color.Yellow}
      />
      <Coin
        count={game.coins.white + Math.min(0, actionOnDeck.coinCost.white)}
        color={Color.White}
        onClick={onCoinClick}
      />
      <Coin
        count={game.coins.blue + Math.min(0, actionOnDeck.coinCost.blue)}
        color={Color.Blue}
        onClick={onCoinClick}
      />
      <Coin
        count={game.coins.green + Math.min(0, actionOnDeck.coinCost.green)}
        color={Color.Green}
        onClick={onCoinClick}
      />
      <Coin
        count={game.coins.red + Math.min(0, actionOnDeck.coinCost.red)}
        color={Color.Red}
        onClick={onCoinClick}
      />
      <Coin
        count={game.coins.black + Math.min(0, actionOnDeck.coinCost.black)}
        color={Color.Black}
        onClick={onCoinClick}
      />
    </div>
  );
};
