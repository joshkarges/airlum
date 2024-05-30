import {
  RemoveCircleOutline,
  ArrowForwardIos,
  ArrowBackIos,
} from "@mui/icons-material";
import {
  Button,
  ButtonGroup,
  Chip,
  Dialog,
  IconButton,
  Paper,
  Theme,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { Fragment, useContext, useMemo, useState } from "react";
import { useExchangeEvent } from "../../redux/selectors";
import { Flex } from "../Flex";
import { ModalContext, ModalType } from "./ModalContext";
import { Formik, useFormikContext } from "formik";
import { MultiTextField } from "../inputs/MultiTextField";
import { useParams } from "react-router-dom";
import { ExchangeEvent } from "../../models/functions";
import {
  generateBidrectionalMatches,
  generateLoopMatches,
  generateMatches,
} from "../../utils/matches";
import { updateExchangeEvent } from "../../api/ChristmasListApi";

const useStyles = makeStyles((theme: Theme) => ({
  modal: {
    "& > .MuiDialog-container > .MuiDialog-paper": {
      [theme.breakpoints.down(960)]: {
        margin: 0,
        flexGrow: 1,
        "& > div": {
          padding: 8,
        },
      },
    },
  },
  chipContainer: {
    display: "flex",
    gap: "8px",
    "& > .MuiChip-root": {
      flexGrow: 1,
    },
  },
  flexGrow: {
    flexGrow: 1,
  },
  matchContainer: {
    display: "grid",
    rowGap: "8px",
    alignItems: "center",
    gridTemplateColumns: "1fr 24px 1fr",
    "& > .MuiPaper-root": {
      display: "flex",
      gap: "8px",
      padding: "4px",
      flexWrap: "wrap",
    },
  },
  flexEnd: {
    justifyContent: "flex-end",
  },
}));

const INITIAL_FORM_VALUES = {
  type: "noTwoWay" as ExchangeEvent["drawNames"]["type"],
  gifters: [[]] as string[][],
};

type DrawNamesFormValues = typeof INITIAL_FORM_VALUES;

export const NamesForm = () => {
  const { exchangeEvent: exchangeEventUrlParam } = useParams<{
    exchangeEvent: string;
  }>();
  const exchangeEvent = useExchangeEvent(exchangeEventUrlParam);
  const userOptions = useMemo(
    () => exchangeEvent?.data.users ?? [],
    [exchangeEvent]
  );
  const { values, setFieldValue, errors } =
    useFormikContext<DrawNamesFormValues>();
  const [addGifterInput, setAddGifterInput] = useState<string[]>([]);
  return (
    <Flex
      flexDirection="column"
      minWidth="300px"
      gap="16px"
      boxSizing="border-box"
    >
      <Typography variant="h4">Draw Names</Typography>
      <Flex flexDirection="column" gap="16px">
        <Flex flexDirection="column" gap="16px">
          {values.gifters.map((gifter, index) => {
            return (
              <Flex gap="8px" key={`gifter-${index}`}>
                <MultiTextField
                  variant="outlined"
                  fullWidth
                  label={`Gifter ${index + 1}`}
                  placeholder="Enter one or more emails..."
                  value={gifter}
                  onChange={(e, newValue) => {
                    setFieldValue(`gifters[${index}]`, newValue);
                  }}
                  options={userOptions}
                  filterSelectedOptions
                  freeSolo
                  confirmKeys={[",", "Space"]}
                  helperText={
                    errors?.gifters?.[index]
                      ? errors.gifters[index]
                          .toString()
                          .split(",")
                          .filter(Boolean)[0]
                      : `Enter email addresses for gifter ${index + 1}`
                  }
                  error={!!errors?.gifters?.[index]}
                />
                <div>
                  <IconButton
                    onClick={() => {
                      const newGifters = [...values.gifters];
                      newGifters.splice(index, 1);
                      setFieldValue("gifters", newGifters);
                    }}
                  >
                    <RemoveCircleOutline color="error" />
                  </IconButton>
                </div>
              </Flex>
            );
          })}
          <MultiTextField
            value={addGifterInput}
            onChange={(e, newValue) => {
              setAddGifterInput(newValue);
              if (newValue.length > 0) {
                setFieldValue("gifters", [...values.gifters, newValue]);
                setAddGifterInput([]);
              }
            }}
            variant="outlined"
            fullWidth
            label={`Add Gifter`}
            placeholder="Enter one or more emails..."
            options={userOptions}
            filterSelectedOptions
            freeSolo
            confirmKeys={[",", "Space"]}
          />
        </Flex>
      </Flex>
    </Flex>
  );
};

const ModalBody = () => {
  const classes = useStyles();
  const { setModal } = useContext(ModalContext);
  const { exchangeEvent: exchangeEventUrlParam } = useParams<{
    exchangeEvent: string;
  }>();
  const exchangeEvent = useExchangeEvent(exchangeEventUrlParam);
  const [step, setStep] = useState<"form" | "matches">("form");
  const [localMatches, setLocalMatches] = useState(
    exchangeEvent?.data.drawNames.matches ?? []
  );
  const initialFormValues = useMemo(() => {
    if (!exchangeEvent) {
      return INITIAL_FORM_VALUES;
    }
    return {
      type: exchangeEvent.data.drawNames.type,
      gifters: exchangeEvent.data.drawNames.gifters.map(
        (gifter) => gifter.emails
      ),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchangeEvent?.data.drawNames]);
  return (
    <Formik initialValues={initialFormValues} onSubmit={() => {}}>
      {({ values, setFieldValue }) => (
        <>
          {step === "form" ? (
            <Flex flexDirection="column" p="32px" gap="32px">
              <NamesForm />
              <Flex gap="8px">
                <Button
                  onClick={() => {
                    setModal(null);
                  }}
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep("matches")}
                  variant="contained"
                  className={classes.flexGrow}
                >
                  Next
                  <ArrowForwardIos />
                </Button>
              </Flex>
            </Flex>
          ) : (
            <Flex flexDirection="column" p="32px" gap="16px">
              <Typography variant="h4">Matches</Typography>
              <Flex gap="16px" flexDirection="column">
                <Flex flexDirection="column" gap="8px">
                  <Typography>Auto or Manual</Typography>
                  <ButtonGroup>
                    <Button
                      variant={
                        values.type !== "manual" ? "contained" : "outlined"
                      }
                      onClick={() => setFieldValue("type", "noTwoWay")}
                    >
                      Auto
                    </Button>
                    <Button
                      variant={
                        values.type === "manual" ? "contained" : "outlined"
                      }
                      onClick={() => setFieldValue("type", "manual")}
                    >
                      Manual
                    </Button>
                  </ButtonGroup>
                </Flex>
                {values.type !== "manual" && (
                  <>
                    <Typography>Match Connectivity</Typography>
                    <div className={classes.chipContainer}>
                      <Chip
                        label="No Two-Way"
                        color={
                          values.type === "noTwoWay" ? "primary" : "default"
                        }
                        onClick={() => setFieldValue("type", "noTwoWay")}
                      />
                      <Chip
                        label="Some Two-Way"
                        color={
                          values.type === "someTwoWay" ? "primary" : "default"
                        }
                        onClick={() => setFieldValue("type", "someTwoWay")}
                      />
                      <Chip
                        label="All Two-Ways"
                        color={
                          values.type === "allTwoWay" ? "primary" : "default"
                        }
                        onClick={() => setFieldValue("type", "allTwoWay")}
                      />
                      <Chip
                        label="One Loop"
                        color={
                          values.type === "oneLoop" ? "primary" : "default"
                        }
                        onClick={() => setFieldValue("type", "oneLoop")}
                      />
                    </div>
                  </>
                )}
                <Flex flexDirection="column" gap="16px">
                  <div className={classes.matchContainer}>
                    {localMatches.map((receiverIndex, gifterIndex) => {
                      const gifter = values.gifters[gifterIndex];
                      const receiver = values.gifters[receiverIndex];
                      return (
                        <Fragment key={gifter.toString()}>
                          <Paper variant="outlined">
                            {gifter.map((gifter) => (
                              <Chip
                                color="secondary"
                                key={gifter}
                                label={gifter}
                                size="small"
                              />
                            ))}
                          </Paper>
                          <ArrowForwardIos />
                          <Paper variant="outlined" className={classes.flexEnd}>
                            {receiver.map((receiver) => (
                              <Chip
                                color="secondary"
                                key={receiver}
                                label={receiver}
                                size="small"
                              />
                            ))}
                          </Paper>
                        </Fragment>
                      );
                    })}
                  </div>
                </Flex>
                {values.type !== "manual" && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => {
                      let matchIndices: number[] = [];
                      if (values.type === "noTwoWay") {
                        matchIndices = generateMatches(values.gifters.length);
                      } else if (values.type === "someTwoWay") {
                        matchIndices = generateMatches(
                          values.gifters.length,
                          true
                        );
                      } else if (values.type === "allTwoWay") {
                        matchIndices = generateBidrectionalMatches(
                          values.gifters.length
                        );
                      } else if (values.type === "oneLoop") {
                        matchIndices = generateLoopMatches(
                          values.gifters.length
                        );
                      }
                      setLocalMatches(matchIndices);
                    }}
                  >
                    {localMatches.length === 0 ? "Generate" : "Re-Generate"}
                  </Button>
                )}
                <Flex gap="8px">
                  <Button variant="outlined" onClick={() => setStep("form")}>
                    <ArrowBackIos />
                    Go Back
                  </Button>

                  <Button
                    className={classes.flexGrow}
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      updateExchangeEvent({
                        id: exchangeEventUrlParam,
                        drawNames: {
                          type: values.type,
                          gifters: values.gifters.map((emails) => ({
                            emails,
                          })),
                          matches: localMatches,
                        },
                      });
                    }}
                  >
                    Save
                  </Button>
                </Flex>
              </Flex>
            </Flex>
          )}
        </>
      )}
    </Formik>
  );
};

export const DrawNamesModal = () => {
  const classes = useStyles();
  const { modal, setModal } = useContext(ModalContext);

  return (
    <Dialog
      open={modal === ModalType.DrawNames}
      onClose={() => setModal(null)}
      className={classes.modal}
    >
      <ModalBody />
    </Dialog>
  );
};
