"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const textGradients = [
  "text-pink-500",
  "text-purple-500",
  "text-yellow-400",
  "text-green-400",
  "text-rose-400",
  "text-fuchsia-500",
];

const bgGradients = [
  "from-pink-900 via-pink-700 to-red-600",
  "from-purple-900 via-fuchsia-800 to-indigo-700",
  "from-orange-900 via-yellow-700 to-red-500",
  "from-green-900 via-teal-700 to-blue-500",
  "from-rose-900 via-pink-700 to-red-500",
  "from-violet-900 via-indigo-800 to-purple-700",
  "from-amber-900 via-orange-600 to-rose-400",
];

const textStyles = [
  "font-serif",
  "font-sans",
  "font-mono",
  "font-bold italic",
  "font-extrabold tracking-tight",
  "font-light tracking-widest",
];

const slogans = [
  "Sync Your Souls, Play Your Tunes.",
  "Where Music Meets Heartbeats.",
  "Vibe Together, Play Forever.",
  "Connect. Play. Feel the Music.",
  "Tune In, Connect Deep.",
  "Your Music, Your Room, Your Vibe.",
  "Bringing Hearts Together, One Beat at a Time.",
  "The Soundtrack to Your Connections.",
  "Unite Through Music, Stay for the Vibes.",
  "RoomiFy – Where Music and Moments Collide.",
];

