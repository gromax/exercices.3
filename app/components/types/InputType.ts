import MyMath from "@mathstools/mymath";
type NestedArray<T> = T | Array<NestedArray<T>>

export type NestedInput = NestedArray<InputType>
export type InputType = MyMath|number|string
export type TParams = Record<string, NestedInput>