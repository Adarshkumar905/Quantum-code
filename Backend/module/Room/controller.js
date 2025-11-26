import * as crypto from "node:crypto";
import { Room, RoomHistory, Whiteboard } from "./schema.js";

// Existing room functions
export const createRoom = async(req, res) =>{
    try{
        const roomName = req.body.name;
        const length = 6;
        const roomId = crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0 , length);        
        const newRoom = new Room({
            roomName,
            roomId,
        });
        
        await newRoom.save();

        return res.status(201).json({ 
            message: "Room created", 
            roomId: roomId 
        });
    } catch(err){
        return res.status(500).send(err.message);
    }
};

export const getRoomList = async (req, res) =>{
    try{
        const Rooms = await Room.find().lean().exec();
        return res.status(200).send(Rooms);
    }catch(err){
        return res.status(500).send(err.message);
    }
};

export const getRoomById = async (req, res) =>{
    try{
        const id = req.params.id;
    
        const room = await Room.findOne({roomId:id}).lean().exec();

        if(!room){
            return res.status(404).send("Room not found!");
        }

        return res.status(200).send(room);
    }catch(err){
        return res.status(500).send(err.message);
    }
};

// Check if room exists
export const checkRoomExists = async (req, res) => {
    try {
        const { roomId } = req.params;
        const room = await Room.findOne({ roomId }).lean().exec();

        if (room) {
            return res.json({ exists: true });
        } else {
            return res.json({ exists: false });
        }
    } catch (error) {
        return res.status(500).json({ exists: false, error: 'Server error' });
    }
};

// Get ALL rooms for history page
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return res.status(200).json(rooms);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

//Delete room permanently
export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    await Room.deleteOne({ roomId });
    await RoomHistory.deleteMany({ roomId });
    
    if (global.socketCleanup) {
        global.socketCleanup();
    }
    
    return res.status(200).json({ message: "Room deleted" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Room History Functions
export const saveRoomToHistory = async (req, res) => {
    try {
        const { roomId, roomName, userName } = req.body;
        const existingHistory = await RoomHistory.findOne({ roomId, userName });
        if (existingHistory) {
            existingHistory.lastAccessed = new Date();
            await existingHistory.save();
            return res.status(200).json({ message: "Room history updated" });
        } else {
            
            const roomHistory = new RoomHistory({
                roomId,
                roomName,
                userName,
                lastAccessed: new Date()
            });
            await roomHistory.save();
            return res.status(201).json({ message: "Room saved to history" });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getRoomHistory = async (req, res) => {
    try {
        const userName = req.params.userName;
        
        const history = await RoomHistory.find({ userName })
            .sort({ lastAccessed: -1 })
            .lean()
            .exec();
        
        return res.status(200).json(history);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteRoomHistory = async (req, res) => {
    try {
        const { userName, roomId } = req.params;
        await RoomHistory.deleteOne({ roomId, userName });
        return res.status(200).json({ message: "Room deleted from history" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const clearUserHistory = async (req, res) => {
    try {
        const userName = req.params.userName;
        await RoomHistory.deleteMany({ userName });
        return res.status(200).json({ message: "History cleared" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// Save whiteboard data 
export const saveWhiteboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, timestamp } = req.body;
    
    await Whiteboard.findOneAndUpdate(
      { roomId: id },
      { 
        roomId: id,
        data: data,
        lastSaved: new Date(timestamp)
      },
      { upsert: true, new: true }
    );
    
    res.json({ success: true, message: "Whiteboard saved" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save whiteboard" });
  }
};

// Load whiteboard data
export const getWhiteboard = async (req, res) => {
  try {
    const whiteboard = await Whiteboard.findOne({ roomId: req.params.id });
    
    if (whiteboard && whiteboard.data) {
      res.json(whiteboard);
    } else {
      res.json({ 
        data: {
          shapes: [],
          timestamp: Date.now()
        },
        lastSaved: null
      });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to load whiteboard" });
  }
};