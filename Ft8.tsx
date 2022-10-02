import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation';
import { Button, View, TextInput } from "react-native";
import WebView from "react-native-webview";
import { useWebViewMessage } from "react-native-react-bridge";
import ApiPoker from './apiPoker.js';
import { StorageAccessFramework } from 'expo-file-system';
import { Buffer } from '@craftzdog/react-native-buffer'
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { FFmpegKit } from 'ffmpeg-kit-react-native';
import { useDispatch, useSelector } from 'react-redux'
import { store } from './state/store'
import {
    addDebugField,
    removeDebugField,
    removeDebugFields
} from './state/reducers/debugReducer'

// Globals
let permissions: any
let uri: any
let createdFilename: any;
let recordingUri;  // RECORDING FRO MEXPO 

// For performance measurements
var start_meas: any
var middle_meas: any
var end_meas: any




const bufferFrom16Array = (array16: any) => {

    let buf = []
    let wi = 0

    for (let i = 0; i < array16.length; i++) {
        
        buf[wi] = array16[i] >> 8
        wi++
        buf[wi] = array16[i]
        wi++

    }

    return Buffer.from(buf)
}


// Used by file2audio
const array16FromBuffer = (buffer: any) => {

    let arr = [];
    const arrayLength = 350000

    for (let i = 0; i < arrayLength; i++) {

        arr.push(
            (buffer[i] << 8) | (buffer[i + 1])
        )
        // Increase index by one since we are processing 16 bit (byte) values.
        // If increment would be just one by for loop, step would be 1 byte.
        i++

        if (i === arrayLength - 1) {
            break
        }

    }

    return new Uint16Array(arr)
    
}

const saveAndPlayDecodedMessage = async (dataArray: any) => {

    middle_meas = performance.now()

    FileSystem.writeAsStringAsync(
        `${FileSystem.cacheDirectory}/encoded_message_out.wav`,             // If file does not exist, it creates it, otherwise, overwrites it
        bufferFrom16Array(new Uint16Array(dataArray)).toString('base64'),   // Get data buffer
        { encoding: 'base64' }                                              // Very imporant one since, we are writing it as a string
    )
        .then(async (writedStatus) => {

            const { sound } = await Audio.Sound.createAsync(
                { uri: `${FileSystem.cacheDirectory}/encoded_message_out.wav` }
            )

            // For performance analysis
            end_meas = performance.now()
            console.log(`Call to start to receved took ${middle_meas - start_meas} milliseconds.`);
            console.log(`Call to start to writed file took ${end_meas - start_meas} milliseconds.`);

            // Play encoded ft8 audio
            await sound.playAsync()

        })
        .catch(e => console.log(`Could not write a file, err: ${e.message}`))

}


