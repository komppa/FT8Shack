#include "wave.h"
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <inttypes.h>


#ifdef EMSCRIPTEN
#include <emscripten.h>
#else
#include <stdio.h>
#endif

#ifdef EMSCRIPTEN
#define E_ON    1
#else
#define E_ON    0
#endif


#define eprintf(...)    if (E_ON == 0)   ; // printf(__VA_ARGS__);


#ifdef EMSCRIPTEN
EMSCRIPTEN_KEEPALIVE
#endif
int i50 = 2;



#ifdef EMSCRIPTEN
EMSCRIPTEN_KEEPALIVE
#endif
int i100 = 2;



#ifdef EMSCRIPTEN
EMSCRIPTEN_KEEPALIVE
#endif
int i150 = 2;



#ifdef EMSCRIPTEN
EMSCRIPTEN_KEEPALIVE
#endif
int i0 = 0;



// Global variable
#ifdef EMSCRIPTEN
EMSCRIPTEN_KEEPALIVE
#endif
struct audioBuffer buffer;


// Global variables
#ifdef EMSCRIPTEN
EMSCRIPTEN_KEEPALIVE
#endif
struct wasm_messages msgs;



#ifdef EMSCRIPTEN
EMSCRIPTEN_KEEPALIVE
int* get_i50() {
    return &i50;
}
EMSCRIPTEN_KEEPALIVE
int* get_i100() {
    return &i100;
}
EMSCRIPTEN_KEEPALIVE
int* get_i150() {
    return &i150;
}
EMSCRIPTEN_KEEPALIVE
int* get_i0() {
    return &i0;
}
#endif

/**
 * @brief Get the audio buffer of audio buffer pointer
 * So, length is not included.
 */
#ifdef EMSCRIPTEN
EMSCRIPTEN_KEEPALIVE
#endif
uint16_t* get_audio_buffer() {
    return &buffer.audio_p[0];
}


/**
 * @brief Initialize audio buffer
 * 
 * @param buffer Buffer taht will be initialized
 */
#ifdef EMSCRIPTEN
EMSCRIPTEN_KEEPALIVE
#endif
void initialize_audio_buffer() {    // struct audioBuffer *buffer) {

    buffer.length = 0;
    buffer.read_pos = 0;

    for (int i = 0; i < (int)(sizeof(buffer.audio_p) / sizeof(buffer.audio_p[0])); i++) {
        buffer.audio_p[i] = 0;
    }
    
}


/**
 * @brief Custom fwrite function to write payload to heap instead of file using file system
 * 
 * @param ptr Pointer pointing data to be writed
 * @param size_of_data Size of data (how much should be read from the pointer)
 * @param count How many data properties should be read (data * size_of_data)
 * @param file DO NOT USE - Just for compability! Write to this file
 */
