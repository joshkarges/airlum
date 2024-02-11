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
  Theme,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useContext, useMemo, useState } from "react";
import { useExchangeEvent } from "../../redux/selectors";
import { Flex } from "../Flex";
import { ModalContext, ModalType } from "./ModalContext";
import { Formik } from "formik";
import { MultiTextField } from "../inputs/MultiTextField";
import { useParams } from "react-router-dom";

const useStyles = makeStyles((theme: Theme) => ({
  modal: {
    "& > .MuiDialog-container > .MuiDialog-paper": {
      [theme.breakpoints.down(960)]: {
        margin: 0,
        flexGrow: 1,
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
}));

export const NamesForm = () => {
  const { exchangeEvent: exchangeEventUrlParam } = useParams<{
    exchangeEvent: string;
  }>();
  const exchangeEvent = useExchangeEvent(exchangeEventUrlParam);
  const userOptions = useMemo(
    () => exchangeEvent?.data.users ?? [],
    [exchangeEvent]
  );
  return (
    <Flex
      flexDirection="column"
      minWidth="300px"
      gap="16px"
      boxSizing="border-box"
    >
      <Typography variant="h4">Draw Names</Typography>
      <Formik
        initialValues={{
          options: {
            twoWayMatches: "none",
          },
          gifters: [[]] as string[][],
        }}
        onSubmit={() => {}}
      >
        {({ values, setFieldValue, errors }) => (
          <Flex flexDirection="column" gap="16px">
            <Flex flexDirection="column" gap="16px">
              {values.gifters.map((gifter, index) => {
                return (
                  <Flex gap="8px" key={`gifter-${index}`}>
                    <MultiTextField
                      fullWidth
                      label={`Gifter ${index + 1}`}
                      placeholder="Enter one or more emails..."
                      value={values.gifters[index]}
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
              <Button
                variant="contained"
                onClick={() =>
                  setFieldValue("gifters", [...values.gifters, []])
                }
                size="small"
              >
                Add Gifter
              </Button>
            </Flex>
          </Flex>
        )}
      </Formik>
    </Flex>
  );
};

export const DrawNamesModal = () => {
  const classes = useStyles();
  const { modal, setModal } = useContext(ModalContext);
  const [step, setStep] = useState<"form" | "matches">("form");
  return (
    <Dialog
      open={modal === ModalType.DrawNames}
      onClose={() => setModal(null)}
      className={classes.modal}
    >
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
              Generate Matches
              <ArrowForwardIos />
            </Button>
          </Flex>
        </Flex>
      ) : (
        <Flex flexDirection="column" p="32px" gap="16px">
          <Typography variant="h4">Matches</Typography>

          <Formik
            initialValues={{
              options: {
                twoWayMatches: "none",
                autoManual: "auto",
                oneLoop: false,
              },
            }}
            onSubmit={() => {}}
          >
            {({ values, setFieldValue }) => (
              <Flex gap="16px" flexDirection="column">
                <Flex flexDirection="column" gap="8px">
                  <Typography>Auto or manual</Typography>
                  <ButtonGroup>
                    <Button
                      variant={
                        values.options.autoManual === "auto"
                          ? "contained"
                          : "outlined"
                      }
                      onClick={() =>
                        setFieldValue("options.autoManual", "auto")
                      }
                    >
                      Auto
                    </Button>
                    <Button
                      variant={
                        values.options.autoManual === "manual"
                          ? "contained"
                          : "outlined"
                      }
                      onClick={() =>
                        setFieldValue("options.autoManual", "manual")
                      }
                    >
                      Manual
                    </Button>
                  </ButtonGroup>
                </Flex>
                <Typography>Two-way matches</Typography>
                <div className={classes.chipContainer}>
                  <Chip
                    label="None"
                    color={
                      values.options.twoWayMatches === "none"
                        ? "primary"
                        : "default"
                    }
                    onClick={() =>
                      setFieldValue("options.twoWayMatches", "none")
                    }
                  />
                  <Chip
                    label="Some"
                    color={
                      values.options.twoWayMatches === "some"
                        ? "primary"
                        : "default"
                    }
                    onClick={() =>
                      setFieldValue("options.twoWayMatches", "some")
                    }
                  />
                  <Chip
                    label="All"
                    color={
                      values.options.twoWayMatches === "all"
                        ? "primary"
                        : "default"
                    }
                    onClick={() =>
                      setFieldValue("options.twoWayMatches", "all")
                    }
                  />
                  <Chip
                    label="One Loop"
                    color={
                      values.options.twoWayMatches === "onLoop"
                        ? "primary"
                        : "default"
                    }
                    onClick={() =>
                      setFieldValue("options.twoWayMatches", "onLoop")
                    }
                  />
                </div>
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
                      // Save this to the exchange event
                    }}
                  >
                    Save
                  </Button>
                </Flex>
              </Flex>
            )}
          </Formik>
        </Flex>
      )}
    </Dialog>
  );
};
