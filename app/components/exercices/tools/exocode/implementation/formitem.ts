import { View } from "backbone.marionette"

type AnyView = View<any>|Array<View<any>>

interface FormItemImplementation {
    readonly IMPLEMENTATION_FORMITEM:boolean
    resultView(userData:Record<string, string>):AnyView
    resultScore(userData:Record<string, string>):number
    validation(userValue?:string|Array<string>):string|Array<string>|boolean|Record<string, string>
    nombrePts():number
}

export default FormItemImplementation