#include "allocator.h"
#include <stdlib.h>

#define UNUSED(x) (void)(x)

namespace sdk {

void *allocate(size_t size) {
    return malloc(size);
}

void deallocate(void *ptr, size_t size) {
    UNUSED(size);
    free(ptr);
}

} // namespace sdk
