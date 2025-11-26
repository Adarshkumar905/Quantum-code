import { Schema, model } from "mongoose";
// Room schema
const RoomSchema = new Schema(
  {
    roomId: { type: String, required: true },
    roomName: { type: String },
    code: { type: String, required: false },
    language: { type: String, required: false, default: "javascript" },
  },
  {
    timestamps: true,
  }
);
// RoomHistory schema
const RoomHistorySchema = new Schema(
  {
    roomId: { type: String, required: true },
    roomName: { type: String, required: true },
    userName: { type: String, required: true },
    lastAccessed: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);
// Whiteboard schema
const WhiteboardSchema = new Schema(
  {
    roomId: { 
      type: String, 
      required: true,
      unique: true 
    },
    data: {
      type: Schema.Types.Mixed,
      required: true
    },
    lastSaved: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
  }
);
// Creating models
const Room = model("Room", RoomSchema);
const RoomHistory = model("RoomHistory", RoomHistorySchema);
const Whiteboard = model("Whiteboard", WhiteboardSchema);

export { Room, RoomHistory, Whiteboard };