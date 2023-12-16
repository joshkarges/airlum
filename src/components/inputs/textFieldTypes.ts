import { ReactNode } from "react";
import {
  AutocompleteProps,
  OutlinedTextFieldProps,
  ChipProps,
} from "@mui/material";
import { OptionType, OptionValueType, WithOptions } from "./options";
import { OptionallyControlledProps } from "./utils";

export interface CommonInputProps<V, E = React.SyntheticEvent> {
  value: V;
  onChange: (event: E, newValue: V) => void;
  name?: string;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  className?: string;
  inlineLabel?: boolean;
}

export type TextFieldProps<V extends OutlinedTextFieldProps["value"]> = Omit<
  OutlinedTextFieldProps,
  "variant" | "onChange"
> &
  Partial<
    CommonInputProps<
      V,
      React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    >
  > & {
    preserveEmptyHelperText?: boolean;
    preserveEmptyLabel?: boolean;
    inlineLabel?: boolean;
  };

export type ControlledMultiTextFieldProps<V extends OptionValueType> = Omit<
  TextFieldProps<V[]>,
  "value" | "onChange"
> &
  CommonInputProps<V[]> &
  WithOptions<V> &
  Pick<
    AutocompleteProps<OptionType, true, false, boolean>,
    | "ListboxProps"
    | "loading"
    | "freeSolo"
    | "filterSelectedOptions"
    | "filterOptions"
  > & {
    ChipProps?: Partial<ChipProps>;
    getOptionDisplay?: (option: OptionType<V>) => ReactNode;
    confirmKeys?: string[];
  };

export type MultiTextFieldProps<V extends OptionValueType> =
  OptionallyControlledProps<ControlledMultiTextFieldProps<V>>;
