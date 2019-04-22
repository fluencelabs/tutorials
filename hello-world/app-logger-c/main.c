#include "sdk/allocator.h"
#include "sdk/logger.h"
#include <string.h>

const char *const greeting = "Hello world! From ";
const int RESPONSE_SIZE_BYTES = 4;

char *invoke(const char *str, int length) {
    const size_t greeting_length = strlen(greeting);
    // TODO: add check for overflow
    const size_t response_length = length + greeting_length;

    char *response = (char *)allocate(response_length + RESPONSE_SIZE_BYTES);

    wasm_log(str, length);

    for(int i = 0; i < RESPONSE_SIZE_BYTES; ++i) {
        response[i] = (response_length >> 8*i) & 0xFF;
    }

    memcpy(response + RESPONSE_SIZE_BYTES, greeting, greeting_length);
    memcpy(response + RESPONSE_SIZE_BYTES + greeting_length, str, length);

    return response;
}
