import {handler} from "./game_handler";
import {loggedStringHandler} from "../node_modules/assemblyscript-sdk/assembly/index";
import {log} from "../node_modules/assemblyscript-sdk/assembly/logger";

export function allocate(size: usize) :i32 {
  return __alloc(size, 1);
}

export function deallocate(ptr: i32, size: usize): void {

}

export function invoke(ptr: i32, size: i32): i32 {
    return loggedStringHandler(ptr, size, handler, log);
}
