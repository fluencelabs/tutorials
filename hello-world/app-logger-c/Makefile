TARGET = hello_world
CC = /opt/wasi-sdk/bin/clang
SYSROOT = /opt/wasi-sdk/share/wasi-sysroot
TARGET_TRIPLE = wasm32-unknown-wasi
CFLAGS = -nostartfiles -fvisibility=hidden
LDFLAGS = -Wl,--no-entry,--demangle,--allow-undefined
EXPORT_FUNCS = --export=allocate,--export=deallocate,--export=invoke
SDK = sdk/allocator.c sdk/logger.c

.PHONY: default all clean

default: $(TARGET)
all: default

$(TARGET): main.c $(SDK)
	$(CC) --sysroot=$(SYSROOT) --target=$(TARGET_TRIPLE) $(CFLAGS) $(LDFLAGS) -Wl,$(EXPORT_FUNCS) $^ -o $@.wasm

.PRECIOUS: $(TARGET)

clean:
	-rm -f $(TARGET).wasm
