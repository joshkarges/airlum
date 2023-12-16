import {
  ExchangeEvent,
  User,
} from "../models/functions";
import firebase from "firebase/compat/app";
import { useDispatch } from "react-redux";
import { useUser } from "../redux/selectors";
import { setUser } from "../redux/slices/user";
import {
  anyIsIdle,
  useDispatcher,
  useReduxState,
} from "../utils/fetchers";
import { useEffect, useMemo, useState } from "react";
import { Flex } from "../components/Flex";
import _ from "lodash";
import { FetchedComponent } from "../components/fetchers/FetchedComponent";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  TextField,
  Theme,
  Typography,
} from "@mui/material";
import { SignIn } from "../components/SignIn";
import moment from "moment";
import { makeStyles } from "@mui/styles";
import { MultiTextField } from "../components/inputs/MultiTextField";
import { Formik, useField } from "formik";
import { ExpandMore } from "@mui/icons-material";
import { validateEmail } from "../utils/utils";
import { deleteExchangeEventAction, getAllExchangeEventsAction, updateExchangeEventAction } from "../redux/slices/exchangeEvent";

const useStyles = makeStyles((theme: Theme) => ({
  h5: {
    "&&": {
      ...theme.typography.h5,
    },
  },
  subtitle1: {
    ...theme.typography.subtitle1,
  },
  card: {
    maxWidth: 400,
  },
}));

type TitleInputProps = {
  canEdit: boolean;
  fieldName: string;
  variant?: "h5" | "subtitle1";
  multiline?: boolean;
  label?: string;
  type?: React.HTMLInputTypeAttribute;
  toInputValue?: (value: any) => string | number;
  toDisplayValue?: (value: any) => string | number;
};

const EditableField = ({
  canEdit,
  fieldName,
  variant,
  multiline,
  label,
  type,
  toInputValue = _.identity,
  toDisplayValue = _.identity,
}: TitleInputProps) => {
  const classes = useStyles();
  const [inputProps, metadata] = useField(fieldName);
  return canEdit ? (
    <TextField
      inputProps={
        variant
          ? {
              className: classes[variant],
            }
          : undefined
      }
      label={label}
      onClick={(evt) => evt.stopPropagation()}
      multiline={multiline}
      fullWidth
      variant="standard"
      type={type}
      {...inputProps}
      value={toInputValue(inputProps.value)}
      error={!!metadata.error}
    />
  ) : (
    <Typography variant={variant}>
      {toDisplayValue(inputProps.value)}
    </Typography>
  );
};

const formatTimestampMMDDYYYY = (timestamp: number) =>
  moment(timestamp).format("MM/DD/YYYY");

const formatTimestampYYYY_MM_DD = (timestamp: number) =>
  moment(timestamp).format("YYYY-MM-DD");

