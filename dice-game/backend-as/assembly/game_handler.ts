import {Action, decode, GetBalanceRequest, Request, RollRequest, UnknownRequest} from "./request";
import {ErrorResponse} from "./response";
import {GameManager} from "./dice";
import {log} from "./logger";

let gameManager = new GameManager();

function errorResponse(msg: string): string {
    let error = new ErrorResponse(msg);
    return error.serialize();
}

// returns string, because serialization to a byte array is not compatible with our invoke handlers
export function handler(requestBytes: Uint8Array): string {

    let request: Request = decode(requestBytes);

    if (request.action == Action.Join) {
        log("Handling Join request\n");
        return gameManager.join();
    } else if (request.action == Action.Roll) {
        log("Handling Roll request\n");
        let r = request as RollRequest;
        if (r.betPlacementExists == false || r.betSizeExists == false || r.playerIdExists == false) {
            let msg = "Request does not match schema. Missing fields: ";
            if (r.betPlacementExists == false) msg = msg + "'bet_placement',";
            if (r.betSizeExists == false) msg = msg + "'bet_size',";
            if (r.playerIdExists == false) msg = msg + "'player_id'";
            return errorResponse(msg)
        }
        return gameManager.roll(r.playerId, r.betPlacement, r.betSize);
    } else if (request.action == Action.GetBalance) {
        log("Handling GetBalance request\n");
        let r = request as GetBalanceRequest;
        if (r.playerIdExists == false) {
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
