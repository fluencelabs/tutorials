import {JSONDecoder, JSONHandler} from "../node_modules/assemblyscript-json/assembly/decoder";

export enum Action {
    Roll = 1,
    Join = 2,
    GetBalance = 3,
    Unknown = 4,
    Error = 5
}

export abstract class Request {
    public action: Action = null;
}

export class UnknownRequest extends Request {
    public message: string;

    constructor(message: string) {
        super();
        this.action = Action.Unknown;
        this.message = message;
    }

}
export class JoinRequest extends Request {
    constructor() {
        super();
        this.action = Action.Join;
    }
}
export class RollRequest extends Request {
    public readonly playerId: u64;
    public readonly playerIdExists: boolean;
    public readonly betPlacement: u8;
    public readonly betPlacementExists: boolean;
    public readonly betSize: u32;
    public readonly betSizeExists: boolean;
    constructor(playerId: u64, playerIdExists: boolean,  betPlacement: u8, betPlacementExists: boolean, betSize: u32, betSizeExists: boolean) {
        super();
        this.playerId = playerId;
        this.playerIdExists = playerIdExists;
        this.betPlacement = betPlacement;
        this.betPlacementExists = betPlacementExists;
        this.betSize = betSize;
        this.betSizeExists = betSizeExists;
        this.action = Action.Roll;
    }
}
export class GetBalanceRequest extends Request {
    public readonly playerId: u64;
    public readonly playerIdExists: boolean;
    constructor(playerId: u64, playerIdExists: boolean) {
        super();
        this.playerId = playerId;
        this.playerIdExists = playerIdExists;
        this.action = Action.GetBalance;
    }
}

export function decode(bytes: Uint8Array): Request {
    let jsonHandler = new RequestJSONEventsHandler();
    let decoder = new JSONDecoder<RequestJSONEventsHandler>(jsonHandler);

    decoder.deserialize(bytes);

    let action = jsonHandler.action;

    if (!action) {
        return new UnknownRequest("'action' field is not specified.")
    }

    let request: Request;

    if (action == "Join") {
        request = new JoinRequest();
    } else if (action == "Roll") {
        request = new RollRequest(jsonHandler.playerId, jsonHandler.playerIdExists, jsonHandler.betPlacement, jsonHandler.betPlacementExists, jsonHandler.betSize, jsonHandler.betSizeExists)
    } else if (action == "GetBalance") {
        request = new GetBalanceRequest(jsonHandler.playerId, jsonHandler.playerIdExists)
    } else {
        request = new UnknownRequest("There is no request with action: " + action);
    }

    return request;
}

class RequestJSONEventsHandler extends JSONHandler {

    public action: string;
    public playerId: u64;
    public playerIdExists: boolean;
    public betPlacement: u8;
    public betPlacementExists: boolean;
    public betSize: u32;
    public betSizeExists: boolean;
    public outcome: u8;
    public outcomeExists: boolean;
    public playerBalance: u64;
    public playerBalanceExists: boolean;

    setString(name: string, value: string): void {
        if (name == "action") {
            this.action = value;
        }
        // json scheme is not strict, so we won't throw an error on excess fields
    }

    setInteger(name: string, value: i64): void {

        // hacks with `Exists` fields, because 0 and null is the same here
        if (name == "player_id") {
            this.playerId = value as u64;
            this.playerIdExists = true;
        } else if (name == "bet_placement") {
            this.betPlacement = value as u8;
            this.betPlacementExists = this.betPlacement != null;
        } else if (name == "bet_size") {
            this.betSize = value as u32;
            this.betSizeExists = true;
        } else if (name == "outcome") {
            this.outcome = value as u8;
            this.outcomeExists = this.outcome != null;
        } else if (name == "player_balance") {
            this.playerBalance = value as u64;
            this.playerBalanceExists = this.playerBalance != null;
        }

        // json scheme is not strict, so we won't throw an error on excess fields
    }

    pushObject(name: string): bool {
        return true;
    }
}
