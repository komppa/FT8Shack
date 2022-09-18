# CC = emcc

CFLAGS = -O3 -ggdb3 -fsanitize=address
CPPFLAGS = -std=c11 -I.
LDFLAGS = -lm -fsanitize=address

TARGETS = gen_ft8 
#decode_ft8 test # backl to the previous line

.PHONY: run_tests all clean

all: $(TARGETS)

# run_tests: test
# 	@./test

gen_ft8: gen_ft8.o ft8/constants.o ft8/text.o ft8/pack.o ft8/encode.o ft8/crc.o common/wave.o
	$(CXX) $(LDFLAGS) -o $@ $^


# gen_ft8.c ft8/constants.c ft8/text.c ft8/pack.c ft8/encode.c ft8/crc.c common/wave.c
# docker run --rm -v $(pwd):/src -u $(id -u):$(id -g) emscripten/emsdk emcc 

# docker run --rm -v $(pwd):/src -u $(id -u):$(id -g) emscripten/emsdk emcc gen_ft8.c ft8/constants.c ft8/text.c ft8/pack.c ft8/encode.c ft8/crc.c common/wave.c -o gen_ft8.js
 


# test:  test.o ft8/pack.o ft8/encode.o ft8/crc.o ft8/text.o ft8/constants.o fft/kiss_fftr.o fft/kiss_fft.o
# 	$(CXX) $(LDFLAGS) -o $@ $^

# decode_ft8: decode_ft8.o fft/kiss_fftr.o fft/kiss_fft.o ft8/decode.o ft8/encode.o ft8/crc.o ft8/ldpc.o ft8/unpack.o ft8/text.o ft8/constants.o common/wave.o
# 	$(CXX) $(LDFLAGS) -o $@ $^

clean:
	rm -f *.o ft8/*.o common/*.o fft/*.o $(TARGETS)
install:
	$(AR) rc libft8.a ft8/constants.o ft8/encode.o ft8/pack.o ft8/text.o common/wave.o
	install libft8.a /usr/lib/libft8.a
