#include <stdio.h>

/// Some syscalls could be as the result of importing files like stdio.h that in its turn imports standart I/O
/// descriptors like stdin/stderr/stdout. Each of them is a structure contains some callbacks (e.g.
/// https://github.com/CraneStation/wasi-libc/blob/9bb4cc5c411af8453cbef69c137a4c2337714d89/libc-top-half/musl/src/stdio/stdin.c#L11)
/// These stubs could provide default implementations for syscalls. And please include this file, if you are sure
/// that these syscalls couldn't be used directly.

size_t __stdio_write(FILE *f, const unsigned char *buf, size_t len) {
    return 1;
}

int __stdio_close(FILE *f) {
    return 1;
}

off_t __stdio_seek(FILE *_f, off_t _offset, int _value) {
    return 1;
}

