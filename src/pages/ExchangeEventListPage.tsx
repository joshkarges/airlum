import * as Yup from "yup";
import { checkHealth } from "../api/ChristmasListApi";
import { ExchangeEvent } from "../models/functions";
import { useUser } from "../redux/selectors";
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
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Slider,
  Switch,
  TextField,
  Theme,
  Typography,
} from "@mui/material";
import moment from "moment";
import { makeStyles } from "@mui/styles";
import { MultiTextField } from "../components/inputs/MultiTextField";
import { Formik, useField } from "formik";
import {
  AddBox,
  ArrowForward,
  CalendarMonth,
  ExpandMore,
  Group,
  Tune,
} from "@mui/icons-material";
import {
  createExchangeEventAction,
  deleteExchangeEventAction,
  emptyExchangeEvent,
  getAllExchangeEventsAction,
  updateExchangeEventAction,
} from "../redux/slices/exchangeEvent";
import classNames from "classnames";
import { useQuery } from "../utils/routing";

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
  fromInputValue?: (value: string | number) => any;
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
  fromInputValue = _.identity,
}: TitleInputProps) => {
  const classes = useStyles();
  const [inputProps, metadata, helpers] = useField(fieldName);
  const value = toDisplayValue(inputProps.value);
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
      {...(fromInputValue
        ? {
            onChange: (evt) =>
              helpers.setValue(fromInputValue(evt.target.value)),
          }
        : {})}
      value={toInputValue(inputProps.value)}
      error={!!metadata.error}
      helperText={metadata.error ? metadata.error : undefined}
    />
  ) : value !== "" ? (
    <Flex gap="8px">
      {fieldName === "date" && (
        <>
          <CalendarMonth />
          <Typography fontWeight={500}>Event Date:</Typography>
        </>
      )}
      <Typography variant={variant}>{value}</Typography>
    </Flex>
  ) : null;
};

const formatTimestampMMDDYYYY = (timestamp: number) =>
  moment(timestamp).format("MM/DD/YYYY");

const formatTimestampYYYY_MM_DD = (timestamp: number) =>
  moment(timestamp).format("YYYY-MM-DD");

type ExchangeEventCardProps = {
  exchangeEvent: ExchangeEvent;
  userOptions: string[];
  initialEditMode?: boolean;
  onCancel?: () => void;
  onSave?: () => void;
};

