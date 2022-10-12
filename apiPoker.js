import React from 'react'
import {
    webViewRender,
    emit,
    useNativeMessage,
} from 'react-native-react-bridge/lib/web'

// Using require since ecma import yells the super long array out to the console
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const { encode_ft8_code } = require('./encode_ft8_code_external')
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const { decode_ft8_code } = require('./decode_ft8_code_external')


var apiPokerGlobal

/**
 * Custom logger.
 * Passes loggable content back to the App.tsx
 */
const log = (text) => {
    emit({
        type: 'LOG',
        data: text
    })
}


const generate_ft8_here = async (message) => {

    log('@generate_ft8_here')

    const memory = new WebAssembly.Memory({
        initial: 256,
        maximum: 256,
        shared: true
    })


    const heap = new Uint16Array(memory.buffer)

    const imports = {
        env: {
            memory: memory
        }
    }
    
    
    log('@generate_ft8_here: importing wasmSource')
    const wasmSource = new Uint8Array(encode_ft8_code) // TODO CRIT is this 8 or 16
    log('@generate_ft8_here: wasmSource imported')

    let wasmModule

    try { 

        log('@generate_ft8_here: initializing wasmModule by compiling wasmSource')
        wasmModule = await WebAssembly.compile(wasmSource)
        log('@generate_ft8_here: compiler wasmSource to wasmModule')



        let wasmInstance
        try {

            log('@generate_ft8_here: creating new instance for wasm')

            // new WebAssembly.Instance(wasmModule, imports);
            const wasmInstance = await WebAssembly.instantiate(wasmModule, imports)

            log('@generate_ft8_here: wasm insntace instantiated')
            log(`@generate_ft8_here: putting message "${message.data}" to the buffer of the wasm instance`)
            
            for (let i = 0; i < 13; i++) {
                new Uint8Array(
                    wasmInstance.exports.memory.buffer,
                    wasmInstance.exports.get_message_in() + i,
                    13
                )[0] = message.data.charCodeAt(i)
                // // TODO initialize message_in buffer from here or better, from C code
            }

            log('@generate_ft8_here: Message sent to buffer of wasm instance')


            log('@generate_ft8_here: Calling gen_ft8 function!')
            const statusCodeGenft8 = wasmInstance.exports.gen_ft8()
            log(`@generate_ft8_here: Function returned status code of "${statusCodeGenft8}"!`)


            // emit({ type: "LOG", data: "Reading heap"})


            log('Ripping audio file from the memory of wasm instance')
            const dataArray = new Uint16Array(
                wasmInstance.exports.memory.buffer,
                wasmInstance.exports.get_audio_buffer(),
                350000
            )

            // TODO any faster method of doing this?
            // TODO what is size of the actual sound? Could this array be minimized down to like 300k?
            log('Changing the format of the buffer to regular non-typed array')
            const returnDataArray = []
            for (let i = 0; i < 350000; i++) {
                returnDataArray.push(
                    dataArray[i]
                )
            }

            log('Sending audio file back to the App!')
            emit({ type: 'saveAndPlayDecodedMessage', data: returnDataArray})

        } catch (e) {
            emit({ type: 'LOG_ERROR_WASMINSTANCE', data: e.message })

        }                

    } catch (e) {
        emit({ type: 'LOG_ERROR_WAMSMODULE', data: e.message })
    }


    

}