export const ExchangeEventCard = ({
  name,
  description,
  users,
  date,
  updatedAt,
  id,
}: ExchangeEvent) => {
  const classes = useStyles();
  const [editMode, setEditMode] = useState(false);
  const userEmails = useMemo(() => _.keys(users), [users]);
  const [expandUsers, setExpandUsers] = useState(false);
  const updateExchangeEvent = useDispatcher(updateExchangeEventAction);
  const deleteExchangeEvent = useDispatcher(deleteExchangeEventAction);
  return (
    <Formik
      initialValues={{
        name,
        description,
        date,
        users: userEmails,
      }}
      onSubmit={({name, description, date, users: userValues}) => {
        updateExchangeEvent({
          name,
          description,
          date,
          users: _.mapValues(_.keyBy(userValues), email => ({email, joinedAt: users[email]?.joinedAt ?? 0, uid: '' })),
          id
        });
        setEditMode(false);
      }}
    >
      {(props) => (
        <Card className={classes.card}>
          <CardContent>
            <Flex flexDirection="column" gap="16px">
              <EditableField
                variant="h5"
                fieldName="name"
                canEdit={editMode}
                label="Event Name"
              />
              <EditableField
                variant="subtitle1"
                fieldName={"description"}
                canEdit={editMode}
                multiline
                label="Description"
              />
              <Accordion
                expanded={expandUsers}
                onChange={(evt, expanded) => setExpandUsers(expanded)}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                >{`${userEmails.length} users`}</AccordionSummary>
                <AccordionDetails>
                  {editMode ? (
                    <MultiTextField
                    label="Users"
                    placeholder="Enter an email..."
                      value={props.values.users}
                      onChange={(e, newValue) => {
                        props.setFieldValue("users", newValue);
                      }}
                      options={[]}
                      freeSolo
                      confirmKeys={[",", "Space"]}
                      helperText={
                        props.values.users.every(validateEmail)
                          ? "Enter user email addresses"
                          : `${props.values.users.find(
                              (email) => !validateEmail(email)
                            )} is not a valid email address`
                      }
                      error={!props.values.users.every(validateEmail)}
                    />
                  ) : (
                    <Flex gap="8px" flexWrap="wrap">
                      {_.map(users, (user) => (
                        <Chip label={user.email} />
                      ))}
                    </Flex>
                  )}
                </AccordionDetails>
              </Accordion>
              <EditableField
                fieldName="date"
                canEdit={editMode}
                label="Event date"
                toInputValue={formatTimestampYYYY_MM_DD}
                toDisplayValue={formatTimestampMMDDYYYY}
                type="date"
              />
              <Typography>{`Last updated: ${moment(updatedAt).format(
                "MM/DD/YYYY h:mm a"
              )}`}</Typography>
            </Flex>
          </CardContent>
            <CardActions>
              {editMode ? (
                <Flex justifyContent="space-between" flexGrow={1}>
                  <Button type="submit" variant="contained" onClick={props.submitForm}>Save</Button>
                  <Button onClick={() => {
                    setEditMode(false);
                  }} variant="outlined">Cancel</Button>
                </Flex>
              ) : (
                <Flex justifyContent="space-between" flexGrow={1}>
                  <Button color="error" variant="outlined" onClick={() => deleteExchangeEvent({exchangeEventId: id})}>Delete</Button>
                  <Button
                    onClick={() => {
                      setEditMode(true);
                      setExpandUsers(true);
                    }}
                    variant="outlined"
                  >
                    Edit
                  </Button>
                </Flex>
              )}
            </CardActions>
        </Card>
      )}
    </Formik>
  );
};

export const ExchangeEventListPage = () => {
  const dispatch = useDispatch();
  const user = useUser();
  const [exchangeEventsResource, fetchExchangeEvents] = useReduxState('exchangeEvent', getAllExchangeEventsAction);

  useEffect(() => {
    const unregister = firebase.auth().onAuthStateChanged((authUser) => {
      if (!!authUser) {
        dispatch(setUser(authUser.toJSON() as User));
      }
    });
    return () => {
      unregister();
    };
  }, [dispatch]);

  useEffect(() => {
    if (user?.uid && anyIsIdle(exchangeEventsResource)) {
      fetchExchangeEvents({ uid: user.uid });
    }
  }, [exchangeEventsResource, fetchExchangeEvents, user]);

  return !!user ? (
    <FetchedComponent resource={exchangeEventsResource}>
      {(exchangeEventsMap) => {
        return (
          <Flex flexWrap="wrap" gap="32px" p="32px">
            {_.map(exchangeEventsMap, (exchangeEventResource, exchangeEventId) => {
              return (
                <FetchedComponent resource={exchangeEventResource}>
                  {exchangeEvent => <ExchangeEventCard {...exchangeEvent} key={exchangeEventId} />}
                </FetchedComponent>
              );
            })}
          </Flex>
        );
      }}
    </FetchedComponent>
  ) : (
    <Flex>
      <SignIn signInSuccessUrl={window.location.href} />
    </Flex>
  );
};
