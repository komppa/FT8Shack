import { combineReducers } from 'redux'
import { configureStore } from '@reduxjs/toolkit'

import debugRedcuer from './reducers/debugReducer'
import timeReducer from './reducers/timeReducer'



const reducer = combineReducers({

    time: timeReducer,
    // For debug information like perf timings
    debug: debugRedcuer

})

export const store = configureStore({
    reducer,
    preloadedState: {}
})