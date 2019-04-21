#ifndef FLUENCE_C_SDK_LOGGER_H
#define FLUENCE_C_SDK_LOGGER_H

/**
 * Writes provided string to Wasm VM logger.
 *
 * @param log_message a message that should be logged.
 */
void wasm_log(const char *str, int len);

#endif //FLUENCE_C_SDK_LOGGER_H
