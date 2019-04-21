#ifndef FLUENCE_C_SDK_LOGGER_H
#define FLUENCE_C_SDK_LOGGER_H

#include <string>

namespace sdk {

/**
 * Writes provided string to Wasm VM logger.
 *
 * @param log_message a message that should be logged.
 */
void wasm_log(const std::string &log_message);

}

#endif //FLUENCE_C_SDK_LOGGER_H
