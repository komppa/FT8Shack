import { combineReducers } from 'redux'
import { configureStore } from '@reduxjs/toolkit'

import debugRedcuer from './reducers/debugReducer'


const reducer = combineReducers({

    // For debug information like perf timings
    debug: debugRedcuer

})

export const store = configureStore({
    reducer,
    preloadedState: {}
})