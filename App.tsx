import { Provider } from 'react-redux'
import { store } from './state/store'
import Ft8 from './Ft8'
import { NativeBaseProvider, Box, Text, Center } from "native-base"
import { Progress } from 'native-base'
import { useState, useEffect } from 'react'


export default function App() {

    const [seconds, setSeconds] = useState(0)

    useEffect(() => {
        setInterval(() => {
            setSeconds(
                (seconds) => seconds < 15 ? seconds + 1 : 0
            )

        }, 500)
    }, [])

    
    return (
        <>
            
            <NativeBaseProvider>
                
                <Box style={{ height: 30 }} />

                <Box style={{
                    height: 20,
                    position: "relative",
                }}>
                    <Progress size="2xl" value={(100 / 15) * seconds} mx="4" style={{
                        height: 20,
                    }} />
                    <Center style={{
                        position: "absolute",
                        height: 20,
                        width: "100%",
                    }}>
                        <Text style={{
                            color: "black",
                            textAlign: "center",
                        }}>
                            { `${seconds}/15` }
                        </Text>
                    </Center>
                </Box>
            </NativeBaseProvider>
            
            <Provider store={ store }>
                <Ft8 />
            </Provider>
            
        </>
    )
}
    