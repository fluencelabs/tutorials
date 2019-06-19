#ifndef FLUENCE_C_SDK_RR_H
#define FLUENCE_C_SDK_RR_H

#include "allocator.h"
#include <string>
#include <cstdint>

namespace sdk {

/**
 * Converts request from a raw pointer and size to some C++-structure (like std::string, std::vector).
 *
 * @param ptr a pointer to provided request.
 * @param length a length of provided request.
 */
template <typename T>
T read_request(char *ptr, int length) {
    const auto res = T(ptr, length);

    sdk::deallocate(static_cast<void *>(ptr), 0);
    return res;
}

/**
 * Writes response to the Wasm VM format.
 *
 * @param arg a response that should be written.
 * @return length a pointer to written buffer.
 */
template <typename T>
char *write_response(const T &arg) {
    const int RESPONSE_BYTES_COUNT = 4;
    const auto response = (char *)sdk::allocate(arg.size() + RESPONSE_BYTES_COUNT);

    int byteId = 0;
    for(; byteId < RESPONSE_BYTES_COUNT; ++byteId) {
        response[byteId] = (arg.size() >> 8*byteId) & 0xFF;
    }

    for(const auto &elem: arg) {
        ++byteId;
        response[byteId + RESPONSE_BYTES_COUNT] = elem;
    }

    return response;
}

} // namespace sdk

#endif //FLUENCE_C_SDK_RR_H