export default function Ft8() {
    
    
        const dispatch = useDispatch()
        const selector = useSelector((state: any) => state.debug)

        const [messageInput, setMessageInput] = useState("CQ OH9KR KP26")
        const [recording, setRecording] = useState()
        const [receivedMessages, setReceivedMessages] = useState([])
        const [debugData, setDegubData] = useState({random: ""})
        
        // For creating debug field
        const [localFieldName, setLocalFieldName] = useState("")
        const [localFieldValue, setLocalFieldValue] = useState("")

        

        // START RECORDING AUDIO
        const onPressRecord = async () => {

            
            // EXCPO AV
            
            try {
                console.log('Requesting permissions..');
                const recPermissions = await Audio.requestPermissionsAsync();   // TODO move this out of here. Should ask @startup
                console.log("Permissions over", recPermissions);

                await Audio.setAudioModeAsync({});
                console.log('Starting recording..');
                const { recording } = await Audio.Recording.createAsync({
                    isMeteringEnabled: true,
                    android: {
                        extension: '.mp4',
                        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                        audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
                        sampleRate: 12000, // 44100, = expo defulat
                        numberOfChannels: 1,
                        bitRate: 128000,
                    },
                    ios: {
                        extension: '.m4a',
                        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
                        audioQuality: Audio.IOSAudioQuality.MAX,
                        sampleRate: 44100,
                        numberOfChannels: 2,
                        bitRate: 128000,
                        linearPCMBitDepth: 16,
                        linearPCMIsBigEndian: false,
                        linearPCMIsFloat: false,
                    },
                    web: {
                        mimeType: 'audio/webm',
                        bitsPerSecond: 128000,
                    },
                });
                setRecording(recording);
                console.log('Recording started');
              } catch (err) {
                console.error('Failed to start recording', err);
              }
              
        }

        const onPressStopRecord = async () => {

            start_meas = performance.now();

            console.log('Stopping recording..');
            setRecording(undefined);
            await recording.stopAndUnloadAsync();
            recordingUri = recording.getURI();
            console.log('Recording stopped and stored at', recordingUri);

            let sourceFile = recordingUri;
            let destinationFile = `file:///data/user/0/com.rantakangas.ft8shack/cache/Audio/myConversion22.wav`; // fileForConvertedRecord

            console.log("sourceFile", sourceFile, "& destinationFile", destinationFile);

            FFmpegKit
                .execute(`-i ${sourceFile} -acodec pcm_u8 -ar 12000 -ac 1 -c:a pcm_s16le ${destinationFile}`)
                .then(async (session) => {
                    console.log(209, "Converting successfully completed!", session)

                    // Optional, just for debugging if the original decode_ft8 works
                    // MediaLibrary.saveToLibraryAsync(destinationFile)
                    // console.log("saved to library maybe async DESTINATIONFILE =====" , destinationFile)

                    // DECODE FT8 FROM DESTINATION FILE
                    const testFile = await StorageAccessFramework.readAsStringAsync(destinationFile, {
                        encoding: 'base64',
                        length: 350000
                    })

                    emit({ type: "DECODE_FT8", data: array16FromBuffer(Buffer.from(testFile, 'base64')) })

                    console.log("Deleting recoded audio")
                    await StorageAccessFramework.deleteAsync(destinationFile, { idempotent: true })
                    console.log(`Deleted file: "${destinationFile}"`)


                })
                .catch(async (err) => {
                    console.log(`FFmpeg errored!! #: ${err.message} ::: ${err}`)
                    console.log("...still, deleting recoded audio")
                    await StorageAccessFramework.deleteAsync(destinationFile, { idempotent: true })
                    console.log(`Deleted file: "${destinationFile}"`)
                })
        }


        useEffect(() => {
            
            (async () => {

                // uri = StorageAccessFramework.getUriForDirectoryInRoot('Pictures')
                // console.debug("uri ", uri)
                // permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync(uri)

                const mediaPermissions = await MediaLibrary.requestPermissionsAsync()
                
            })()
            
        }, [])
        
        
    // useWebViewMessage hook create props for WebView and handle communication
    // The argument is callback to receive message from React
    const { ref, onMessage, emit } = useWebViewMessage((message: any) => {
        // console.log("@App reeived msg from WebView! Msg is=", message);
        if (message.type === "saveAndPlayDecodedMessage") {
            saveAndPlayDecodedMessage(message.data, setDegubData)
        } else if (message.type === "showContent") {
            setReceivedMessages(message.data)
        }

        if (message.type === "LOG") console.log(message.data)
        
    });

    const isLoadingComplete = useCachedResources();
    const colorScheme = useColorScheme();

    
    if (!isLoadingComplete) {
        return null;
    } else {
        return (

                <SafeAreaProvider>

                <Navigation colorScheme={colorScheme} />

                {
                    receivedMessages.map(message => <TextInput
                        key={message.text}
                        value={`${message.score}dB, ${message.freq}Hz, ${message.time}s, ${message.text}`}>

                    </TextInput>)
                }

                
                
                {/* Do not show this since it only for poking WebAssemvbly */}
                <View>
                <WebView
                    incognito={true}
                    ref={ref}
                    // Pass the source code of React App
                    source={{ html: ApiPoker }}
                    onMessage={onMessage}
                />
                </View>

                <TextInput
                    value={JSON.stringify(
                        selector
                    )}
                    placeholder={"Something should be here"}
                />

                <TextInput
                    value={ JSON.stringify(debugData) }
                    placeholder={"Logs Are Here"}
                />
                
                <TextInput
                    value={messageInput}
                    placeholder={"Message here"}
                    onChangeText={setMessageInput}
                >

                </TextInput>



                <TextInput
                    value={ localFieldName }
                    placeholder={"Field Name"}
                    onChangeText={setLocalFieldName}
                />
                <TextInput
                    value={ localFieldValue }
                    placeholder={"Field Value"}
                    onChangeText={setLocalFieldValue}
                />

                <Button
                    title="Test store"
                    onPress={() => {
                        dispatch(addDebugField({
                            fieldName: localFieldName,
                            fieldValue: localFieldValue
                        }))
                    } }
                />
                <Button
                    title="Remove one store"
                    onPress={() => {
                        dispatch(removeDebugField(localFieldName))
                    } }
                />
                <Button
                    title="Remove all store"
                    onPress={() => {
                        dispatch(removeDebugFields())
                    } }
                />

                <Button
                    title="TX"
                    onPress={() => {
                        start_meas = performance.now()
                        emit({ type: "ENCODE_FT8", data: messageInput })
                    } }
                />

                <Button
                    title={recording ? 'Stop Recording' : 'Start Recording'}
                    onPress={recording ? onPressStopRecord : onPressRecord}
                />
                
                
                <StatusBar />
                
                
                </SafeAreaProvider>
                
            );
        }
    }
    