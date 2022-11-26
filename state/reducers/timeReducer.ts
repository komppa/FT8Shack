import { createSlice } from '@reduxjs/toolkit'
import { TimeInternal } from '../../type/types/time.d.ts'


export const getCurrentTimeSlot = () => {

    let timeSlot = 0
    const seconds = new Date().getSeconds()

    if (0 <= seconds < 15) {
        timeSlot = 1
    } else if (15 <= seconds < 30) {
        timeSlot = 2
    } else if (30 <= seconds < 45) {
        timeSlot = 3
    } else {
        timeSlot = 4
    }

    return timeSlot

}

export const getCurrentTimeBarTime = () => ((new Date().getSeconds()) % 15)


const timeSlice = createSlice({
    name: 'time',
    initialState: {},    // Time not initialized
    reducers: {
        fetchTimeFromGNSS(state, action) {

            console.log(11)

            // state.push((new Date()).toString())
            // state.push(1)


  
            // state.push({
            //     content,
            //     important: false,    
            //     id: generateId(), 
            // })
            return action.payload
        },
        setInitializeTime(state, action) {
            Object.assign(
                state,
                action.payload
            )
        }
    },
})
  
export const { fetchTimeFromGNSS, setInitializeTime } = timeSlice.actions

export const getUnsyncTime = (): TimeInternal => {
    return {
        ms: Date.now(),
        slot: Date.now()
    }
}

// TODO getSyncTime with GNSS


/**
 * Get current time based on clock of the device.
 * Time is not accurate, since it is not synced. 
 * 
 * Returns current time in ms since epoch,
 * correction (internal correction value based on GNSS fix) and
 * ycle number (f.ex. seconds 17 is the second cycle and 2 the first one).
 */
export const initializeTime = () => {

    return async (dispatch: any) => {
        dispatch(setInitializeTime({
            ms: Date.now(),
            timeSlot: getCurrentTimeSlot(),
            timebarTime: getCurrentTimeBarTime()
        })) 
    }
}


export default timeSlice.reducer