#ifdef EMSCRIPTEN
EMSCRIPTEN_KEEPALIVE
void customFwrite(const void *ptr, size_t size_of_data, size_t count, const void *file) {

    // printf("@customWrite: size_of_data=%d and count=%d\n\n", (int)size_of_data, (int)count);


    switch (size_of_data) {

        case 2:

            ;   // This is not a trash

            if (count == 1) {

                // printf("SINGLE WTIE\n");

                // First byte, CORRECT
                int16_t first16Byte = ((*(uint16_t*)(ptr) & 0x000000FF)) << 8;

                // Second byte, CORRENT
                int16_t second16Byte = ((*(uint16_t*)(ptr) & 0x0000FF00) >> 8);

                buffer.audio_p[buffer.length] = first16Byte | second16Byte;
                buffer.length++;

            } else {

                // printf("MULTIPLE WRITE\n");

                uint16_t first16Byte;
                uint16_t second16Byte;

                for (int i = 0; i < count; i++) {

                    // Write bytes as many as needed

                    // TODO remove leading zeros? Verify if works after removal
                    first16Byte = ((*(uint16_t*)(ptr) & 0x000000FF)) << 8;
                    second16Byte = ((*(uint16_t*)(ptr) & 0x0000FF00) >> 8);

                    // Move pointer 16 bit
                    ptr++;
                    ptr++;

                    buffer.audio_p[buffer.length] = first16Byte | second16Byte;
                    buffer.length++;

                }

            }

            break;

        case 4:

            ;   // Indicates a valid code ;) Not starting with variable declaration
            
            /**
             * 
             * THIS WORKS BUT ENDIANESS IS WRONG (IS BIG AND SHOULD BE LITTLE ENDIAN)
             * 
            // Save four byte variable, use two 16 bit "slots"
            buffer.audio_p[buffer.length] = ((*(uint32_t*)(ptr) & 0xFFFF0000) >> 16);
            // Move pointer to save the other part of the 32 bit variable
            buffer.length++;

            // Save the other two bytes of the variable
            buffer.audio_p[buffer.length] = (*(uint32_t*)(ptr) & 0x0000FFFF);
            // Move pointer
            buffer.length++;    // To fullfil 32 variable
            */

            
            // Byte level operations since endianess should be little for this wav

            // First byte, CORRECT
            int16_t first32Byte = ((*(uint32_t*)(ptr) & 0x000000FF)) << 8;

            // Second byte, CORRENT
            int16_t second32Byte = ((*(uint32_t*)(ptr) & 0x0000FF00) >> 8);

            // Third byte, CORRECT
            int16_t third32Byte = ((*(uint32_t*)(ptr) & 0x00FF0000) >> 16) << 8;

            // Fourth byte, CORRENT
            int16_t fourth32Byte = ((*(uint32_t*)(ptr) & 0xFF000000) >> 24);


            buffer.audio_p[buffer.length] = first32Byte | second32Byte;
            buffer.length++;

            
            buffer.audio_p[buffer.length] = third32Byte | fourth32Byte;
            buffer.length++;

            break;

    }


}
#else
// If gcc is used, declare customFwrite function
void customFwrite(const void *ptr, size_t size_of_data, size_t count, const void *file) {
    // fwrite(ptr, size_of_data, count, file);
}
#endif


// Save signal in floating point format (-1 .. +1) as a WAVE file using 16-bit signed integers.
void save_wav(const float* signal, int num_samples, int sample_rate, const char* path)
{
    char subChunk1ID[4] = { 'f', 'm', 't', ' ' };
    uint32_t subChunk1Size = 16; // 16 for PCM
    uint16_t audioFormat = 1; // PCM = 1
    uint16_t numChannels = 1;
    uint16_t bitsPerSample = 16;
    uint32_t sampleRate = sample_rate;
    uint16_t blockAlign = numChannels * bitsPerSample / 8;
    uint32_t byteRate = sampleRate * blockAlign;
    


    char subChunk2ID[4] = { 'd', 'a', 't', 'a' };
    uint32_t subChunk2Size = num_samples * blockAlign;

    char chunkID[4] = { 'R', 'I', 'F', 'F' };
    uint32_t chunkSize = 4 + (8 + subChunk1Size) + (8 + subChunk2Size);
    char format[4] = { 'W', 'A', 'V', 'E' };

    int16_t* raw_data = (int16_t*)malloc(num_samples * blockAlign);
    for (int i = 0; i < num_samples; i++)
    {
        float x = signal[i];
        if (x > 1.0)
            x = 1.0;
        else if (x < -1.0)
            x = -1.0;
        raw_data[i] = (int)(0.5 + (x * 32767.0));
    }

    // FILE* f = fopen(path, "wb");
    int* f;

    // NOTE: works only on little-endian architecture
    customFwrite(chunkID, sizeof(chunkID), 1, f);  
    customFwrite(&chunkSize, sizeof(chunkSize), 1, f); 
    customFwrite(format, sizeof(format), 1, f);    

    customFwrite(subChunk1ID, sizeof(subChunk1ID), 1, f);  
    customFwrite(&subChunk1Size, sizeof(subChunk1Size), 1, f); 
    customFwrite(&audioFormat, sizeof(audioFormat), 1, f); 
    customFwrite(&numChannels, sizeof(numChannels), 1, f); 
    customFwrite(&sampleRate, sizeof(sampleRate), 1, f);   
    customFwrite(&byteRate, sizeof(byteRate), 1, f);   
    customFwrite(&blockAlign, sizeof(blockAlign), 1, f);   
    
    customFwrite(&bitsPerSample, sizeof(bitsPerSample), 1, f); 

    customFwrite(subChunk2ID, sizeof(subChunk2ID), 1, f);  
    customFwrite(&subChunk2Size, sizeof(subChunk2Size), 1, f); 

    customFwrite(raw_data, blockAlign, num_samples, f);

    

    // fclose(f);

    free(raw_data);
}


