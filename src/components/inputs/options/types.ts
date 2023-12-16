export type OptionValueType = string | number | boolean;
export type OptionObject<V extends OptionValueType = OptionValueType> = {
  display: React.ReactNode;
  value: V;
  disabled?: boolean;
};
export type OptionType<V extends OptionValueType = OptionValueType> =
  | V
  | OptionObject<V>;

export interface WithOptions<V extends OptionValueType = OptionValueType> {
  options: OptionType<V>[];
}
