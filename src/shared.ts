// Messages that we'll send to the client

// Representing a person's position
export type Position = {
  lat: number;
  lng: number;
  id: string;
};

export type OutgoingMessage =
  | {
      type: "add-marker";
      position: Position;
    }
  | {
      type: "remove-marker";
      id: string;
    }
  | {
      type: "counter-update";
      value: number;
    };

export type ChessMoveMessage = {
  type: "chess-move";
  from: string;
  to: string;
  fen: string;
};

export type ChessSyncMessage = {
  type: "chess-sync";
  fen: string;
};

export type ChessMessage = ChessMoveMessage | ChessSyncMessage;
