import MyMath from "@mathstools/mymath";
type NestedArray<T> = T | Array<T>

export type InputType = MyMath|number|string
export type TParams = Record<string, NestedArray<InputType>>