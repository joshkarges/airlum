import { makeStyles } from "tss-react/mui";
import { Card as MuiCard } from "@mui/material";
import { VFC } from "react";
import { useActionOnDeck, useGame } from "../../redux/selectors";
import { canAffordCard, getPlayerIndex } from "../../utils/splendor";
import { Coin } from "./Coin";
import { Card as CardModel, Color } from "../../models/Splendor";
import _ from "lodash";
import { Card } from "./Card";
import { Noble } from "./Noble";
import { useDispatch } from "react-redux";
import { prepBuyReserveCard } from "../../redux/slices/actionOnDeck";

const useStyles = makeStyles()((theme) => ({
  card: {
    minWidth: 300,
    minHeight: 300,
    margin: theme.spacing(4),
    padding: theme.spacing(2),
    width: "fit-content",
    display: "flex",
  },
  coinCardsContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  coinsContainer: {
    display: "flex",
    gap: theme.spacing(1),
  },
  cardsContainer: {
    display: "flex",
    gap: theme.spacing(1),
  },
  stackedCardGroup: {
    margin: theme.spacing(2),
  },
  stackedCard: {
    height: 40,
    overflow: "hidden",
    "& > .MuiCard-root": {
      margin: 0,
    },
    "&:last-child": {
      overflow: "visible",
    },
  },
}));

type PlayerMatProps = {};
export const Playermat: VFC<PlayerMatProps> = () => {
  const { classes } = useStyles();
  const actionOnDeck = useActionOnDeck();
  const game = useGame();
  const dispatch = useDispatch();
  const playerIndex = getPlayerIndex(game);
  const player = game.players[playerIndex];

  const onReservedCardClick = (card: CardModel) => {
    if (actionOnDeck.type !== "none") return;
    if (!canAffordCard(player, card)) return;
    dispatch(prepBuyReserveCard(card));
  };

  const boughtByColor = _.groupBy(player.bought, "color");

  return (
    <MuiCard className={classes.card}>
      <div>
        <div className={classes.cardsContainer}>
          {_.map(player.coins, (count: number, color: Color) => {
            const cards = boughtByColor[color];
            return (
              <div className={classes.coinCardsContainer}>
                <Coin count={count} color={color} />
                <div className={classes.stackedCardGroup}>
                  {cards?.map((card) => (
                    <div className={classes.stackedCard}>
                      <Card {...card} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        {player.nobles.map((noble) => (
          <Noble {...noble} />
        ))}
      </div>
      <div>
        {player.reserved.map((card, i) => (
          <Card
            {...card}
            onClick={onReservedCardClick}
            placeholder={card.id === actionOnDeck.card?.id}
            sx={{
              transform: `rotateZ(-90deg)translate(${34 + 44 * i}px, 10px)`,
            }}
          />
        ))}
      </div>
    </MuiCard>
  );
};
