import {handler} from "./game_handler";

export function allocate(size: i32) :i32 {
  return __alloc(size, 0);
}

export function deallocate(ptr: i32, size: i32): void {
  __free(ptr)
}

export function invoke(ptr: i32, size: i32): i32 {

    let bb: Uint8Array = new Uint8Array(size);

    for (let i = 0; i < size; i++) {
        bb[i] = load<u8>(ptr + i)
    }

    let result = handler(bb);

    let strLen: i32 = result.length;
    let addr = __alloc(strLen + 4, idof<Array<u8>>());
    for (let i = 0; i < 4; i++) {
      let b: u8 = (strLen >> i * 8) as u8 & 0xFF;
      store<u8>(addr + i, b);
    }

    let strAddr = addr + 4;
    for (let i = 0; i < strLen; i++) {
        let b: u8 = result.charCodeAt(i) as u8;
      store<u8>(strAddr + i, b);
    }

    return addr;
}