/**
 * @brief Custom fread function to write payload to heap instead of file using file system
 * 
 * @param ptr Pointer pointing data to be read
 * @param size_of_data Size of data (how much should be read from the pointer)
 * @param count How many data properties should be read (data * size_of_data)
 * @param file DO NOT USE - Just for compability! Write to this file
 */
// #ifdef EMSCRIPTEN
// EMSCRIPTEN_KEEPALIVE
void customFread(const void *ptr, size_t size_of_data, size_t count, const void *file) {

    eprintf("@customRead: size_of_data=%d and count=%d\n\n", (int)size_of_data, (int)count);


    eprintf("--> %d\n", buffer.audio_p[buffer.read_pos]);

    switch (size_of_data) {
        case 2:
            ;   // This is not a trash
            if (count == 1) {
                eprintf("%s\tcase 2:\n", __func__);
                uint16_t first16Byte = (buffer.audio_p[buffer.read_pos] & 0xff00) >> 8;
                uint16_t second16Byte = (buffer.audio_p[buffer.read_pos] & 0x00ff) << 8;
                
                *(uint16_t*)(ptr) = first16Byte | second16Byte;

                eprintf("Hello fisrtByte=%x\tsecondByte=%x\t%x\n",
                    first16Byte,
                    second16Byte,
                    first16Byte | second16Byte
                );

                // Since 16 bit value was read and buffer consists of 16 bit values
                // just one increment to read position index is enough
                buffer.read_pos++;
            } else {

                for (int i = 0; i < count; i++) {

                    uint16_t first16ByteMultiple = (buffer.audio_p[buffer.read_pos] & 0xff00) >> 8;
                    uint16_t second16ByteMultiple = (buffer.audio_p[buffer.read_pos] & 0x00ff) << 8;

                    *(uint16_t*)(ptr) = first16ByteMultiple | second16ByteMultiple;

                    // *(uint16_t*)(ptr) = buffer.audio_p[buffer.read_pos];
                    // Since 16 bit value was read and buffer consists of 16 bit values
                    // just one increment to read position index is enough
                    buffer.read_pos++;
                    ptr++;
                    ptr++;
                }
            }
            break;

        case 4:
            ;   // Indicates a valid code ;) Not starting with variable declaration


            // 'RIFF' code  
            uint32_t first32Byte = ((buffer.audio_p[buffer.read_pos]) & 0x0000FF00) >> 8;
            uint32_t second32Byte = ((buffer.audio_p[buffer.read_pos]) & 0x000000FF) << 8;
            buffer.read_pos++;
            
            uint32_t third32Byte = (buffer.audio_p[buffer.read_pos] & 0x0000FF00) << 8;
            uint32_t fourth32Byte = (buffer.audio_p[buffer.read_pos] & 0x000000FF) << 24;
            
            buffer.read_pos++;


            // 'FFIR' code IS THIS NOW LITTLE ENDIAN?

            // uint32_t first32Byte = ((buffer.audio_p[buffer.read_pos]) & 0xFF00) << 16;
            // uint32_t second32Byte = ((buffer.audio_p[buffer.read_pos]) & 0x00FF) << 16;
            // buffer.read_pos++;
            
            // uint32_t third32Byte = (buffer.audio_p[buffer.read_pos] & 0xFF00);
            // uint32_t fourth32Byte = (buffer.audio_p[buffer.read_pos] & 0x00FF);
            
            // buffer.read_pos++;




            /* ANOTHER RIFF
            uint32_t first32Byte = ((buffer.audio_p[buffer.read_pos]) & 0x00FF) << 8;
            uint32_t second32Byte = ((buffer.audio_p[buffer.read_pos]) & 0xFF00) >> 8;
            buffer.read_pos++;
            
            uint32_t third32Byte = (buffer.audio_p[buffer.read_pos] & 0x00FF) << 16;
            uint32_t fourth32Byte = (buffer.audio_p[buffer.read_pos] & 0xFF00) << 16;
            
            buffer.read_pos++;
            */

            *(uint32_t*)(ptr) = (uint32_t)(first32Byte | second32Byte | third32Byte | fourth32Byte);

            // *(uint32_t*)(ptr) = (uint32_t)(fourth32Byte | third32Byte | second32Byte | first32Byte);

            eprintf("@%s\tcase4: firstByte=%x\tsecondByte=%x\tthirdByte=%x\tfourthByte=%x\tuint32Total=%d\n",
                __func__,
                first32Byte,
                second32Byte,
                third32Byte,
                fourth32Byte,
                (uint32_t)(first32Byte | second32Byte | third32Byte | fourth32Byte)
            );

            break;
    }
}
// #else
// // If gcc is used, declare customFread function
// void customFread(const void *ptr, size_t size_of_data, size_t count, const void *file) {
//     // fread(........);
// }
// #endif


