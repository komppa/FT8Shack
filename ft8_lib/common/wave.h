#ifndef _INCLUDE_WAVE_H_
#define _INCLUDE_WAVE_H_

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C"
{
#endif

    struct audioBuffer {
        uint16_t audio_p[400000];
        uint64_t length;
        uint64_t read_pos;
    };

    struct wasm_message {
        uint16_t score;         // int16_t  cand->score     dB
        uint16_t time_sec[2];   // This replaces "float time_sec" when transmission has started
        uint16_t freq_hz[2];    // float freq_hz
        char text[25];          // char[25] message.text    plain text
    };

    struct wasm_messages {
        int num_decoded;
        struct wasm_message messages[50];   // How many messages can be in 
    };



    uint16_t* get_audio_buffer();

    void initialize_audio_buffer();

    void customFwrite(const void *ptr, size_t size_of_data, size_t count, const void *file);

    void customFread(const void *ptr, size_t size_of_data, size_t count, const void *file);

    // Save signal in floating point format (-1 .. +1) as a WAVE file using 16-bit signed integers.
    void save_wav(const float* signal, int num_samples, int sample_rate, const char* path);

    // Load signal in floating point format (-1 .. +1) as a WAVE file using 16-bit signed integers.
    int load_wav(float* signal, int* num_samples, int* sample_rate, const char* path);

#ifdef __cplusplus
}
#endif

#endif // _INCLUDE_WAVE_H_
