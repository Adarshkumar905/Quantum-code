import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const Route = createFileRoute('/history')({
  component: HistoryPage,
})

function HistoryPage() {
  const [roomHistory, setRoomHistory] = useState([])
  const [selectedRooms, setSelectedRooms] = useState([])
  const [copiedRoomId, setCopiedRoomId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // ======== 💜 Modal States ========
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmAction, setConfirmAction] = useState(() => () => {})
  const [confirmText, setConfirmText] = useState("")

  // Open modal
  const openConfirm = (text, action) => {
    setConfirmText(text)
    setConfirmAction(() => action)
    setShowConfirm(true)
  }

  // Close modal
  const closeConfirm = () => {
    setShowConfirm(false)
  }

  // ======== 🔄 Load ALL rooms =========
  useEffect(() => {
    const fetchAllRooms = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${BACKEND_URL}/Room/all/rooms`)

        if (response.ok) setRoomHistory(await response.json())
      } catch (error) {
        console.error('Error fetching rooms:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAllRooms()
  }, [refreshTrigger])

  // Refresh list
  const refreshHistory = () => setRefreshTrigger(prev => prev + 1)

  // Toggle selection
  const toggleRoomSelection = (roomId) => {
    setSelectedRooms(prev =>
      prev.includes(roomId)
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    )
  }

  // ======== 🗑 SINGLE DELETE WITH MODAL ========
  const deleteSingleRoom = async (roomId, roomName) => {
    openConfirm(
      `Delete "${roomName}" permanently?`,
      async () => {
        try {
          await fetch(`${BACKEND_URL}/Room/delete/${roomId}`, { method: 'DELETE' })
          refreshHistory()
        } catch {
          alert('Error deleting room. Please try again.')
        }
      }
    )
  }

  // ======== ❌ DELETE SELECTED ========
  const deleteSelectedRooms = async () => {
    if (selectedRooms.length === 0) return

    openConfirm(
      `Permanently delete ${selectedRooms.length} room(s)?`,
      async () => {
        try {
          for (const roomId of selectedRooms) {
           await fetch(`${BACKEND_URL}/Room/delete/${roomId}`, { method: 'DELETE' })
          }
          refreshHistory()
        } catch {
          alert('Error deleting rooms. Please try again.')
        }
      }
    )
  }

  // ======== 🧹 CLEAR ALL ========
  const clearAllHistory = async () => {
    if (roomHistory.length === 0) return

    openConfirm(
      `Permanently delete ALL ${roomHistory.length} rooms?`,
      async () => {
        try {
          for (const room of roomHistory) {
            await fetch(`${BACKEND_URL}/Room/delete/${roomId}`, { method: 'DELETE' })
          }
          refreshHistory()
        } catch {
          alert('Error clearing rooms. Please try again.')
        }
      }
    )
  }

  // Select All
  const selectAllRooms = () => {
    setSelectedRooms(selectedRooms.length === roomHistory.length
      ? []
      : roomHistory.map(room => room.roomId)
    )
  }

  // Copy Room ID
  const copyRoomId = async (roomId) => {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopiedRoomId(roomId)
      setTimeout(() => setCopiedRoomId(null), 2000)
    } catch (err) {
      const textArea = document.createElement('textarea')
      textArea.value = roomId
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedRoomId(roomId)
      setTimeout(() => setCopiedRoomId(null), 2000)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // ======== ⏳ LOADING ========
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading rooms...</p>
          </div>
        </div>
      </div>
    )
  }

  // ========================================================
  //                      🌌 MAIN UI
  // ========================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">All Rooms</h1>
          <p className="text-gray-400">Showing {roomHistory.length} created rooms</p>
        </div>

        {roomHistory.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-800 rounded-lg">
            <button onClick={selectAllRooms}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
              {selectedRooms.length === roomHistory.length ? 'Deselect All' : 'Select All'}
            </button>

            {selectedRooms.length > 0 && (
              <button onClick={deleteSelectedRooms}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2">
                <Trash2Icon className="w-4 h-4" /> Delete Selected ({selectedRooms.length})
              </button>
            )}

            <button onClick={clearAllHistory}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors ml-auto">
              Clear All Rooms
            </button>

            <button onClick={refreshHistory}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              Refresh
            </button>
          </div>
        )}

        <div className="space-y-4">
          {roomHistory.length === 0 ? (
            <div className="text-center py-16">
              <ClockIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No rooms yet</h3>
              <p className="text-gray-500">Create your first room to get started</p>
            </div>
          ) : (
            roomHistory.map((room) => (
              <div
                key={room.roomId}
                className={`p-6 bg-gray-800 rounded-lg border-2 transition-all ${
                  selectedRooms.includes(room.roomId)
                    ? 'border-purple-500 bg-purple-900/20'
                    : 'border-gray-700 hover:border-gray-600'
                }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedRooms.includes(room.roomId)}
                      onChange={() => toggleRoomSelection(room.roomId)}
                      className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />

                    <div>
                      <h3 className="text-xl font-semibold mb-1">{room.roomName}</h3>
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="font-mono text-sm bg-gray-700 px-2 py-1 rounded">
                          ID: {room.roomId}
                        </span>
                        <button
                          onClick={() => copyRoomId(room.roomId)}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                          title="Copy Room ID">
                          {copiedRoomId === room.roomId
                            ? <CheckIcon className="w-4 h-4 text-green-400" />
                            : <CopyIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="text-right">
                      <div>Created: {formatDate(room.createdAt)}</div>
                    </div>

                    <button
                      onClick={() => deleteSingleRoom(room.roomId, room.roomName)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete room">
                      <Trash2Icon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ======== 💥 CONFIRMATION MODAL ======== */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-[350px] shadow-xl text-center">
            <h2 className="text-xl font-bold text-white mb-3">Confirm Delete</h2>
            <p className="text-gray-300 text-sm mb-6">{confirmText}</p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => { confirmAction(); closeConfirm(); }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors">
                Yes, Delete
              </button>
              <button
                onClick={closeConfirm}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Icon components
function Trash2Icon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function ClockIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CopyIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
