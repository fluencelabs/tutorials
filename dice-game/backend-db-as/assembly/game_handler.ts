import {Action, decode, GetBalanceRequest, Request, RollRequest, UnknownRequest} from "./request";
import {ErrorResponse} from "./response";
import {GameManager} from "./dice";
import {log} from "../node_modules/assemblyscript-sdk/assembly/logger";
import {checkSignature} from "../node_modules/signature-connector/assembly/index"

let gameManager = new GameManager();

export function string2Bytes(str: string): Uint8Array {
    let utf8ptr = str.toUTF8();
    let buffer = new Uint8Array(str.lengthUTF8);
    for (let i = 0; i <  buffer.length; i++) {
        buffer[i] = load<u8>(utf8ptr + i);
    }
    return buffer.subarray(0, buffer.length - 1);
}

// returns string, because serialization to a byte array is not compatible with our invoke handlers
export function handler(requestStr: string): string {

    //TODO add admin commands and check signature for this commands
    if (true) {
        log("requestStr: " + requestStr);

        let checkResult = checkSignature(requestStr);

        if (!checkResult.checkPassed) {
            log("Error check signature: " + checkResult.errorMessage)
        }
    }

    let request: Request = decode(string2Bytes(requestStr));

    let response: string;

    if (request.action == Action.Join) {
        log("Handling Join request\n");
        response = gameManager.join();
    } else if (request.action == Action.Roll) {
        log("Handling Roll request\n");
        let r = request as RollRequest;
        response = gameManager.roll(r.playerId, r.betPlacement, r.betSize);
    } else if (request.action == Action.GetBalance) {
        log("Handling GetBalance request\n");
        let r = request as GetBalanceRequest;
        response = gameManager.getBalance(r.playerId);
    } else if (request.action == Action.Unknown) {
        log("Unknown request\n");
        let r = request as UnknownRequest;
        let error = new ErrorResponse(r.message);
        response = error.serialize();
        memory.free(changetype<usize>(error));
    } else {
        let error = new ErrorResponse("Unreachable.");
        response = error.serialize();
    }

    return response;
}
