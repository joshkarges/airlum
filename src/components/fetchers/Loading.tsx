import {
  Box,
  CircularProgress,
  CircularProgressProps,
  LinearProgress,
  LinearProgressProps,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import classNames from "classnames";

const useStyles = makeStyles((theme) => ({
  container: {
    flexGrow: 1,
  },
  progress: {
    flexGrow: 1,
  },
}));

const DefaultCircular = ({ className, ...props }: CircularProgressProps) => {
  return (
    <CircularProgress
      className={classNames(className)}
      variant="indeterminate"
      {...props}
    />
  );
};
const DefaultLinear = ({ className, ...props }: LinearProgressProps) => {
  const classes = useStyles();
  return (
    <LinearProgress
      className={classNames(classes.progress, className)}
      variant="query"
      {...props}
    />
  );
};

type LoadingProps = {
  circular?: boolean;
  className?: string;
} & LinearProgressProps &
  CircularProgressProps;
export const Loading = ({
  circular = false,
  className,
  ...progressProps
}: LoadingProps) => {
  const classes = useStyles();
  const ProgressComponent = circular ? DefaultCircular : DefaultLinear;
  return (
    <Box
      display="flex"
      minHeight="0"
      minWidth="0"
      alignItems="center"
      className={classNames({ [classes.container]: !circular }, className)}
    >
      {<ProgressComponent {...progressProps} />}
    </Box>
  );
};