const decode_ft8_here = async (message) => {



    let new_arr = []
    for (let i = 0; i < 350000; i++) {

        if (i == 18) {  // @ index 18, 'data' should start
            log('is now 18')
            // Seek start of data
            for (let j = i; j < i + 50; j++) {  // Limit for searching 'data' is current position + 50
                // [64, 61, 74, 61] EQUALS ['d', 'a', 't', 'a'] EQUALS [25697, 29793]
                if (
                    message.data[j] === 25697 &&
                    message.data[j + 1] === 29793
                ) {
                    log(`SETTING NEW i TO BE ${j}`)
                    i = j
                    break
                }
            }
            // i = 35
        }

        new_arr.push(
            message.data[i]
        )
        
    }

    

    message.data = new_arr
    

    // Get rid of metafata property of the input data.
    // Cut from point where 'data' exists


    // data should start index 18 always

    


    // let decode_ft8_code = fs.readFileSync("../toimi.wasm")


    const decoder_memory = new WebAssembly.Memory({
        initial: 256,
        maximum: 256,
        shared: true
    })


    const decoder_heap = new Uint16Array(decoder_memory.buffer)

    const decoder_imports = {
        env: {
            memory: decoder_memory
        }
    }

    const decoderWasmSource = new Uint8Array(decode_ft8_code) // TODO CRIT is this 8 or 16

    log('decoderWasmSource declared')

    let decoderWasmModule

    try { 

        decoderWasmModule = await WebAssembly.compile(decoderWasmSource)


        let decoderWasmInstance
        
        try {
            // new WebAssembly.Instance(decoderWasmModule, imports);
            const decoderWasmInstance = await WebAssembly.instantiate(decoderWasmModule, decoder_imports)

            log('Initializing audio buffer')
            decoderWasmInstance.exports.initialize_audio_buffer()
            log('Audio buffer initialized')

            // Write audio samples to memory of wasm instance

            /*
            >>> (21065 & 0xff00) >> 8
            82
            >>> (21065 & 0x00ff)
            73
            */

            let writeTip = 0

            for (let i = 0; i < 350000; i++) {    // message.data.length

                /*
                if (i === 18) {
                    i = 35
                }
                */

                new Uint16Array(
                    decoderWasmInstance.exports.memory.buffer,
                    decoderWasmInstance.exports.get_audio_buffer() + writeTip,
                    1
                )[0] = message.data[i]

                /*
                // Write high byte
                new Uint8Array(
                    decoderWasmInstance.exports.memory.buffer,
                    decoderWasmInstance.exports.get_audio_buffer() + writeTip,
                    2
                )[0] = message.data[i] & 0x00FF

                // Write low byte
                new Uint8Array(
                    decoderWasmInstance.exports.memory.buffer,
                    decoderWasmInstance.exports.get_audio_buffer() + writeTip,
                    2
                )[1] = (message.data[i] & 0xFF00) >> 8  // 
                */

                writeTip++
                writeTip++

            }

            let reading_tip_test = 4998 // 0
            let data_in_heap_after_write = []

            for (let i = 0; i < 100; i++) {    // message.data.length

                data_in_heap_after_write.push(
                    new Uint16Array(
                        decoderWasmInstance.exports.memory.buffer,
                        decoderWasmInstance.exports.get_audio_buffer() + reading_tip_test,
                        1
                    )[0].toString(16)
                )

                reading_tip_test++
                reading_tip_test++

            }
    
            log('calling decode_ft8')
            const returnCode = decoderWasmInstance.exports.decode_ft8()
            log(`called decode_ft8 returned status code of ${returnCode}`)

            // Read how many messages got decoded
            const numDecoded = new Uint32Array(
                decoderWasmInstance.exports.memory.buffer,
                decoderWasmInstance.exports.get_msgs_count(),
                1
            )

            const numDecoded2 = new Uint32Array(
                decoderWasmInstance.exports.memory.buffer,
                decoderWasmInstance.exports.num_decoded,
                1
            )

            const numDecodedFromGetter = new Uint32Array(
                decoderWasmInstance.exports.memory.buffer,
                decoderWasmInstance.exports.get_num_decoded(),
                1
            )

            const numOfSamples = new Uint32Array(
                decoderWasmInstance.exports.memory.buffer,
                decoderWasmInstance.exports.get_i0(),
                1
            )


            log(`get_msgs_count()------> ${numDecoded}`)
            log(`num_decoded------> ${numDecoded2}`)
            log(`get_num_decoded()------> ${numDecodedFromGetter}`)

            log(`pointer of get_msgs_count------> ${decoderWasmInstance.exports.get_msgs_count()}`)
            log(`pointer of get_audio_buffer()------> ${decoderWasmInstance.exports.get_audio_buffer()}`)
            
            
            log(`Number of 16 bit samples from ${numOfSamples} (locally total of ${message.data.length} NOTE: ei tarvi matchata)`)

            // GET TEST VARIABLES OUT

            let i0 = new Uint32Array(
                decoderWasmInstance.exports.memory.buffer,
                decoderWasmInstance.exports.get_i0(),
                1
            )[0]

            let i50 = new Uint32Array(
                decoderWasmInstance.exports.memory.buffer,
                decoderWasmInstance.exports.get_i50(),
                1
            )[0]

            let i100 = new Uint32Array(
                decoderWasmInstance.exports.memory.buffer,
                decoderWasmInstance.exports.get_i100(),
                1
            )[0]

            let i150 = new Uint32Array(
                decoderWasmInstance.exports.memory.buffer,
                decoderWasmInstance.exports.get_i150(),
                1
            )[0]

            

            // log(`TESTVARIABLE #${0}=== ${i0} (@${decoderWasmInstance.exports.get_i0()})`)
            // log(`TESTVARIABLE #${50}=== ${i50} (@${decoderWasmInstance.exports.get_i50()})`)
            // log(`TESTVARIABLE #${100}=== ${i100} (@${decoderWasmInstance.exports.get_i100()})`)
            // log(`TESTVARIABLE #${150}=== ${i150} (@${decoderWasmInstance.exports.get_i150()})`)

            // TODO emit messages count and empty array of messages back to react-native
            if (numDecoded[0] === 0) {
                emit({ type: 'LOG', data: '... so we are stopping getting actual messages!!!¤%&' })
                return
            }



            /**
             * GET EACH MESSAGE HERE
             */

            let decodedMessage = {
                score: 0,
                freq: 0,
                time: 0,
                text: ''
            }


            let decodedMessages = []

    
            
            for (let i = 0; i < numDecoded[0]; i++) {


                // Get score of the message (dB).
                const score = new Uint16Array(
                    decoderWasmInstance.exports.memory.buffer,
                    decoderWasmInstance.exports.get_score_by_message_id(i),
                    1
                )

                // Get time of the message.
                // Time consists of two parts also, the first index is integer
                // and the second index holds the decimal part.
                const time = new Uint16Array(
                    decoderWasmInstance.exports.memory.buffer,
                    decoderWasmInstance.exports.get_time_by_message_id(i),
                    2
                )

                // Get frequency of the message.
                // Integer part of the frequeny is in the first index of the output (note, length of new arr is 2).
                // Decimal part on the second index. NOTE: curretly just the integer part is used!
                const freq = new Uint16Array(
                    decoderWasmInstance.exports.memory.buffer,
                    decoderWasmInstance.exports.get_freq_by_message_id(i),
                    2
                )


                // Get text of the message
                const text = new Uint8Array(
                    decoderWasmInstance.exports.memory.buffer,
                    decoderWasmInstance.exports.get_text_by_message_id(i),
                    25
                )
                // Convert ints to ascii
                let textString = ''
                for (let j = 0; j < 25; j++) {  // 25 is hardcoded length of ft8_lib for text message
                    if (text[j] !== 0) {
                        textString += String.fromCharCode(text[j])
                    }
                }


                decodedMessage = {
                    score: score[0],    // integer part used only
                    freq: freq[0] + (freq[1] / 100),
                    time: time[0] + (time[1] / 100),
                    text: textString
                }

                

                // TODO collect messages to array! Not just log each one out
                log(`Message #${i} = ${JSON.stringify(decodedMessage)}`)

                decodedMessages.push(decodedMessage)
            }

            // Read decoded messages from wasm instance
            // const dataArray = new Uint16Array(
            //     decoderWasmInstance.exports.memory.buffer,
            //     decoderWasmInstance.exports.get_audio_buffer(),
            //     400000
            // )

            // TODO any faster method of doing this?
            // TODO what is size of the actual sound? Could this array be minimized down to like 300k?
            // const returnDataArray = []
            // for (let i = 0; i < 400000; i++) {
            //     returnDataArray.push(
            //         dataArray[i]
            //     )
            // }


            log('Sending decoded message back to the App!')
            log(`${JSON.stringify(decodedMessages)}`)
            emit({ type: 'showContent', data: decodedMessages})

        } catch (e) {
            log(`ERR: apiPoker: decode_ft8_here: err: ${e.message}`)
            emit({ type: 'LOG', data: e.message })

        }                

        
    } catch (e) {
        log(`ERR: apiPoker: decode_ft8_here: err(wasmModule): ${e.message}`)
    }



}
    
const ApiPoker = () => {

    // Receive messages from React Native
    useNativeMessage(async (message) => {

        switch(message.type) {
        case 'ENCODE_FT8':
            log('Selected to encode FT8')
            log(`Message that will be encoded: "${message.data}"`)
            generate_ft8_here(message)
            break
        case 'DECODE_FT8':
            log('Selected to decode FT8')
            decode_ft8_here(message)
            break
        default:
            log(`Selection unknown: ${message.type}`)
            break
        }

        return 0   // TODO CRIT remove
        

        /**
         * RETURNING THAT THE ENCODING WOULD NOT BE EXECUTED SINCE WE ARE TESTING DECORED!!!
         */

    }) // End of useNativeMessage

    // Return some JSX since this must be a valid renderable React component
    return (<></>)
    
}


// Not just export default "ApiPoker" since this is WebView
export default webViewRender(<ApiPoker />)