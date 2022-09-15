import { makeStyles } from "tss-react/mui";
import { VFC } from "react";
import { Game } from "../../models/Splendor";
import { TableCards } from "./TableCards";
import { TableCoins } from "./TableCoins";
import { TableNobles } from "./TableNobles";

const useStyles = makeStyles()((theme) => ({
  tableContainer: {
    display: "flex",
    alignItems: "center",
  },
}));

type TableProps = {
  game: Game;
};
export const Table: VFC<TableProps> = ({ game }) => {
  const { classes } = useStyles();
  return (
    <div className={classes.tableContainer}>
      <TableCards />
      <TableCoins />
      <TableNobles nobles={game.nobles} />
    </div>
  );
};
