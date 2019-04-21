#include "sdk/sdk.h"
#include <string.h>

const std::string greeting = "Hello world! From ";

char *invoke(char *str, int length) {
    const std::string request = sdk::read_request<std::string>(str, length);
    // there are some redundant memory copies since it is just an example.
    const std::string response = greeting + request;

    sdk::wasm_log(response);

    return sdk::write_response(response);
}
