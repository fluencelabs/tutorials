TARGET = hello_world
CC = /opt/wasi-sdk/bin/clang++
SYSROOT = /opt/wasi-sdk/share/wasi-sysroot
TARGET_TRIPLE = wasm32-unknown-wasi
CFLAGS = -nostartfiles -fvisibility=hidden
LDFLAGS = -Wl,--no-entry,--demangle,--allow-undefined
EXPORT_FUNCS = --export=allocate,--export=deallocate,--export=invoke
SDK = sdk/allocator.cpp sdk/logger.cpp sdk/syscalls_stubs.cpp
SRC = main.cpp

.PHONY: default all clean

default: $(TARGET)
all: default

$(TARGET): $(SRC) $(SDK)
	$(CC) --sysroot=$(SYSROOT) --target=$(TARGET_TRIPLE) $(CFLAGS) $(LDFLAGS) -Wl,$(EXPORT_FUNCS) $^ -o $@.wasm

.PRECIOUS: $(TARGET)

clean:
	-rm -f $(TARGET).wasm