export const ExchangeEventCard = ({
  initialEditMode = false,
  onCancel = _.noop,
  onSave = _.noop,
  exchangeEvent: { updatedAt, id, ...exchangeMetadata },
  userOptions,
}: ExchangeEventCardProps) => {
  const classes = useStyles();
  const user = useUser();
  const {
    name,
    description,
    users: userEmails,
    date,
    options,
  } = exchangeMetadata;
  const [editMode, setEditMode] = useState(initialEditMode);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [expandUsers, setExpandUsers] = useState(false);
  const updateExchangeEvent = useDispatcher(updateExchangeEventAction);
  const createExchangeEvent = useDispatcher(createExchangeEventAction);
  const deleteExchangeEvent = useDispatcher(deleteExchangeEventAction);
  const isAuthor = user?.uid === exchangeMetadata.author.uid;
  const eventMetadataFormValues = useMemo(
    () => ({
      eventName: name,
      description,
      date,
      users: userEmails,
      options,
    }),
    [name, description, date, userEmails, options]
  );
  return (
    <Formik
      initialValues={eventMetadataFormValues}
      onSubmit={({ eventName: name, description, date, users }) => {
        const upsertFn: any = id ? updateExchangeEvent : createExchangeEvent;
        upsertFn({
          name,
          description,
          date,
          users,
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
                  <a href={`/gift-exchange-event/${id}`}>
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
              <Flex flexDirection="column">
                <Accordion
                  expanded={expandUsers}
                  onChange={(evt, expanded) => setExpandUsers(expanded)}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Flex gap="8px">
                      <Group />
                      <Typography>{`${userEmails.length} users${
                        isAuthor ? " (including you)" : ""
                      }`}</Typography>
                    </Flex>
                  </AccordionSummary>
                  <AccordionDetails>
                    {editMode ? (
                      <MultiTextField
                        label="Users"
                        placeholder="Enter an email..."
                        value={props.values.users}
                        onChange={(e, newValue) => {
                          props.setFieldValue("users", newValue);
                        }}
                        filterSelectedOptions
                        options={userOptions}
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
                        filterOptions={(options, { inputValue }) =>
                          options.filter((option) => {
                            const inputVal = inputValue.toLowerCase();
                            const optionVal = option.toLowerCase();
                            return optionVal.includes(inputVal);
                          })
                        }
                      />
                    ) : (
                      <Flex gap="8px" flexWrap="wrap">
                        {_.map(
                          Array.from(
                            new Set([
                              ...(!isAuthor
                                ? [exchangeMetadata.author.email]
                                : []),
                              ...userEmails,
                            ])
                          ),
                          (user) => (
                            <Chip label={user} key={user} />
                          )
                        )}
                      </Flex>
                    )}
                  </AccordionDetails>
                </Accordion>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Flex gap="8px">
                      <Tune />
                      <Typography>Options</Typography>
                    </Flex>
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            disabled={!editMode}
                            checked={props.values.options.selfListRequired}
                            onChange={(evt, checked) =>
                              props.setFieldValue(
                                "options.selfListRequired",
                                checked
                              )
                            }
                          />
                        }
                        label="Every user must make a list"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            disabled={!editMode}
                            checked={props.values.options.extraListsAllowed}
                            onChange={(evt, checked) =>
                              props.setFieldValue(
                                "options.extraListsAllowed",
                                checked
                              )
                            }
                          />
                        }
                        label="Extra Lists are allowed"
                      />
                      <Flex flexDirection="column">
                        <Typography>Maximum number of extra lists</Typography>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs>
                            <Slider
                              disabled={!editMode}
                              value={props.values.options.maxExtraLists}
                              onChange={(evt, value) =>
                                props.setFieldValue(
                                  "options.maxExtraLists",
                                  value
                                )
                              }
                              step={1}
                              min={1}
                              max={50}
                            />
                          </Grid>
                          <Grid item>
                            <TextField
                              disabled={!editMode}
                              variant="standard"
                              type="number"
                              value={props.values.options.maxExtraLists}
                              onChange={(evt) =>
                                props.setFieldValue(
                                  "options.maxExtraLists",
                                  +evt.target.value
                                )
                              }
                              onBlur={(evt) => {
                                props.setFieldValue(
                                  "options.maxExtraLists",
                                  Math.max(
                                    Math.min(
                                      props.values.options.maxExtraLists,
                                      50
                                    ),
                                    1
                                  )
                                );
                              }}
                              inputProps={{
                                step: 1,
                                min: 1,
                                max: 50,
                                type: "number",
                                "aria-labelledby": "input-slider",
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Flex>
                      <Flex flexDirection="column">
                        <Typography>
                          Maximum number of ideas per list
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs>
                            <Slider
                              disabled={!editMode}
                              value={props.values.options.maxIdeasPerList}
                              onChange={(evt, value) =>
                                props.setFieldValue(
                                  "options.maxIdeasPerList",
                                  value
                                )
                              }
                              step={1}
                              min={1}
                              max={50}
                            />
                          </Grid>
                          <Grid item>
                            <TextField
                              disabled={!editMode}
                              variant="standard"
                              type="number"
                              value={props.values.options.maxIdeasPerList}
                              onChange={(evt) =>
                                props.setFieldValue(
                                  "options.maxIdeasPerList",
                                  +evt.target.value
                                )
                              }
                              onBlur={(evt) => {
                                props.setFieldValue(
                                  "options.maxIdeasPerList",
                                  Math.max(
                                    Math.min(
                                      props.values.options.maxIdeasPerList,
                                      50
                                    ),
                                    1
                                  )
                                );
                              }}
                              inputProps={{
                                step: 1,
                                min: 1,
                                max: 50,
                                type: "number",
                                "aria-labelledby": "input-slider",
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Flex>
                    </FormGroup>
                  </AccordionDetails>
                </Accordion>
              </Flex>
              <EditableField
                fieldName="date"
                canEdit={editMode}
                label="Event date"
                toInputValue={formatTimestampYYYY_MM_DD}
                toDisplayValue={formatTimestampMMDDYYYY}
                fromInputValue={(dateStr) => moment(dateStr).toDate().getTime()}
                type="date"
              />
              <Typography>{`Last updated: ${moment(
                updatedAt
              ).calendar()}`}</Typography>
            </Flex>
          </CardContent>
          {isAuthor && (
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
                      onClick={() =>
                        deleteExchangeEvent({ exchangeEventId: id })
                      }
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
          )}
        </Card>
      )}
    </Formik>
  );
};

export const ExchangeEventListPage = () => {
  const classes = useStyles();
  const user = useUser();
  const queryParams = useQuery();
  const [exchangeEventsResource, fetchExchangeEvents] = useReduxState(
    "exchangeEvent",
    getAllExchangeEventsAction
  );
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Fetch exchange events.
  useEffect(() => {
    if (user?.uid && anyIsIdle(exchangeEventsResource)) {
      fetchExchangeEvents({ uid: user.uid });
    }
  }, [exchangeEventsResource, fetchExchangeEvents, user]);

  return (
    <Flex>
      {!!user ? (
        <FetchedComponent resource={exchangeEventsResource}>
          {(exchangeEventsMap) => {
            const userOptions = _.uniq(
              _.flatMap(exchangeEventsMap, (event) => event.data.users)
            );
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
                            userOptions={userOptions}
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
                      ..._.cloneDeep(emptyExchangeEvent),
                      date: moment().add(1, "w").toDate().getTime(),
                      updatedAt: Date.now(),
                    }}
                    userOptions={userOptions}
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
      ) : null}
      {queryParams.get("debug") && (
        <Button
          variant="contained"
          onClick={async () => {
            let result: any = null;
            try {
              result = await checkHealth();
              console.log(`Health: ${result}`);
            } catch (e) {
              console.error(`Health error: ${e}`);
            }
            return result;
          }}
        >
          Health
        </Button>
      )}
    </Flex>
  );
};
