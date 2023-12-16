import { forwardRef, useCallback, useState } from "react";
import { CommonInputProps } from "./textFieldTypes";

export type UncontrolledInputProps<V, C extends CommonInputProps<V>> = Omit<
  C,
  "value" | "onChange" | "defaultValue"
> & {
  defaultValue?: C["value"];
  onChange?: C["onChange"];
};

export const makeUncontrolledInput = <V, C extends CommonInputProps<V>, El>(
  ControlledInput: React.ComponentType<C>,
  defaultVal: V
) =>
  forwardRef<El, UncontrolledInputProps<V, C>>(
    ({ defaultValue = defaultVal, onChange, ...rest }, ref) => {
      const [value, setValue] = useState(defaultValue);
      const handleOnChange: C["onChange"] = useCallback(
        (evt: any, newValue: any) => {
          setValue(newValue);
          if (onChange) onChange(evt, newValue);
        },
        [onChange]
      );
      return (
        // TS has an issue where it's not sure if UncontrolledInputProps is a subset of ControlledProps.
        // @ts-ignore
        <ControlledInput
          value={value}
          onChange={handleOnChange}
          {...rest}
          ref={ref}
        />
      );
    }
  );

export type OptionallyControlledProps<C extends CommonInputProps<any>> =
  C extends CommonInputProps<infer V>
    ? UncontrolledInputProps<V, C> & { value?: V }
    : never;

export const makeOptionallyControlledComponent = <
  V,
  C extends CommonInputProps<V>,
  El
>(
  ControlledInput: React.ComponentType<C>,
  defaultVal: V
) => {
  const UncontrolledInput = makeUncontrolledInput(ControlledInput, defaultVal);
  return forwardRef<El, OptionallyControlledProps<C>>(
    ({ value, onChange, defaultValue = defaultVal, ...rest }, ref) => {
      if (typeof value !== "undefined" && onChange) {
        return (
          // TS has an issue where it's not sure if UncontrolledInputProps is a subset of ControlledProps.
          // @ts-ignore
          <ControlledInput
            value={value}
            onChange={onChange}
            {...rest}
            ref={ref}
          />
        );
      }

      return (
        // TS has an issue where it's not sure if the onChange and defaultValue match their types.
        // @ts-ignore
        <UncontrolledInput
          defaultValue={defaultValue}
          onChange={onChange}
          {...rest}
          ref={ref}
        />
      );
    }
  );
};
