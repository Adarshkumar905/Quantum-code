import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/documentation')({
  component: Documentation,
})

function Documentation() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 py-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Quantum Code Documentation
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Master real-time collaborative coding with our comprehensive guide to every feature and functionality.
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {['Getting Started', 'Room System', 'Code Editor', 'Whiteboard', 'Chat System', 'Real-time Sync', 'Room History', 'Best Practices'].map((section) => (
            <a
              key={section}
              href={`#${section.toLowerCase().replace(' ', '-')}`}
              className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center hover:bg-gray-700 transition-colors"
            >
              <span className="text-sm font-medium text-gray-300 hover:text-white">{section}</span>
            </a>
          ))}
        </div>

        {/* Getting Started */}
        <section id="getting-started" className="mb-12 scroll-mt-8">
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 mb-6">
            <h2 className="text-3xl font-bold mb-6 text-purple-400">🚀 Getting Started</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-green-400">Instant Setup</h3>
                <p className="text-gray-300 mb-4">
                  No accounts or downloads required! Start collaborating in seconds with our frictionless approach.
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li>• Choose any username - you can also register</li>
                  <li>• Your session persists in browser storage</li>
                  <li>• All your work is auto-saved automatically</li>
                  <li>• Works on desktop, tablet, and mobile</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 text-blue-400">Perfect For</h3>
                <ul className="text-gray-300 space-y-3">
                 
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Pair programming sessions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Classroom coding exercises
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Remote team collaboration
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Room System */}
        <section id="room-system" className="mb-12 scroll-mt-8">
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 mb-6">
            <h2 className="text-3xl font-bold mb-6 text-blue-400">🏠 Room System</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-green-400">Creating a Room</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold mt-1 flex-shrink-0">1</div>
                    <div>
                      <p className="font-medium text-white">Enter Your Display Name</p>
                      <p className="text-gray-400 text-sm">This name will be visible to all participants in the room</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold mt-1 flex-shrink-0">2</div>
                    <div>
                      <p className="font-medium text-white">Name Your Room</p>
                      <p className="text-gray-400 text-sm">Choose a descriptive name like "React Components Discussion" or "Algorithm Practice"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold mt-1 flex-shrink-0">3</div>
                    <div>
                      <p className="font-medium text-white">Get Unique Room ID</p>
                      <p className="text-gray-400 text-sm">A unique ID is automatically generated - share this with collaborators</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4 text-purple-400">Joining a Room</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold mt-1 flex-shrink-0">1</div>
                    <div>
                      <p className="font-medium text-white">Enter Your Name</p>
                      <p className="text-gray-400 text-sm">You can use a different name than in previous sessions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold mt-1 flex-shrink-0">2</div>
                    <div>
                      <p className="font-medium text-white">Enter Room ID</p>
                      <p className="text-gray-400 text-sm">Get the exact Room ID from the person who created the room</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold mt-1 flex-shrink-0">3</div>
                    <div>
                      <p className="font-medium text-white">Instant Access</p>
                      <p className="text-gray-400 text-sm">Join immediately and see all participants and their work in real-time</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-2 text-yellow-400">💡 Pro Tip</h4>
              <p className="text-yellow-300 text-sm">
                Room IDs are case-sensitive! Use the "Copy Room ID" button in the room sidebar for error-free sharing. 
                Each room supports unlimited participants and persists until all users leave.
              </p>
            </div>
          </div>
        </section>

        {/* Code Editor */}
        <section id="code-editor" className="mb-12 scroll-mt-8">
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
            <h2 className="text-3xl font-bold mb-6 text-green-400">💻 Smart Code Editor</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-green-400">Powerful Features</h3>
                <ul className="text-gray-300 space-y-3">
                  <li>• <strong>50+ Programming Languages</strong> - Full syntax support</li>
                  <li>• <strong>Live Cursor Tracking</strong> - See everyone's position</li>
                  <li>• <strong>Multi-caret Editing</strong> - Multiple people can type </li>
                  <li>• <strong>Syntax Highlighting</strong> - Professional code coloring</li>
                  <li>• <strong>Auto-completion</strong> - Intelligent code suggestions</li>
                  <li>• <strong>Error Checking</strong> - Real-time syntax validation</li>
                  <li>• <strong>Find & Replace</strong> - Powerful search across code</li>
                  <li>• <strong>Multiple Themes</strong> - Dark/light mode support</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-blue-400">Collaborative Superpowers</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-white">👀 Live Cursor Visibility</p>
                    <p className="text-gray-400 text-sm">See colored cursors and selections from all participants with their usernames</p>
                  </div>
                  <div>
                    <p className="font-medium text-white">⚡ Instant Synchronization</p>
                    <p className="text-gray-400 text-sm">Code changes appear on all screens simultaneously with no perceptible delay</p>
                  </div>
                  <div>
                    <p className="font-medium text-white">🎯 Smart Language Detection</p>
                    <p className="text-gray-400 text-sm">Automatic language detection with manual override option</p>
                  </div>
                  <div>
                    <p className="font-medium text-white">🔧 Professional Tooling</p>
                    <p className="text-gray-400 text-sm">Based on Monaco Editor (VS Code's editor) for enterprise-grade experience</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Whiteboard */}
        <section id="whiteboard" className="mb-12 scroll-mt-8">
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
            <h2 className="text-3xl font-bold mb-6 text-pink-400">🎨 Interactive Whiteboard</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-pink-400">Drawing Tools</h3>
                <ul className="text-gray-300 space-y-3">
                  <li>• <strong>4 Brush Sizes</strong> - S, M, L, XL for different stroke weights</li>
                  <li>• <strong>Full Color Picker</strong> - Complete spectrum with visual selection</li>
                  <li>• <strong>Real-time Sync</strong> - See others drawing as they create</li>
                  <li>• <strong>Undo/Redo</strong> - Step-by-step drawing history</li>
                  <li>• <strong>Clear Canvas</strong> - Instant whiteboard reset</li>
                  <li>• <strong>Mobile Optimized</strong> - Touch-friendly interface</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-orange-400">Practical Use Cases</h3>
                <ul className="text-gray-300 space-y-2">
                  <li>• System architecture diagrams</li>
                  <li>• Algorithm visualization and flowcharts</li>
                  <li>• UI/UX wireframing and mockups</li>
                  <li>• Database schema design</li>
                  <li>• Brainstorming and mind mapping</li>
                  <li>• Code structure planning</li>
                  <li>• Interview problem solving</li>
                  <li>• Educational explanations</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Chat System */}
        <section id="chat-system" className="mb-12 scroll-mt-8">
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
            <h2 className="text-3xl font-bold mb-6 text-cyan-400">💬 Advanced Chat System</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-cyan-400">Public Chat</h3>
                <p className="text-gray-300 mb-4">
                  Group conversations visible to everyone in the room. Perfect for:
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li>• General discussions and announcements</li>
                  <li>• Code reviews and feedback sessions</li>
                  <li>• Group coordination and planning</li>
                  <li>• Q&A sessions with all participants</li>
                  <li>• Sharing links and resources</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-purple-400">Private Chat</h3>
                <p className="text-gray-300 mb-4">
                  One-on-one conversations for focused discussions:
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li>• Personal questions and clarifications</li>
                  <li>• Side conversations without distraction</li>
                  <li>• Confidential discussions</li>
                  <li>• Pair programming coordination</li>
                  <li>• Individual feedback and mentoring</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-green-400">Smart Features</h3>
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-700/30 rounded-lg">
                  <p className="font-semibold text-white mb-2">Unread Indicators</p>
                  <p className="text-gray-400 text-sm">Visual counters show new messages in both public and private chats</p>
                </div>
                <div className="p-4 bg-gray-700/30 rounded-lg">
                  <p className="font-semibold text-white mb-2">User Presence</p>
                  <p className="text-gray-400 text-sm">Real-time notifications when users join or leave the room</p>
                </div>
                <div className="p-4 bg-gray-700/30 rounded-lg">
                  <p className="font-semibold text-white mb-2">Private Alerts</p>
                  <p className="text-gray-400 text-sm">Special notifications for direct messages with sender information</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Real-time Sync */}
        <section id="real-time-sync" className="mb-12 scroll-mt-8">
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
            <h2 className="text-3xl font-bold mb-6 text-purple-400">⚡ Real-time Synchronization</h2>
            
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-blue-400">WebSocket Technology</h3>
                <p className="text-gray-400 text-sm">
                  Persistent real-time connections ensure instant updates across all participants with minimal latency
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-400">Conflict Resolution</h3>
                <p className="text-gray-400 text-sm">
                  Advanced algorithms merge simultaneous changes without data loss or corruption
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-cyan-400">State Management</h3>
                <p className="text-gray-400 text-sm">
                  Distributed state synchronization maintains consistency across all connected clients
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Room History */}
        <section id="room-history" className="mb-12 scroll-mt-8">
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
            <h2 className="text-3xl font-bold mb-6 text-yellow-400">📊 Room History & Management</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-yellow-400">History Features</h3>
                <ul className="text-gray-300 space-y-3">
                  <li>• <strong>Complete Room Log</strong> - View all rooms you've created or joined</li>
                  <li>• <strong>Quick Access</strong> - Easy room ID copying for re-sharing</li>
                  <li>• <strong>Bulk Management</strong> - Select multiple rooms for batch operations</li>
                  <li>• <strong>Auto-refresh</strong> - Real-time updates to room list</li>
                  <li>• <strong>Creation Timestamps</strong> - See when each room was created</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-orange-400">Management Tools</h3>
                <ul className="text-gray-300 space-y-3">
                  <li>• <strong>Single Room Deletion</strong> - Remove individual rooms permanently</li>
                  <li>• <strong>Bulk Deletion</strong> - Select and delete multiple rooms at once</li>
                  <li>• <strong>Clear All</strong> - Remove entire room history with confirmation</li>
                  <li>• <strong>Select All</strong> - Quick selection for mass operations</li>
                  <li>• <strong>Manual Refresh</strong> - Update room list on demand</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section id="best-practices" className="mb-12 scroll-mt-8">
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
            <h2 className="text-3xl font-bold mb-6 text-green-400">🎯 Best Practices & Tips</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-green-400">For Optimal Collaboration</h3>
                <ul className="text-gray-300 space-y-3">
                  <li>• <strong>Use Descriptive Room Names</strong> - Helps participants understand the session purpose</li>
                  <li>• <strong>Establish Communication Rules</strong> - Decide when to use public vs private chat</li>
                  <li>• <strong>Coordinate Editor Usage</strong> - Avoid typing conflicts by communicating intent</li>
                  <li>• <strong>Utilize the Whiteboard</strong> - Great for explaining complex concepts visually</li>
                  <li>• <strong>Save Important Room IDs</strong> - Keep frequently used rooms for quick access</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 text-blue-400">Technical Tips</h3>
                <ul className="text-gray-300 space-y-3">
                  <li>• <strong>Stable Internet</strong> - Ensure reliable connection for best sync performance</li>
                  <li>• <strong>Browser Compatibility</strong> - Works best with Chrome, Firefox, Safari, Edge</li>
                  <li>• <strong>Mobile Experience</strong> - Fully responsive design works on all devices</li>
                  <li>• <strong>Keyboard Shortcuts</strong> - Use standard editor shortcuts for efficiency</li>
                  <li>• <strong>Regular Refreshes</strong> - Refresh the page if experiencing sync issues</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-800">
          <p className="text-gray-400">
            Need help or found a bug? We're constantly improving Quantum Code!
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Built with ❤️ for the developer community worldwide
          </p>
        </div>
      </div>
    </div>
  )
}

export default Documentation