const Page = () => {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(true);
  const [textGradientIndex, setTextGradientIndex] = useState(0);
  const [bgGradientIndex, setBgGradientIndex] = useState(0);
  const [sloganIndex, setSloganIndex] = useState(0);
  const [textStyleIndex, setTextStyleIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [particles, setParticles] = useState([]);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [userName, setUserName] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [showJoinNameDialog, setShowJoinNameDialog] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const [validRooms, setValidRooms] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const storedRooms = window.localStorage.getItem("validRooms");
      return storedRooms ? JSON.parse(storedRooms) : [];
    }
    return [];
  });

  // Function to generate random password
  const generateRandomPassword = () => {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
  };

  useEffect(() => {
    const generatedParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 5 + 2,
    }));
    setParticles(generatedParticles);
  }, []);

  useEffect(() => {
    const syncRooms = () => {
      if (typeof window !== "undefined" && window.localStorage) {
        const storedRooms = window.localStorage.getItem("validRooms");
        if (storedRooms) {
          setValidRooms(JSON.parse(storedRooms));
        }
      }
    };

    window.addEventListener("storage", syncRooms);
    return () => window.removeEventListener("storage", syncRooms);
  }, []);

  useEffect(() => {
    setTimeout(() => setLoading(false), 2500);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextGradientIndex((prev) => (prev + 1) % textGradients.length);
      setBgGradientIndex((prev) => (prev + 1) % bgGradients.length);
      setSloganIndex((prev) => (prev + 1) % slogans.length);
      setTextStyleIndex((prev) => (prev + 1) % textStyles.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleJoinRoom = () => {
    let storedRooms = [];
    if (typeof window !== "undefined" && window.localStorage) {
      storedRooms = JSON.parse(window.localStorage.getItem("validRooms") || "[]");
    }

    if (!roomId) {
      setErrorMessage("Please enter a room ID");
    } else {
      const roomExists = storedRooms.find(room => room.id === roomId.trim());
      if (!roomExists) {
        setErrorMessage("Invalid room ID, please enter a valid room ID");
      } else {
        setShowJoinNameDialog(true);
      }
    }
  };

  const handleJoinNameSubmit = async (e) => {
    e.preventDefault();
    if (userName.trim()) {
      setShowJoinNameDialog(false);
      setIsJoiningRoom(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const storedRooms = JSON.parse(window.localStorage.getItem("validRooms") || "[]");
      const room = storedRooms.find(r => r.id === roomId.trim());
      
      router.push(`/room/${roomId.trim()}?user=${encodeURIComponent(userName.trim())}&password=${room.password}`);
    } else {
      setErrorMessage("Please enter your name");
    }
  };

  const handleCreateRoom = () => {
    setShowNameDialog(true);
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    if (userName.trim()) {
      setShowNameDialog(false);
      setIsCreatingRoom(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newRoom = `room-${Math.random().toString(36).substring(7)}`;
      const roomPassword = generateRandomPassword();
      const roomData = {
        id: newRoom,
        password: roomPassword,
        createdAt: Date.now()
      };
      
      const updatedRooms = [...validRooms, roomData];
      setValidRooms(updatedRooms);
      
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("validRooms", JSON.stringify(updatedRooms));
      }
      
      setGeneratedPassword(roomPassword);
      
      router.push(`/room/${newRoom}?user=${encodeURIComponent(userName.trim())}&password=${roomPassword}`);
    } else {
      setErrorMessage("Please enter your name");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{
        backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
      }}
      transition={{ duration: 3, ease: "easeInOut" }}
      className={`w-full h-full bg-gradient-to-br ${bgGradients[bgGradientIndex]} overflow-hidden relative`}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white opacity-20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, -15, 0],
            scale: [1, 1.2, 0.8, 1],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: Math.random() * 4 + 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <AnimatePresence>
        {showNameDialog && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-20"
          >
            <div className="bg-white/95 p-8 rounded-2xl shadow-2xl max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Create Your Room</h2>
              <form onSubmit={handleNameSubmit}>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="w-full bg-purple-600 text-white p-3 rounded-lg font-semibold"
                >
                  Create Room
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showJoinNameDialog && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-20"
          >
            <div className="bg-white/95 p-8 rounded-2xl shadow-2xl max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Join Room</h2>
              <form onSubmit={handleJoinNameSubmit}>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="w-full bg-purple-600 text-white p-3 rounded-lg font-semibold"
                >
                  Join Room
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isCreatingRoom || isJoiningRoom ? (
        <div className="w-screen h-screen flex items-center justify-center bg-gray-900">
          <div className="relative flex items-center justify-center flex-col space-y-4">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full"
            >
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute inset-0 w-14 h-14 border-4 border-transparent border-t-green-400 rounded-full m-auto"
              />
            </motion.div>
            <motion.div
              className="text-white text-xl font-semibold"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              {isCreatingRoom ? "Creating Room..." : "Joining Room..."}
            </motion.div>
            {isCreatingRoom && generatedPassword && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white text-md mt-2 text-center"
              >
                Your Room Password: <span className="font-bold">{generatedPassword}</span>
                <p className="text-sm">Save this password to manage your room and access chat</p>
              </motion.div>
            )}
          </div>
        </div>
      ) : loading ? (
        <div className="w-screen h-screen flex items-center justify-center bg-gray-900">
          <div className="relative flex items-center justify-center">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full"
            />
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute w-14 h-14 border-4 border-transparent border-t-green-400 rounded-full"
            />
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1.2 }}
              transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
              className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center flex-col space-y-8 mx-auto h-screen relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center relative"
          >
            <motion.h1
              className={`lg:text-[140px] text-[60px] font-bold ${textGradients[textGradientIndex]} ${textStyles[textStyleIndex]}`}
              animate={{
                y: [0, -10, 0],
                textShadow: [
                  "0 0 10px rgba(255,255,255,0.5)",
                  "0 0 20px rgba(255,255,255,0.8)",
                  "0 0 10px rgba(255,255,255,0.5)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {"RoomiFy".split("").map((char, index) => (
                <motion.span
                  key={index}
                  animate={{
                    y: Math.sin(Date.now() / 300 + index) * 10,
                  }}
                  transition={{ duration: 0.1 }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              key={sloganIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className={`lg:text-3xl text-md font-bold text-white italic tracking-wider ${textStyles[textStyleIndex]}`}
            >
              {slogans[sloganIndex].split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.1 }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="flex items-center flex-col space-y-8"
          >
            <motion.button
              className="bg-gradient-to-r px-12 py-4 from-pink-500 to-red-700 text-white font-semibold rounded-full shadow-2xl relative overflow-hidden"
              whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(255, 105, 180, 0.8)" }}
              whileTap={{ scale: 0.95 }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              onClick={handleCreateRoom}
            >
              <span className="relative z-10">Create a Room</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.5 }}
              />
            </motion.button>

            <div className="flex items-center flex-col space-y-4">
              <input
                type="text"
                onChange={(e) => setRoomId(e.target.value)}
                value={roomId}
                placeholder="Enter room code"
                className="border border-gray-300 rounded-full px-6 py-3 w-full max-w-md focus:outline-none focus:ring-4 focus:ring-pink-500 bg-white/10 text-white placeholder-gray-300"
              />
              <motion.button
                className="bg-gradient-to-r px-12 py-4 from-purple-500 to-purple-700 text-white font-semibold rounded-full shadow-2xl relative overflow-hidden"
                whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(147, 51, 234, 0.8)" }}
                whileTap={{ scale: 0.95 }}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                onClick={handleJoinRoom}
              >
                <span className="relative z-10">Join a Room</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.5 }}
                />
              </motion.button>

              <AnimatePresence>
                {errorMessage && (
                  <motion.p
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: -10 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="text-red-500 text-sm mt-2"
                  >
                    {errorMessage}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Page;