// Load signal in floating point format (-1 .. +1) as a WAVE file using 16-bit signed integers.
int load_wav(float* signal, int* num_samples, int* sample_rate, const char* path)
{
    // printf("@%s %d\t%d\n", __func__, __LINE__, buffer.length);
    char subChunk1ID[4]; // = {'f', 'm', 't', ' '};
    uint32_t subChunk1Size; // = 16;    // 16 for PCM
    uint16_t audioFormat; // = 1;     // PCM = 1
    uint16_t numChannels; // = 1;
    uint16_t bitsPerSample; // = 16;
    uint32_t sampleRate;
    uint16_t blockAlign; // = numChannels * bitsPerSample / 8;
    uint32_t byteRate; // = sampleRate * blockAlign;

    char subChunk2ID[4]; // = {'d', 'a', 't', 'a'};
    uint32_t subChunk2Size; // = num_samples * blockAlign;

    char chunkID[4]; // = {'R', 'I', 'F', 'F'};
    uint32_t chunkSize; // = 4 + (8 + subChunk1Size) + (8 + subChunk2Size);
    char format[4]; // = {'W', 'A', 'V', 'E'};

    // FILE* f = fopen(path, "rb");
    // Fake file
    int* f;

    // TESTING 16 BIT READ
    // char test16Array[2];
    // customFread((void*)test16Array, sizeof(test16Array), 1, f);
    // eprintf("test16Array got '%s'\n", test16Array);
    
    /*
        SUM OF SAMPLES 172560
        
        VALUE IS '-267' (fffffef5) #50000
        VALUE IS '-222' (ffffff22) #100000
        VALUE IS '-1660' (fffff984) #150000
    */

//    uint16_t *testMyVariable;
//    testMyVariable = (int16_t*)malloc(sizeof(testMyVariable) * 4);

//    customFread((void*)testMyVariable, 2, 2, f);
//    eprintf("OUT????   0 = '%x'\n", testMyVariable[0]);
//    eprintf("OUT????   1 = '%x'\n", testMyVariable[1]);
//    return 0;

    // NOTE: works only on little-endian architecture
    customFread((void*)chunkID, sizeof(chunkID), 1, f);
    eprintf("chuckID got '%s'\n", chunkID);
    

    customFread((void*)&chunkSize, sizeof(chunkSize), 1, f);
    eprintf("chunkSize got '%d'\n", chunkSize);

    customFread((void*)format, sizeof(format), 1, f);
    eprintf("format got '%s'\n", format);

    customFread((void*)subChunk1ID, sizeof(subChunk1ID), 1, f);
    eprintf("subChunk1ID got '%s'\n", subChunk1ID);
    
    customFread((void*)&subChunk1Size, sizeof(subChunk1Size), 1, f);
    eprintf("subChunk1Size got '%d'\n", subChunk1Size);
    if (subChunk1Size != 16) {
        eprintf("ERRR %d:subChunk1Size != 16. It is %d\n", __LINE__, subChunk1Size);
        i0 = 101;
        return 101;
    }

    customFread((void*)&audioFormat, sizeof(audioFormat), 1, f);
    eprintf("audioFormat got '%d'\n", audioFormat);

    /*
    chunnkSize 360194
    subChunk1ID 1765266416  // STRING 'fmt '
    subChunk1Size 16
    audioFormat 1
    */

    customFread((void*)&numChannels, sizeof(numChannels), 1, f);
    eprintf("numChannels got '%d'\n", numChannels);

    customFread((void*)&sampleRate, sizeof(sampleRate), 1, f);
    eprintf("sampleRate got '%d'\n", sampleRate);

    customFread((void*)&byteRate, sizeof(byteRate), 1, f);
    eprintf("byteRate got '%d'\n", byteRate);

    customFread((void*)&blockAlign, sizeof(blockAlign), 1, f);
    customFread((void*)&bitsPerSample, sizeof(bitsPerSample), 1, f);
    // printf("@%s\n", __func__);


    if (audioFormat != 1 || numChannels != 1 || bitsPerSample != 16) {
        // printf("ERRRR : %d ::: %d, %d, %d\n", __LINE__,
        //     (int)audioFormat,
        //     (int)numChannels,
        //     (int)bitsPerSample
        // );
        i0 = 102;
        
        return 102;
    }


    // Before reading subChunk2ID, get file reader's tip to point start
    // of the 'data' header on wav file.
        // Empty read to skip ffmpeg's "header"
    // uint8_t empty_uint8t;
    // char empty_char[35];
    // fread((void*)empty_char, sizeof(empty_char), 1, f);

    /**
     * @brief SEEK 'DATA' HEADER FROM FILE
     * 
    char data_start[4];

    for (int i = 0; i < 100; i++) {

        customFread((void*)data_start, sizeof(data_start), 1, f);

        if (strcmp(data_start, "data") == 0) {
            // Current string on file was data - moving backwards 
            // 4 bytes that next fread can get "data" string again
            // fseek(f, -4, SEEK_CUR);
            // 
            buffer.length = buffer.length - 2;
            break;
        }

        // Seek data -3 from current position since
        // fread moved "reading tip" 4 bytes (chars) ahead.
        // fseek(f, -3, SEEK_CUR);
        buffer.length = buffer.length - 2;


    }
    */

    customFread((void*)subChunk2ID, sizeof(subChunk2ID), 1, f);
    customFread((void*)&subChunk2Size, sizeof(subChunk2Size), 1, f);
    // printf("@%s %d\n", __func__, __LINE__);

    //  380640          2            180000
    if (subChunk2Size / blockAlign > *num_samples) {
        // printf("ERRRR : %d\n", __LINE__);
        // printf("subChunk2Size %ld\n", subChunk2Size);
        // printf("blockAlign %d\n", blockAlign);
        // printf("*num_samples %ld\n", *num_samples);
        i0 = 103;
        return 103;
    }
    // printf("@%s %d\n", __func__, __LINE__);
        

    *num_samples = subChunk2Size / blockAlign;
    *sample_rate = sampleRate;

    int16_t* raw_data = (int16_t*)malloc(*num_samples * blockAlign);
    // printf("@%s %d\n", __func__, __LINE__);

    customFread((void*)raw_data, blockAlign, *num_samples, f);
    eprintf("Stream read: blockAlign %d\n", blockAlign);
    // i0 = *num_samples;
    for (int i = 0; i < *num_samples; i++)
    {
        
        if (i == 50000) {
            i50 = (int)raw_data[i];
        }

        if (i == 100000) {
            i100 = (int)raw_data[i];
        }

        if (i == 150000) {
            i150 = (int)raw_data[i];
        }


        // if (i == 100000) eprintf("###   SAMPLE DATA='%d'\n", raw_data[i])
        signal[i] = raw_data[i] / 32768.0f;
    }
    // printf("@%s %d\n", __func__, __LINE__);

    free(raw_data);

    // fclose(f);
    // printf("@%s %d\n", __func__, __LINE__);

    return 0;
}