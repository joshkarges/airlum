import { makeStyles } from "tss-react/mui";
import _ from "lodash";
import { VFC } from "react";
import { Card as CardModel, Color } from "../../models/Splendor";
import { Card } from "./Card";
import { useActionOnDeck, useGame } from "../../redux/selectors";
import { prepBuyCard, prepReserveCard } from "../../redux/slices/actionOnDeck";
import { useDispatch } from "react-redux";
import { canAffordCard, getPlayerIndex } from "../../utils/splendor";

const useStyles = makeStyles()((theme) => ({
  tierRow: {
    display: "flex",
  },
}));

type TableCardsProps = {};
export const TableCards: VFC<TableCardsProps> = () => {
  const { classes } = useStyles();
  const actionOnDeck = useActionOnDeck();
  const game = useGame();
  const playerIndex = getPlayerIndex(game);
  const player = game.players[playerIndex];
  const dispatch = useDispatch();

  const onCardClick = (card: CardModel) => {
    if (actionOnDeck.type !== "none") return;
    if (actionOnDeck.card) return;
    if (canAffordCard(player, card)) {
      dispatch(prepBuyCard(card));
    } else {
      dispatch(
        prepReserveCard({ card, yellow: game.coins[Color.Yellow] ? 1 : 0 })
      );
    }
  };

  const tier1 = _.filter(game.table, { tier: "tier1" });
  const tier2 = _.filter(game.table, { tier: "tier2" });
  const tier3 = _.filter(game.table, { tier: "tier3" });
  return (
    <div>
      <div className={classes.tierRow}>
        {tier3.map((card) => (
          <Card
            key={card.id}
            {...card}
            onClick={onCardClick}
            placeholder={card.id === actionOnDeck.card?.id}
          />
        ))}
      </div>
      <div className={classes.tierRow}>
        {tier2.map((card) => (
          <Card
            key={card.id}
            {...card}
            onClick={onCardClick}
            placeholder={card.id === actionOnDeck.card?.id}
          />
        ))}
      </div>
      <div className={classes.tierRow}>
        {tier1.map((card) => (
          <Card
            key={card.id}
            {...card}
            onClick={onCardClick}
            placeholder={card.id === actionOnDeck.card?.id}
          />
        ))}
      </div>
    </div>
  );
};
