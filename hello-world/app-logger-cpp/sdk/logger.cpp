#include "logger.h"

namespace sdk {

#define __LOGGER_IMPORT(name) \
    __attribute__((__import_module__("logger"), __import_name__(#name)))

void __write(char ch) __LOGGER_IMPORT(write);
void __flush() __LOGGER_IMPORT(flush);

void wasm_log(const std::string &log_message) {
    for(int byteId = 0; byteId < log_message.size(); ++byteId) {
        __write(log_message[byteId]);
    }

    __flush();
}

} // namespace sdk
