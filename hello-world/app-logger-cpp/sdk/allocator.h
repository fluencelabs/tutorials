#ifndef FLUENCE_C_SDK_ALLOCATOR_H
#define FLUENCE_C_SDK_ALLOCATOR_H

#include <cstddef> // for size_t

namespace sdk {

/**
 * Allocates a memory region of given size.
 *
 * Used by Wasm VM for byte array passing. Should be exported from module.
 *
 * @param size a size of needed memory region.
 * @return a pointer to allocated memory region.
 */
extern "C" void *allocate(size_t size);

/**
 * Frees a memory region.
 *
 * Used by Wasm VM for freeing previous memory allocated by `allocate` function.
 * Should be exported from module.
 *
 * @param ptr the pointer to the previously allocated memory region.
 * @param size the size of the previously allocated memory region.
 */
extern "C" void deallocate(void *ptr, size_t size);

}

#endif //FLUENCE_C_SDK_ALLOCATOR_H
