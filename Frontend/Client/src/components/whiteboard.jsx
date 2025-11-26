import { useEffect, useRef, useState } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import socket from "@/lib/socket.js";
import { FaUndo, FaTrash } from 'react-icons/fa';

export function Whiteboard({ roomId }) {
  const canvasRef = useRef(null);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const isBroadcastingRef = useRef(false);
  const lastPathsRef = useRef(null);
  const [isUndoClicked, setIsUndoClicked] = useState(false);
  const [isClearClicked, setIsClearClicked] = useState(false);
  const colorInputRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Listen for drawings from other users
  useEffect(() => {
    const handleWhiteboardUpdate = (data) => {
      if (isBroadcastingRef.current) return;

      if (canvasRef.current && data.paths) {
        lastPathsRef.current = data.paths;
        requestAnimationFrame(() => {
          if (canvasRef.current && lastPathsRef.current) {
            canvasRef.current.clearCanvas();
            canvasRef.current.loadPaths(lastPathsRef.current);
          }
        });
      }
    };

    const handleWhiteboardState = (data) => {
      if (canvasRef.current && data.paths && data.paths.length > 0) {
        lastPathsRef.current = data.paths;
        requestAnimationFrame(() => {
          if (canvasRef.current && lastPathsRef.current) {
            canvasRef.current.clearCanvas();
            canvasRef.current.loadPaths(lastPathsRef.current);
            setIsInitialized(true);
          }
        });
      }
    };

    const handleWhiteboardCleared = () => {
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
        lastPathsRef.current = [];
      }
    };

    socket.on("whiteboard-update", handleWhiteboardUpdate);
    socket.on("whiteboard-state", handleWhiteboardState);
    socket.on("whiteboard-cleared", handleWhiteboardCleared);
    socket.emit("whiteboard-join", { roomId });

    return () => {
      socket.off("whiteboard-update", handleWhiteboardUpdate);
      socket.off("whiteboard-state", handleWhiteboardState);
      socket.off("whiteboard-cleared", handleWhiteboardCleared);
    };
  }, [roomId]);

  // Sending drawing to other users
  const sendDrawing = async () => {
    if (canvasRef.current && !isBroadcastingRef.current) {
      try {
        isBroadcastingRef.current = true;
        const paths = await canvasRef.current.exportPaths();
        lastPathsRef.current = paths;
        
        socket.emit("whiteboard-draw", {
          roomId,
          data: { paths }
        });
        
        setTimeout(() => {
          isBroadcastingRef.current = false;
        }, 50);
        
      } catch (error) {
        console.error("Error sending drawing:", error);
        isBroadcastingRef.current = false;
      }
    }
  };

  const handleChange = () => {
    sendDrawing();
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      setIsClearClicked(true);
      setTimeout(() => setIsClearClicked(false), 200);
      canvasRef.current.clearCanvas();
      lastPathsRef.current = [];
      socket.emit("whiteboard-clear", { roomId });
    }
  };

  const undo = async () => {
    if (canvasRef.current) {
      setIsUndoClicked(true);
      setTimeout(() => setIsUndoClicked(false), 200);
      canvasRef.current.undo();

      setTimeout(() => {
        sendDrawing();
      }, 100);
    }
  };

  const handleColorClick = () => {
    colorInputRef.current?.click();
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.currentTarget.blur();
  };

  // canvas with any existing paths
  useEffect(() => {
    const initializeCanvas = async () => {
      if (canvasRef.current && !isInitialized) {
        try {
          setTimeout(async () => {
            if (lastPathsRef.current && lastPathsRef.current.length > 0) {
              await canvasRef.current.loadPaths(lastPathsRef.current);
              setIsInitialized(true);
            }
          }, 500);
        } catch (error) {
          console.error("Error initializing canvas:", error);
        }
      }
    };

    initializeCanvas();
  }, [isInitialized]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-1 sm:p-3 bg-gray-800 border-b border-gray-700 gap-1 sm:gap-0">
        <h3 className="text-white font-semibold text-sm sm:text-lg text-center sm:text-left">
          Whiteboard
        </h3>
        
        <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-4">
          <div className="relative">
            <input
              ref={colorInputRef}
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="absolute opacity-0 w-0 h-0 pointer-events-none"
            />
            <button
              onClick={handleColorClick}
              onMouseDown={handleMouseDown}
              className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-gray-400 hover:border-white transition-colors shadow-lg hover:scale-110 active:scale-95 select-none"
              style={{ backgroundColor: strokeColor }}
              title="Choose color"
            />
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 bg-gray-700 rounded p-1 sm:p-2">
            <div className="text-white px-0 sm:px-2">
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className="sm:w-5 sm:h-5"
              >
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <path d="M11 11l2 2" />
              </svg>
            </div>
            
            <div className="flex gap-0.5 sm:gap-1">
              {[
                { value: 2, label: "S" },
                { value: 4, label: "M" },
                { value: 8, label: "L" },
                { value: 12, label: "XL" }
              ].map((size) => (
                <button
                  key={size.value}
                  onClick={() => setStrokeWidth(size.value)}
                  onMouseDown={handleMouseDown}
                  className={`w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center rounded text-xs font-medium transition-all duration-200 select-none ${
                    strokeWidth === size.value
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-600 text-gray-200 hover:bg-gray-500 hover:text-white"
                  }`}
                  title={size.value === 2 ? "Small" : size.value === 4 ? "Medium" : size.value === 8 ? "Large" : "Extra Large"}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1 sm:gap-2">
            {/* Undo Button */}
            <button 
              onClick={undo}
              onMouseDown={handleMouseDown}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-medium transition-all duration-200 select-none text-xs sm:text-sm flex items-center gap-1 ${
                isUndoClicked 
                  ? "bg-blue-800 text-white scale-95 shadow-inner" 
                  : "bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 shadow-md"
              }`}
            >
              <FaUndo className="text-xs sm:text-sm" />
              <span className="hidden sm:inline">Undo</span>
            </button>

            {/* Clear Button */}
            <button 
              onClick={clearCanvas}
              onMouseDown={handleMouseDown}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-medium transition-all duration-200 select-none text-xs sm:text-sm flex items-center gap-1 ${
                isClearClicked 
                  ? "bg-red-800 text-white scale-95 shadow-inner" 
                  : "bg-red-600 text-white hover:bg-red-500 hover:scale-105 shadow-md"
              }`}
            >
              <FaTrash className="text-xs sm:text-sm" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area for mobile */}
      <div className="flex-1 bg-white touch-none">
        <ReactSketchCanvas
          ref={canvasRef}
          strokeWidth={strokeWidth}
          strokeColor={strokeColor}
          canvasColor="#FFFFFF"
          onChange={handleChange}
          width="100%"
          height="100%"
          style={{
            outline: 'none',
            border: 'none'
          }}
          className="focus:outline-none focus:border-none focus:ring-0 select-none touch-none"
        />
      </div>
    </div>
  );
}
