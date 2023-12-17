import * as Yup from "yup";
import { ExchangeEvent, User } from "../models/functions";
import firebase from "firebase/compat/app";
import { useDispatch } from "react-redux";
import { useUser } from "../redux/selectors";
import { setUser } from "../redux/slices/user";
import { anyIsIdle, useDispatcher, useReduxState } from "../utils/fetchers";
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
  IconButton,
  TextField,
  Theme,
  Typography,
} from "@mui/material";
import { SignIn } from "../components/SignIn";
import moment from "moment";
import { makeStyles } from "@mui/styles";
import { MultiTextField } from "../components/inputs/MultiTextField";
import { Formik, useField } from "formik";
import { AddBox, ArrowForward, ExpandMore } from "@mui/icons-material";
import {
  createExchangeEventAction,
  deleteExchangeEventAction,
  getAllExchangeEventsAction,
  updateExchangeEventAction,
} from "../redux/slices/exchangeEvent";
import classNames from "classnames";

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
    width: 400,
    minHeight: 300,
  },
  createCard: {
    height: 300,
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
      helperText={metadata.error ? metadata.error : undefined}
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

type ExchangeEventCardProps = {
  exchangeEvent: Pick<
    ExchangeEvent,
    "name" | "description" | "users" | "date" | "id" | "updatedAt"
  >;
  initialEditMode?: boolean;
  onCancel?: () => void;
  onSave?: () => void;
};

export const ExchangeEventCard = ({
  initialEditMode = false,
  onCancel = _.noop,
  onSave = _.noop,
  exchangeEvent: { updatedAt, id, ...exchangeMetadata },
}: ExchangeEventCardProps) => {
  const classes = useStyles();
  const { name, description, users, date } = exchangeMetadata;
  const [editMode, setEditMode] = useState(initialEditMode);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const userEmails = useMemo(() => _.keys(users), [users]);
  const [expandUsers, setExpandUsers] = useState(false);
  const updateExchangeEvent = useDispatcher(updateExchangeEventAction);
  const createExchangeEvent = useDispatcher(createExchangeEventAction);
  const deleteExchangeEvent = useDispatcher(deleteExchangeEventAction);
  const eventMetadataFormValues = useMemo(
    () => ({
      eventName: name,
      description,
      date,
      users: userEmails,
    }),
    [name, description, date, userEmails]
  );
  return (
    <Formik
      initialValues={eventMetadataFormValues}
      onSubmit={({ eventName: name, description, date, users: userValues }) => {
        const upsertFn: any = id ? updateExchangeEvent : createExchangeEvent;
        upsertFn({
          name,
          description,
          date,
          users: _.mapValues(_.keyBy(userValues), (email) => ({
            email,
            joinedAt: users[email]?.joinedAt ?? 0,
            uid: "",
          })),
          ...(id ? { id } : {}),
        });
        setEditMode(false);
      }}
      validationSchema={Yup.object({
        eventName: Yup.string().required("Required"),
        description: Yup.string(),
        date: Yup.number(),
        users: Yup.array()
          .of(
            Yup.string().test({
              name: "validate-email",
              test: (value, context) => {
                if (!Yup.string().email().isValidSync(value)) {
                  return context.createError({
                    message: `${value} is not a valid email address`,
                  });
                }
                return true;
              },
            })
          )
          .max(50, "Max 50 users"),
      })}
    >
      {(props) => (
        <Card className={classes.card} elevation={3}>
          <CardContent>
            <Flex flexDirection="column" gap="16px">
              <Flex justifyContent="space-between" alignItems="center">
                <EditableField
                  variant="h5"
                  fieldName="eventName"
                  canEdit={editMode}
                  label="Event Name"
                />
                {!editMode && (
                  <a href={`/christmas-list/${id}`}>
                    <IconButton>
                      <ArrowForward />
                    </IconButton>
                  </a>
                )}
              </Flex>
              <EditableField
                variant="subtitle1"
                fieldName="description"
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
                        props.errors.users
                          ? props.errors.users
                              .toString()
                              .split(",")
                              .filter(Boolean)[0]
                          : "Enter user email addresses"
                      }
                      error={!!props.errors.users}
                    />
                  ) : (
                    <Flex gap="8px" flexWrap="wrap">
                      {_.map(users, (user) => (
                        <Chip label={user.email} key={user.email} />
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
              <Typography>{`Last updated: ${moment(
                updatedAt
              ).calendar()}`}</Typography>
            </Flex>
          </CardContent>
          <CardActions>
            <Flex justifyContent="space-between" flexGrow={1}>
              {editMode ? (
                <>
                  <Button
                    type="submit"
                    variant="contained"
                    onClick={() => {
                      props.submitForm();
                      onSave();
                    }}
                    disabled={
                      !_.isEmpty(props.errors) ||
                      _.isEqual(props.values, eventMetadataFormValues)
                    }
                  >
                    {id ? "Save" : "Create"}
                  </Button>
                  <Button
                    onClick={() => {
                      if (id) setEditMode(false);
                      onCancel();
                    }}
                    variant="outlined"
                  >
                    Cancel
                  </Button>
                </>
              ) : confirmingDelete && id ? (
                <>
                  <Button
                    color="error"
                    variant="contained"
                    onClick={() => deleteExchangeEvent({ exchangeEventId: id })}
                  >
                    Delete
                  </Button>
                  <Typography>Are you sure?</Typography>
                  <Button
                    onClick={() => {
                      setConfirmingDelete(false);
                    }}
                    variant="outlined"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    color="error"
                    variant="outlined"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    Delete
                  </Button>
                  <Button
                    onClick={() => {
                      setEditMode(true);
                      setExpandUsers(true);
                    }}
                    variant="outlined"
                  >
                    Edit
                  </Button>
                </>
              )}
            </Flex>
          </CardActions>
        </Card>
      )}
    </Formik>
  );
};

export const ExchangeEventListPage = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const user = useUser();
  const [exchangeEventsResource, fetchExchangeEvents] = useReduxState(
    "exchangeEvent",
    getAllExchangeEventsAction
  );
  const [creatingEvent, setCreatingEvent] = useState(false);

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
          <Flex flexWrap="wrap" gap="32px" p="32px" alignItems="flex-start">
            {_.map(
              exchangeEventsMap,
              (exchangeEventResource, exchangeEventId) => {
                return (
                  <FetchedComponent
                    resource={exchangeEventResource}
                    key={exchangeEventId}
                  >
                    {(exchangeEvent) => (
                      <ExchangeEventCard
                        exchangeEvent={exchangeEvent}
                        key={exchangeEventId}
                      />
                    )}
                  </FetchedComponent>
                );
              }
            )}
            {creatingEvent ? (
              <ExchangeEventCard
                exchangeEvent={{
                  name: "",
                  description: "",
                  date: moment().add(1, "w").toDate().getTime(),
                  users: {},
                  id: "",
                  updatedAt: Date.now(),
                }}
                initialEditMode={true}
                onCancel={() => setCreatingEvent(false)}
                onSave={() => setCreatingEvent(false)}
              />
            ) : (
              <Card
                className={classNames(classes.card, classes.createCard)}
                elevation={3}
              >
                <Flex gap="16px" height="100%" alignItems="stretch">
                  <Button
                    onClick={() => {
                      setCreatingEvent(true);
                    }}
                    fullWidth
                  >
                    <Flex
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      flexGrow={1}
                    >
                      <AddBox />
                      <Typography variant="h5">Create new event</Typography>
                    </Flex>
                  </Button>
                </Flex>
              </Card>
            )}
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