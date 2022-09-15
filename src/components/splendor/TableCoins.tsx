import { makeStyles } from "tss-react/mui";
import _ from "lodash";
import { VFC } from "react";
import { useDispatch } from "react-redux";
import { Color } from "../../models/Splendor";
import { useActionOnDeck, useGame } from "../../redux/selectors";
import { prepCoin } from "../../redux/slices/actionOnDeck";
import { Coin } from "./Coin";
import { getNumCoins, getPlayerIndex } from "../../utils/splendor";

const useStyles = makeStyles()((theme) => ({
  coinsContainer: {
    display: "flex",
    gap: 8,
    flexDirection: "column",
    margin: 16,
  },
}));

type TableCoinsProps = {};
export const TableCoins: VFC<TableCoinsProps> = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const actionOnDeck = useActionOnDeck();
  const game = useGame();
  const playerIndex = getPlayerIndex(game);
  const player = game.players[playerIndex];

  const onCoinClick = (color: Color) => {
    if (actionOnDeck.type !== "takeCoins" && actionOnDeck.type !== "none")
      return;
    const numCoinsOnDeck = getNumCoins(actionOnDeck.coins);
    if (numCoinsOnDeck >= 3) return;
    if (actionOnDeck.coins[color] && game.coins[color] < 3) return;
    const hasTwoOfSameColor = _.some(actionOnDeck.coins, (count) => {
      return count >= 2;
    });
    if (hasTwoOfSameColor) return;
    if (getNumCoins(player.coins) + numCoinsOnDeck >= 10) return;
    dispatch(prepCoin(color));
  };

  return (
    <div className={classes.coinsContainer}>
      <Coin
        count={game.coins.yellow - actionOnDeck.coins.yellow}
        color={Color.Yellow}
      />
      <Coin
        count={game.coins.white - actionOnDeck.coins.white}
        color={Color.White}
        onClick={onCoinClick}
      />
      <Coin
        count={game.coins.blue - actionOnDeck.coins.blue}
        color={Color.Blue}
        onClick={onCoinClick}
      />
      <Coin
        count={game.coins.green - actionOnDeck.coins.green}
        color={Color.Green}
        onClick={onCoinClick}
      />
      <Coin
        count={game.coins.red - actionOnDeck.coins.red}
        color={Color.Red}
        onClick={onCoinClick}
      />
      <Coin
        count={game.coins.black - actionOnDeck.coins.black}
        color={Color.Black}
        onClick={onCoinClick}
      />
    </div>
  );
};
