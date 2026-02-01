export type TLineType = "sign" | "var" | "inputvar" | "inputsign"
export type TabLineConfig = {
    type:TLineType,
    tag:string,
    line:string,
    hauteur?:number,
    name?:string,
    solution?:string
}