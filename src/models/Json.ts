type JsonPrimitiive = string | number | boolean | null;
type JsonArray = JsonPrimitiive[] | Json[];
export type Json = { [key: string]: JsonPrimitiive | JsonArray | Json };