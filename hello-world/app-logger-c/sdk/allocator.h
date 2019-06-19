#ifndef FLUENCE_C_SDK_ALLOCATOR_H
#define FLUENCE_C_SDK_ALLOCATOR_H

#include <stddef.h> // for size_t

/**
 * Allocates a memory region of a given size.
 *
 * Used by Wasm VM for byte array passing. Should be exported from module.
 *
 * @param size a size of allocated memory region.
 * @return a pointer to the allocated memory region.
 */
void *allocate(size_t size);

/**
 * Frees a memory region.
 *
 * Used by Wasm VM for freeing previous memory allocated by `allocate` function.
 * Should be exported from module.
 *
 * @param ptr a pointer to the previously allocated memory region.
 * @param size a size of the previously allocated memory region.
 */
void deallocate(void *ptr, size_t size);

#endif //FLUENCE_C_SDK_ALLOCATOR_H
