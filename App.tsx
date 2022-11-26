import React from 'react'
import { Provider } from 'react-redux'
import { store } from './state/store'
import Ft8 from './Ft8'
import { NativeBaseProvider, Box, Text, Center } from 'native-base'
import { Progress } from 'native-base'
import { useState, useEffect } from 'react'
import { TimeInternal } from './types/time'
// import * as Location from 'expo-location'


const time: TimeInternal = {
    ms: Date.now(),
    slot: 1,
    seconds: new Date().getSeconds() % 15
}

/**
 * TIME SERVICE
 */

/**
 * Initialize time for instance at startup.
 * @returns 
 */
const initializeTime = () => {

    // How many milliseconds it takes when next full minute starts
    const timeToNextSync = 60000 - ( new Date().getSeconds() * 1000) + new Date().getMilliseconds()

    return {
        timeToNextSync,
    }

}

export default function App() {

    // const [location, setLocation] = useState<Location.LocationObject|null>(null)
    // const [errorMsg, setErrorMsg] = useState('')
    const [seconds, setSeconds] = useState(0)

    // Use effect for global timing control
    useEffect(() => {

        let initTime = initializeTime()

        // Set timeout for next local time sync
        setTimeout(() => {
            console.log(new Date())
            initTime = initializeTime()
        }, 60000 - ( new Date().getSeconds() * 1000) + new Date().getMilliseconds())


        const interval = setInterval(() => {
            setSeconds(
                (seconds) => seconds < 15 ? seconds + 1 : 0
            )
        }, 1000)



    }, [])



    /*
    useEffect(() => {
        (async () => {
          
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied')
                return
            }
            
            const location = await Location.getCurrentPositionAsync({})
            setLocation(location)
        })()
    }, [])

    
    let text = 'Waiting..'
    if (errorMsg) {
        text = errorMsg
    } else if (location) {
        text = JSON.stringify(location.timestamp ?? '-')
    }
    */

    
    return (
        <>
            
            <NativeBaseProvider>
                <Provider store={ store }>

                
                    <Box style={{ height: 30 }} />

                    <Box style={{
                        height: 20,
                        position: 'relative',
                    }}>
                        <Progress size="2xl" value={(100 / 15) * seconds} mx="4" style={{
                            height: 20,
                        }} />
                        <Center style={{
                            position: 'absolute',
                            height: 20,
                            width: '100%',
                        }}>
                            <Text style={{
                                color: 'black',
                                textAlign: 'center',
                            }}>
                                { `${seconds}/15` }
                            </Text>
                        </Center>
                    </Box>


                    {/* <Text>{ text }</Text> */}


                    <Ft8 />
                </Provider>

            </NativeBaseProvider>
            
            
        </>
    )
}
    