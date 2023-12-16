import _ from "lodash";
import { ReactNode } from "react";
import { OptionObject, OptionType, OptionValueType } from "./types";

export const OPTIONS_KEY = "_options";
export const EMPTY_STRING = "";
export const EMPTY_VALUE_REPLACEMENT = "__empty__";

/**
 * Get the value of an option
 * @param option A string, number, or {display: ReactNode, value: string | number} object.
 * @returns a string or number.
 */
export const getOptionValue = <V extends OptionValueType>(
  option: OptionType<V>
) => _.get(option, "value", option) as V;

/**
 * Get the display of an option.
 * @param option A string, number, or {display: ReactNode, value: string} object.
 * @returns A ReactNode, Start Case of a string option, or the number option itself.
 */
export const getOptionDisplay = (option: OptionType) =>
  (_.has(option, "display")
    ? (option as OptionObject).display
    : option) as ReactNode;

/**
 * Get the disabled state of an option
 * @param option A string, number, or {display: ReactNode, value: string | number, disabled?: boolean} object.
 * @returns a boolean.
 */
export const getOptionDisabled = (option: OptionType) =>
  _.get(option, "disabled", false);

/**
 * A util function to iterate over input options.
 * @param options An array of options defined as strings, numbers or {display: ReactNode, value: string} objects.
 * @param callback A function that maps over the options.  Takes the option value and the option display as arguments.
 * @returns An array of the callback return type.
 */
export const mapEachOption = <V extends OptionValueType>(
  options: OptionType<V>[],
  callback: (
    value: V,
    display: React.ReactNode,
    disabled: boolean,
    index: number
  ) => React.ReactNode
) =>
  options.map((option, i) =>
    callback(
      getOptionValue(option),
      getOptionDisplay(option),
      getOptionDisabled(option),
      i
    )
  );

export type EmptyValue = typeof EMPTY_STRING | undefined | null;
export type EmptyValueReplacement = typeof EMPTY_VALUE_REPLACEMENT;
export const isEmptyString = (val: any): val is EmptyValue =>
  val === "" || _.isNil(val);
export const isEmptyValueReplacement = (
  val: any
): val is EmptyValueReplacement => val === EMPTY_VALUE_REPLACEMENT;

/**
 * Map an empty string option value to a replacement string.
 *
 * Select dropdowns are really dumb about handling options with an empty value,
 * so we need to replace those options with a non-empty value like '__empty__',
 * and then manage the value and onChange properties manually. If we don't do
 * this, then selecting an option with an empty value won't display anything on
 * the input when the dropdown closes.
 */
export const mapValueToPossibleEmpty = <V>(value: V): V =>
  (isEmptyString(value) ? EMPTY_VALUE_REPLACEMENT : value) as unknown as V;

/**
 * Map a replacement string option value back to an empty string.
 *
 * Select dropdowns are really dumb about handling options with an empty value,
 * so we need to replace those options with a non-empty value like '__empty__',
 * and then manage the value and onChange properties manually. If we don't do
 * this, then selecting an option with an empty value won't display anything on
 * the input when the dropdown closes.
 */
export const unmapValueToPossibleEmpty = <V>(value: V): V =>
  (isEmptyValueReplacement(value) ? EMPTY_STRING : value) as unknown as V;

/**
 * Event.target.value is always a string.  This function helps find the value of
 * the option that matches this string value.
 * @param stringValue - The string value.
 * @param options - The options to search
 * @returns The value of the matched option or the stringValue if there's no match.
 */
export const getMatchingOptionValue = (
  stringValue: string,
  options: OptionType[]
) => {
  const matchingOption = options.find(
    (option) => getOptionValue(option).toString() === stringValue
  );
  return getOptionValue(matchingOption as OptionType) ?? stringValue;
};
