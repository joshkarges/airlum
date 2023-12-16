import {
  Autocomplete,
  Chip,
  TextField,
  AutocompleteProps,
  FormHelperText,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { ReactNode, useCallback, useMemo } from "react";


const useStyles = makeStyles(
  (theme) => ({
    autocomplete: {
      "&& .MuiAutocomplete-inputRoot": {
        "& > .MuiInputBase-input": {
          minWidth: 100,
        },
      },
    },
  }),
  { name: "nds-multiTextField" }
);

type MultiTextFieldProps = Partial<
  AutocompleteProps<string, true, false, true, typeof Chip>
> & {
  value: string[];
  onChange: (
    event: React.SyntheticEvent<Element, Event>,
    value: string[]
  ) => void;
  confirmKeys?: string[];
  helperText?: string;
  error?: boolean;
  label?: ReactNode;
  placeholder?: string;
};

export const MultiTextField = (props: MultiTextFieldProps) => {
  const classes = useStyles();
  const { helperText, error, label, placeholder, ...autocompleteProps } = props;
  const { value, freeSolo, onChange, confirmKeys = [] } = autocompleteProps;
  const optionsSet = useMemo(
    () => new Set(props.options || []),
    [props.options]
  );
  // const helperOrErrorText =
  // Function to add a single item to the values.
  const addValue = useCallback(
    (evt: any, newValue: string) => {
      if (newValue !== "" && (freeSolo || optionsSet.has(newValue))) {
        onChange(evt, value.concat(newValue));
      }
    },
    [freeSolo, optionsSet, onChange, value]
  );
  return (
    <div>
      <Autocomplete
        className={classes.autocomplete}
        multiple
        id="multi-text-field"
        renderTags={(value: readonly string[], getTagProps) =>
          value.map((option: string, index: number) => (
            <Chip
              variant="outlined"
              label={option}
              {...getTagProps({ index })}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            variant="filled"
            helperText={helperText}
            error={!!error}
            onKeyDown={(evt) => {
              // Tab and Enter always comfirm the current input if it's non-empty.
              const newValue = (evt.target as HTMLInputElement).value;
              if (["Tab", "Enter"].includes(evt.key) && newValue) {
                addValue(evt, newValue);
                params.inputProps.onChange?.({ target: { value: "" } } as any);
                // Prevent blur on Tab and submit the form on Enter, since we're
                // using these keys to confirm the input.
                evt.preventDefault();
              }
            }}
            onKeyUp={(evt) => {
              if (confirmKeys.includes(evt.key)) {
                const target = evt.target as HTMLInputElement;
                // Remove key up value if it's a single character instead of something like 'Tab'
                const newValueEl =
                  evt.key.length === 1
                    ? target.value.slice(0, -1)
                    : target.value;
                addValue(evt, newValueEl);
                params.inputProps.onChange?.({ target: { value: "" } } as any);
              }
            }}
          />
        )}
        options={props.options ?? []}
        {...props}
      />
      <FormHelperText>{}</FormHelperText>
    </div>
  );
};
