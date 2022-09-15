import { makeStyles } from 'tss-react/mui';
import { VFC } from "react";
import { Game } from "../../models/Splendor";
import { Noble } from "./Noble";

const useStyles = makeStyles()((theme) => ({
  noblesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    margin: 16,
  },
}));

type TableNoblesProps = {
  nobles: Game["nobles"];
};
export const TableNobles: VFC<TableNoblesProps> = ({ nobles }) => {
  const { classes } = useStyles();
  return (
    <div className={classes.noblesContainer}>
      {nobles.map((noble) => (
        <Noble key={noble.id} {...noble} />
      ))}
    </div>
  );
};
