import { PayloadAction } from '@reduxjs/toolkit'


interface DebugField {
    fieldName: string
    fieldValue?: string
}

interface DebugState {
    values: Array<DebugField> | []
}


// TODO create field
export const addDebugField: any = (field: DebugField) => ({ type: 'ADD_DEBUG_FIELD', payload: field })
export const removeDebugField: any = (fieldName: string) => ({ type: 'REMOVE_DEBUG_FIELD', payload: { fieldName } })
export const removeDebugFields: any = () => ({ type: 'REMOVE_DEBUG_FIELDS', payload: null })


export default function debug(state: DebugState = { values: [] }, action: PayloadAction<DebugField>) {
    switch (action.type) {
    case 'ADD_DEBUG_FIELD':
        return {
            ...state,
            values: state.values.concat((action.payload))
        }
    case 'REMOVE_DEBUG_FIELD':
        return {
            ...state,
            values: state.values.filter((v: DebugField) => v.fieldName !== action.payload.fieldName)
        }
    case 'REMOVE_DEBUG_FIELDS':
        return { values: [] }
    default:
        return state
    }
}
