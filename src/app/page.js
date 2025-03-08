"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const textGradients = [
  "from-pink-500 to-red-400",
  "from-purple-500 to-blue-400",
  "from-yellow-400 to-orange-500",
  "from-green-400 to-teal-500",
  "from-rose-400 to-pink-600",
  "from-fuchsia-500 to-violet-400",
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

  useEffect(() => {
    setTimeout(() => setLoading(false), 2500);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextGradientIndex((prev) => (prev + 1) % textGradients.length);
      setBgGradientIndex((prev) => (prev + 1) % bgGradients.length);
      setSloganIndex((prev) => (prev + 1) % slogans.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{
        backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
      }}
      transition={{ duration: 3, ease: "easeInOut" }}
      className={`w-full h-full bg-gradient-to-br ${bgGradients[bgGradientIndex]} overflow-hidden`}
    >
      {loading ? (
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
        <div className="flex items-center justify-center flex-col space-y-8 mx-auto h-screen">
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center relative"
          >
            <motion.h1
              className={`lg:text-[140px] text-[60px] font-bold text-transparent bg-clip-text bg-gradient-to-r ${textGradients[textGradientIndex]} font-serif`}
            >
              RoomiFy
            </motion.h1>

            {/* Animated Slogan Change */}
            <motion.p
              key={sloganIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="lg:text-3xl text-md font-bold text-white italic tracking-wider"
            >
              {slogans[sloganIndex]}
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="flex items-center flex-col space-y-8"
          >
            <button
              className="bg-gradient-to-r px-12 py-4 from-pink-500 to-red-700 text-white font-semibold rounded-full shadow-2xl transition transform hover:scale-110"
              onClick={() => {
                const newRoom = `room-${Math.random().toString(36).substring(7)}`;
                router.push(`/room/${newRoom}`);
              }}
            >
              Create a room
            </button>
            <div className="flex items-center flex-col space-y-4">
              <input
                type="text"
                onChange={(e) => setRoomId(e.target.value)}
                value={roomId}
                placeholder="Enter room code"
                className="border border-gray-300 rounded-full px-6 py-3 w-full max-w-md focus:outline-none focus:ring-4 focus:ring-pink-500"
              />
              <button
                className="bg-gradient-to-r px-12 py-4 from-purple-500 to-purple-700 text-white font-semibold rounded-full shadow-2xl transition transform hover:scale-110"
                onClick={() => router.push(`/room/${roomId}`)}
              >
                Join a room
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Page;
