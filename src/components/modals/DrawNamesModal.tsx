import { Close } from "@mui/icons-material";
import { Button, Chip, Dialog, IconButton, Typography } from "@mui/material";
import _ from "lodash";
import { useContext, useMemo } from "react";
import { IdeaMarkStatus } from "../../models/functions";
import { useExchangeEvent, useUser, useWishLists } from "../../redux/selectors";
import { Flex } from "../Flex";
import { ModalContext, ModalType } from "./ModalContext";
import { Formik } from "formik";
import { MultiTextField } from "../inputs/MultiTextField";
import { useParams } from "react-router-dom";

export const DrawNamesModal = () => {
  const { modal, setModal } = useContext(ModalContext);
  const { exchangeEvent: exchangeEventUrlParam } = useParams<{
    exchangeEvent: string;
  }>();
  const user = useUser();
  const wishLists = useWishLists();
  const exchangeEvent = useExchangeEvent(exchangeEventUrlParam);
  const userOptions = useMemo(
    () => exchangeEvent?.data.users ?? [],
    [exchangeEvent]
  );
  return (
    <Dialog open={modal === ModalType.DrawNames} onClose={() => setModal(null)}>
      <Flex flexDirection="column" p="32px" minWidth="300px" gap="32px">
        <Flex justifyContent="space-between">
          <Typography variant="h4">Draw Names</Typography>
          <IconButton onClick={() => setModal(null)}>
            <Close />
          </IconButton>
        </Flex>
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
              <Flex gap="16px">
                <Typography>Two-way matches</Typography>
                <Flex gap="8px">
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
                </Flex>
              </Flex>
              <Flex flexDirection="column" gap="16px">
                {values.gifters.map((gifter, index) => {
                  return (
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
        <Button>Generate Matches</Button>
      </Flex>
    </Dialog>
  );
};
