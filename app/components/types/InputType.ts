import type MyMath from "@mathstools/mymath"
import Decimal from 'decimal.js'
type NestedArray<T> = T | Array<NestedArray<T>>
export type NestedInput = NestedArray<InputType>
export type InputType = MyMath|number|string|Decimal
export type TParams = Record<string, NestedInput>
export type TOptions = Record<string, InputType>