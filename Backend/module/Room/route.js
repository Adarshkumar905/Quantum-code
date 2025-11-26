import {Router} from "express";
import { 
    createRoom, 
    getRoomList, 
    getRoomById,
    getAllRooms,        
    deleteRoom,        
    saveRoomToHistory,
    getRoomHistory,
    deleteRoomHistory,
    clearUserHistory,
    saveWhiteboard,
    getWhiteboard,
    checkRoomExists  // NEW IMPORT
} from "./controller.js";

const router = Router();

// Existing room routes
router.route("/").post(createRoom).get(getRoomList);
router.route("/:id").get(getRoomById);
router.get("/:roomId/exists", checkRoomExists);
router.get("/all/rooms", getAllRooms);
router.delete("/delete/:roomId", deleteRoom);
// Room History routes
router.post("/history/save", saveRoomToHistory);
router.get("/history/:userName", getRoomHistory);
router.delete("/history/:userName/:roomId", deleteRoomHistory);
router.delete("/history/clear/:userName", clearUserHistory);
// Whiteboard routes
router.post("/:id/whiteboard/save", saveWhiteboard);
router.get("/:id/whiteboard", getWhiteboard);

export default router;