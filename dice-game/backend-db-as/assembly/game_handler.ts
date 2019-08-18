import {Action, decode, GetBalanceRequest, Request, RollRequest, UnknownRequest} from "./request";
import {ErrorResponse} from "./response";
import {GameManager} from "./dice";
import {log} from "../node_modules/assemblyscript-sdk/assembly/logger";
import {checkSignature} from "../node_modules/signature-connector/assembly/index"

let gameManager = new GameManager();

export function string2Bytes(str: string): Uint8Array {
    return Uint8Array.wrap(String.UTF8.encode(str));
}

function errorResponse(msg: string): string {
    let error = new ErrorResponse(msg);
    return error.serialize();
}

// returns string, because serialization to a byte array is not compatible with our invoke handlers
export function handler(requestStr: string): string {

    //TODO add admin commands and check signature for this commands
    if (true) {
        log("requestStr: " + requestStr);

        let checkResult = checkSignature(requestStr);

        if (!checkResult.checkPassed) {
            let errorMsg = checkResult.errorMessage as string;
            log("Error check signature: " + errorMsg)
        }
    }

    let requestBytes = string2Bytes(requestStr);
    let request: Request = decode(requestBytes);

    if (request.action == Action.Join) {
        log("Handling Join request\n");
        return gameManager.join();
    } else if (request.action == Action.Roll) {
        log("Handling Roll request\n");
        let r = request as RollRequest;
        if (!r.betPlacementExists || !r.betSizeExists || !r.playerIdExists) {
            let msg = "Request does not match schema. Missing fields: ";
            if (!r.betPlacementExists) msg = msg + "'bet_placement',";
            if (!r.betSizeExists) msg = msg + "'bet_size',";
            if (!r.playerIdExists) msg = msg + "'player_id'";
            return errorResponse(msg)
        }
        return gameManager.roll(r.playerId, r.betPlacement, r.betSize);
    } else if (request.action == Action.GetBalance) {
        log("Handling GetBalance request\n");
        let r = request as GetBalanceRequest;
        if (!r.playerIdExists) {
            return errorResponse("Request does not match schema. Required fields: 'player_id'")
        }
        return gameManager.getBalance(r.playerId);
    } else if (request.action == Action.Unknown) {
        log("Unknown request\n");
        let r = request as UnknownRequest;
        return errorResponse(r.message)
    }

    let response = new ErrorResponse("Unreachable.");
    return response.serialize();
}
