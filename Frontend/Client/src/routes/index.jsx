import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import Spline from "@splinetool/react-spline";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';
import { FaRocket, FaBolt, FaPalette, FaComments, FaLock } from 'react-icons/fa';

export const Route = createFileRoute("/")({
  component: IndexPage,
});
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4200";


function IndexPage() {
  const router = useRouter();
  const [activeCard, setActiveCard] = useState("create");
  const [creatorName, setCreatorName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [shouldAnimateSignIn, setShouldAnimateSignIn] = useState(true);

  const [showDropdown, setShowDropdown] = useState(false);
  
  const mobileMenuRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    setUser(null);
    setShowDropdown(false);
    setShouldAnimateSignIn(false);

    
    const message = document.createElement('div');
    message.textContent = 'Signing out...';
    message.className = 'fixed bottom-20 right-8 bg-gray-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    document.body.appendChild(message);
    
    setTimeout(() => {
      document.body.removeChild(message);
    }, 2000);
  };

  const handleGoogleSignIn = async () => {
    try {
      const { auth, googleProvider } = await import('@/lib/firebase');
      const { signInWithPopup, signInWithRedirect, getRedirectResult } = await import('firebase/auth');

      const isRealMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 768;
      
      // Use redirect for real mobile devices, popup for desktop/dev tools
      if (isRealMobile && isSmallScreen) {
        // Real mobile device - use redirect
        await signInWithRedirect(auth, googleProvider);
      } else {
        // Desktop or dev tools - use popup
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        const userData = {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photo: user.photoURL
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');
        setUser(userData);
        
        const message = document.createElement('div');
        message.textContent = `Welcome ${user.displayName}!`;
        message.className = 'fixed bottom-20 right-8 bg-gray-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        document.body.appendChild(message);
        
        setTimeout(() => {
          if (document.body.contains(message)) {
            document.body.removeChild(message);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      
      const message = document.createElement('div');
      message.textContent = 'Failed to sign in. Please try again.';
      message.className = 'fixed bottom-20 right-8 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      document.body.appendChild(message);
      
      setTimeout(() => {
        if (document.body.contains(message)) {
          document.body.removeChild(message);
        }
      }, 2000);
    }
  };

  // to check if room exists
  const checkRoomExists = async (roomId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/Room/${roomId}/exists`);
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      return data.exists;
    } catch (error) {
      return false;
    }
  };

  // Enter key handlers
  const handleCreateKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
  };

  const handleJoinKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJoin();
    }
  };

  const saveRoomToHistory = async (roomId, roomName) => {
    try {
      const userName = localStorage.getItem('username') || 'Anonymous';
      
      const response = await fetch(`${BACKEND_URL}/Room/history/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          roomName,
          userName
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to save room history');
      }
    } catch (error) {
      console.error('Error saving room history:', error);
    }
  };

  useEffect(() => {
    // Initialize AOS 
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      once: true,
      mirror: false,
      startEvent: 'DOMContentLoaded', 
    });

    // Check screen size
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 760);
      setIsTablet(width >= 760 && width < 1290);
      setIsDesktop(width >= 1290);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && 
          !event.target.closest('.mobile-menu-btn')) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const { auth } = await import('@/lib/firebase');
        const { getRedirectResult } = await import('firebase/auth');
        
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          const userData = {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            photo: user.photoURL
          };
          
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('isLoggedIn', 'true');
          setUser(userData);
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
      }
    };
  
    handleRedirectResult();
  }, []);

  const handleCreate = useCallback(async () => {
    if (!creatorName || !roomName) {
      alert("Please enter both your name and a room name");
      return;
    }
    
    localStorage.setItem('username', creatorName);
    
    // Use backend to create room and get the room ID
    try {
      const response = await fetch(`${BACKEND_URL}/Room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName  
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const roomId = data.roomId; 
        
        // Save to history
        await saveRoomToHistory(roomId, roomName);
        
        router.navigate({
          to: "/room/$id",
          params: { id: roomId },
        });
      } else {
        alert('Failed to create room. Please try again.');
      }
    } catch (error) {
      alert('Error creating room. Please try again.');
    }
  }, [creatorName, roomName, router]);

  const handleJoin = useCallback(async () => {
    if (!joinName || !joinRoomId) {
      alert("Please enter both your name and room ID");
      return;
    }

    // Check if room exists before joining
    const roomExists = await checkRoomExists(joinRoomId);
    
    if (!roomExists) {
      alert("Room does not exist. Please check the room ID.");
      return;
    }

    localStorage.setItem('username', joinName);
    // Save joined room to history
    await saveRoomToHistory(joinRoomId, `Joined Room: ${joinRoomId}`);
    
    // Navigate to the room
    router.navigate({
      to: "/room/$id",
      params: { id: joinRoomId },
    });
  }, [joinName, joinRoomId, router]);

  const switchToJoin = useCallback(() => setActiveCard("join"), []);
  const switchToCreate = useCallback(() => setActiveCard("create"), []);

  const scrollToSection = useCallback((sectionId) => {
    setMobileMenuOpen(false);
    
    setTimeout(() => {
      const sectionElement = document.getElementById(sectionId);
      if (!sectionElement) return;
      const headerHeight = 80;
      const elementPosition = sectionElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }, 150);
  }, []);

  const toggleMobileMenu = useCallback(() => {
      setMobileMenuOpen(!mobileMenuOpen);
  }, [mobileMenuOpen]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="home-container">
      {isDesktop && <div className="background-glow"></div>}

      {/* 3D Spline - Show on desktop and tablet*/}
      {(isDesktop || isTablet) && (
        <div className={`spline-container ${isTablet ? 'tablet' : 'desktop'}`}>
          <Spline 
           data-aos-duration="1000"
            scene="https://prod.spline.design/vYh86KwGQcIycPwx/scene.splinecode"
            onLoad={(spline) => {
              if (spline.setPixelRatio) spline.setPixelRatio(1);
              else if (spline.setQuality) spline.setQuality('low');
              else console.log('Available methods:', Object.keys(spline));
            }} 
            onError={(error) => console.error('Spline error:', error)}
          />
        </div>
      )}

      {/* Main Content is always visible except when mobile menu is open */}
        <>
          {/* Container */}
          <div className="content-wrapper">
            {/* Header */}
            <header className="header">
              {/* Mobile Menu Button */}
              {isMobile && (
                <button 
                  className="mobile-menu-btn"
                  onClick={toggleMobileMenu}
                  aria-label="Toggle menu"
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </button>
              )}

              {/* Logo */}
              <h1 className="logo" data-aos="fade-down" data-aos-duration="1000">
                Quantum Code
              </h1>

              {/* Desktop & Tablet Navigation */}
              {(isTablet || isDesktop) && (
                <nav className="nav-menu">
                  <button
                    onClick={() => scrollToSection("features")}
                    data-aos="fade-down"
                    data-aos-duration="1000"
                    className="nav-link"
                  >
                    Features
                  </button>
                  <button
                    onClick={() => scrollToSection("about")}
                    data-aos="fade-down"
                    data-aos-duration="1500"                    
                    className="nav-link"
                  >
                    About Us
                  </button>
                  <button
                    onClick={() => scrollToSection("contact")}
                    data-aos="fade-down"
                    data-aos-duration="2000"                    
                    className="nav-link"
                  >
                    Contact Us
                  </button>
                  <a
                    data-aos="fade-down"
                    data-aos-duration="2500"                  
                    href="/history"
                    className="nav-link"
                  >
                    History
                  </a>
                </nav>
              )}
                 <div className="relative" ref={dropdownRef}>
                   {!user ? (
                      <button
                      data-aos={shouldAnimateSignIn ? "fade-down" : undefined}
                      data-aos-duration={shouldAnimateSignIn ? "1500" : undefined}
                         className="signin-btn"
                         onClick={handleGoogleSignIn}
                         >
                            Sign In
                      </button>
                      ) : (
                       <div className="relative">
                        <img
                          src={user.photo}
                          alt={user.name}
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full cursor-pointer border-2 border-white transition-transform duration-200 hover:scale-110"
                           onClick={() => setShowDropdown(!showDropdown)}
                         />
                          {showDropdown && (
                           <div className="absolute right-0 mt-3 w-72 bg-gray-900 border border-gray-700 text-white rounded-xl shadow-2xl p-5 z-50">
                             {/* Email */}
                             <p className="text-sm text-gray-400 text-center mb-3">{user.email}</p>
                             
                             {/* Profile section */}
                             <div className="flex flex-col items-center">
                               {/* profile photo */}
                               <img
                                 src={user.photo}
                                 alt={user.name}
                                 className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-blue-500 mb-3"
                               />
                               {/* Name */}
                               <div>
                                 <p className="font-semibold text-lg center mb-4">{user.name}</p>
                               </div>
                               {/* Sign Out Button*/}
                               <button
                                 onClick={handleSignOut}
                                 className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                               >
                                 Sign Out
                               </button>
                             </div>
                           </div>
                       )}
                    </div>
                    )}
                 </div>
            </header>

            {/* Hero Section */}
            <main className="hero-section">
              <div data-aos="fade-right"
                   data-aos-duration="2000"
                   data-aos-offset="300"
                   data-aos-easing="ease-in-sine"
                  className="hero-content">
                {/* Tag Box */}
                <div
                  className="tag-box"
                >
                  <div className="tag-box-inner">
                    INTRODUCING⚡
                  </div>
                </div>

                {/* Title */}
                <h1
                  className="hero-title"
                >
                  CODE SHARE <br /> LIVE
                </h1>

                {/* Description */}
                <p
                  className="hero-description"
                >
                  Code Share Live is a real-time collaborative workspace where
                  developers can instantly sync code in a shared Monaco Editor,
                  whiteboard, and chat.
                </p>

                {/* Buttons */}
                <div
                  className="hero-buttons"
                >
                  <a href="/documentation" className="docs-btn">
                    Documentation
                  </a>
                  <button onClick={() => scrollToSection("features")} className="get-started-btn">
                    Get Started
                  </button>
                </div>
              </div>
            </main>
          </div>

          {/* Features Section */}
          <section id="features" className="features-section">
            <div className="features-header">
              <h2 className="features-title">
                Start Coding Together
              </h2>
              <p className="features-description">
                Create a new room or join an existing one to start collaborating in real-time
              </p>
            </div>
            
            <div className="cards-container">
              {/* Create Room Card */}
              <div
                className={`room-card ${activeCard === "create" ? "active" : ""}`}
                onClick={switchToCreate}
              >
                <h2 className="card-title">
                  Create a Room
                </h2>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="card-input"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  onKeyPress={handleCreateKeyPress}
                  onClick={(e) => e.stopPropagation()}
                />
                <input
                  type="text"
                  placeholder="Enter room name"
                  className="card-input"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  onKeyPress={handleCreateKeyPress}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreate();
                  }}
                  className="card-btn"
                >
                  Create Room
                </button>
              </div>

              {/* Divider */}
              <div className="card-divider">
                <div className="divider-line"></div>
                <span className="divider-text">OR</span>
                <div className="divider-line"></div>
              </div>

              {/* Join Room Card */}
              <div
                className={`room-card ${activeCard === "join" ? 'active' : ''}`}
                onClick={switchToJoin}
              >
                <h2 className="card-title">
                  Join a Room
                </h2>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="card-input"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  onKeyPress={handleJoinKeyPress}
                  onClick={(e) => e.stopPropagation()}
                />
                <input
                  type="text"
                  placeholder="Enter room ID"
                  className="card-input"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  onKeyPress={handleJoinKeyPress}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoin();
                  }}
                  className="card-btn"
                >
                  Join Room
                </button>
              </div>
            </div>
          </section>

          {/* About Us Section */}
          <section id="about" className="about-section">
            <div className="about-container">
              <div className="about-header">
                <h2 className="about-title">
                  About Quantum Code
                </h2>
                <p className="about-subtitle">
                  Revolutionizing the way developers collaborate in real-time
                </p>
              </div>

              <div className="about-grid">
                {/* Vision Card */}
                <div className="about-main-card">
                  <div className="flex items-center gap-3 mb-4"><FaRocket className="text-4xl text-blue-500" /></div>
                  <h3>Our Vision</h3>
                  <p>
                    We're building the future of collaborative coding - where distance is no barrier 
                    to innovation and every developer can contribute seamlessly, regardless of location.
                  </p>
                </div>

                {/* Features Grid */}
                <div className="features-grid">
                  <div className="feature-item">
                    <div className="feature-icon"><FaBolt className="text-xl text-yellow-500" /></div>
                    <div className="feature-content">
                      <h4>Real-time Sync</h4>
                      <p>Code updates instantly across all connected users</p>
                    </div>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-icon"><FaPalette className="text-xl text-purple-500" /></div>
                    <div className="feature-content">
                      <h4>Whiteboard</h4>
                      <p>Visualize ideas and architecture together</p>
                    </div>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-icon"><FaComments className="text-xl text-green-500" /></div>
                    <div className="feature-content">
                      <h4>Live Chat</h4>
                      <p>Communicate without leaving the editor</p>
                    </div>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-icon"><FaLock className="text-xl text-red-500" /></div>
                    <div className="feature-content">
                      <h4>Secure Rooms</h4>
                      <p>Private, encrypted collaboration spaces</p>
                    </div>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="stats-section">
                  <div className="stat-item">
                    <div className="stat-number">10K+</div>
                    <div className="stat-label">Active Developers</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">50K+</div>
                    <div className="stat-label">Code Sessions</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">99.9%</div>
                    <div className="stat-label">Uptime</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">24/7</div>
                    <div className="stat-label">Support</div>
                  </div>
                </div>

                {/* Mission Statement */}
                <div className="mission-card">
                  <div className="mission-content">
                    <h3>Our Mission</h3>
                    <p>
                      To empower developers worldwide with tools that make remote collaboration 
                      as natural and productive as working side-by-side. We believe that when 
                      developers can focus on creating rather than coordinating, amazing things happen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Us Section */}
          <section id="contact" className="contact-section">
            <div className="contact-container">
              <div className="contact-header">
                <h2 className="contact-title">
                  Get In Touch
                </h2>
                <p className="contact-subtitle">
                  Have questions? We'd love to hear from you
                </p>
              </div>

              <div className="contact-content">
                <div className="contact-info">
                  <div className="contact-card">
                    <h3>Contact Information</h3>
                    <div className="contact-item">
                      <strong>Email:</strong>
                      <span>support@quantumcode.com</span>
                    </div>
                    <div className="contact-item">
                      <strong>Phone:</strong>
                      <span>+91 9934121120</span>
                    </div>
                    <div className="contact-item">
                      <strong>Address:</strong>
                      <span>123 Developer Lane, Bhubaneswer City, Pin code 751024</span>
                    </div>
                    <div className="contact-item">
                      <strong>Hours:</strong>
                      <span>24/7 Support Available</span>
                    </div>
                  </div>
                </div>

                <div className="contact-form">
                  <form className="form compact-form">
                    <div className="form-group">
                      <input 
                        type="text" 
                        placeholder="Your Name"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <input 
                        type="email" 
                        placeholder="Your Email"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <input 
                        type="text" 
                        placeholder="Subject"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <textarea 
                        placeholder="Your Message"
                        rows="3"
                        className="form-textarea"
                      ></textarea>
                    </div>
                    <button type="submit" className="form-submit compact-submit">
                      Send Message
                    </button>
                  </form>
                </div>
              </div>
              <div className="social-links">
                    <h4>Follow Us</h4>
                    <div className="social-icons">
                      <a href="https://github.com" className="social-link">
                        <FaGithub className="social-icon" />
                        <span className="social-text">GitHub</span>
                      </a>
                      <a href="https://twitter.com" className="social-link">
                        <FaTwitter className="social-icon" />
                        <span className="social-text">Twitter</span>
                      </a>
                      <a href="https://linkedin.com" className="social-link">
                        <FaLinkedin className="social-icon" />
                        <span className="social-text">LinkedIn</span>
                      </a>
                    </div>
                  </div>
            </div>
          </section>
        </>

      {/* Mobile Menu Dropdown */}
      {isMobile && (
        <div 
          ref={mobileMenuRef}
          className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}
        >
          <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>
          <div className="mobile-menu-content">
            <div className="mobile-menu-header">
              <h2 className="mobile-menu-title">Menu</h2>
              <button className="mobile-menu-close" onClick={closeMobileMenu}>
                ×
              </button>
            </div>
            <button
              onClick={() => scrollToSection("features")}
              className="mobile-nav-link"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="mobile-nav-link"
            >
              About Us
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="mobile-nav-link"
            >
              Contact Us
            </button>
            <a
              href="/history"
              className="mobile-nav-link"
              onClick={closeMobileMenu}
            >
              History
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default IndexPage;
