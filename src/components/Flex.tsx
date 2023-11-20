import { Box, BoxProps } from "@mui/material";
import { makeStyles } from "@mui/styles";
import classNames from "classnames";
import { PropsWithChildren } from "react";

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
}), {name: 'flex'});

type FlexProps = PropsWithChildren & BoxProps;

export const Flex = ({children, ...props}: FlexProps) => {
  const classes = useStyles();
  return (
    <Box {...props} className={classNames(classes.root, props.className)}>
      {children}
    </Box>
  );
};