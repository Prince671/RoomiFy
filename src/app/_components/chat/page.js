"use client";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { FaImage, FaMicrophone, FaMapMarkerAlt, FaPaperclip, FaReply, FaEye, FaQuestionCircle, FaArrowRight, FaSmile, FaCamera, FaEllipsisV, FaTrash, FaPlay, FaPause, FaThumbtack, FaLock } from "react-icons/fa";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

const ChatRoom = ({ roomId, hostname: initialHostname = "Unknown Host" }) => {
  const socket = useMemo(() => io("https://lovetunes-2.onrender.com", { transports: ["websocket"] }), []);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [userId, setUserId] = useState("");
  const [roomUsers, setRoomUsers] = useState([]);
  const [videoId, setVideoId] = useState("");
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [videoTitle, setVideoTitle] = useState("Unknown video");
  const [mediaFile, setMediaFile] = useState(null);
  const [viewOnceMedia, setViewOnceMedia] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [location, setLocation] = useState(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isSomeoneTyping, setIsSomeoneTyping] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const scroll = useRef();
  const [modal, setModal] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const [viewingOnceMedia, setViewingOnceMedia] = useState(null);
  const notificationTone = useRef(null);
  const mediaRecorder = useRef(null);
  const leaveTimeouts = useRef({});
  const typingTimeout = useRef(null);
  const isUserAtBottom = useRef(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const visibilityTimeout = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [contextMenu, setContextMenu] = useState(null);
  const [reactionPicker, setReactionPicker] = useState(null);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const audioChunks = useRef([]);
  const [roomInfoOpen, setRoomInfoOpen] = useState(false);
  const [hostname, setHostname] = useState(initialHostname);
  const [userNames, setUserNames] = useState({});
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(true); // Changed to true to always show on join
  const [username, setUsername] = useState("");
  const [destroyRoomModal, setDestroyRoomModal] = useState(false);
  const [destroyPassword, setDestroyPassword] = useState("");
  const [roomPassword] = useState("admin123"); // Simulated room password

  // Load chat from localStorage on mount
  useEffect(() => {
    const storedChat = localStorage.getItem(`chat_${roomId}`);
    if (storedChat) {
      setChat(JSON.parse(storedChat));
    }
  }, [roomId]);

  // Save chat to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`chat_${roomId}`, JSON.stringify(chat));
  }, [chat, roomId]);

  // Clear chat function
  const clearChat = () => {
    setChat([]);
    localStorage.removeItem(`chat_${roomId}`);
    setMenuOpen(false);
  };

  // Handle username submission
  const handleUsernameSubmit = () => {
    if (username.trim()) {
      localStorage.setItem(`username_${roomId}`, username.trim());
      setUsernameDialogOpen(false);
      setUserId(uuidv4()); // Set userId here after username is confirmed
      socket.emit("set-username", { roomId, userId, username: username.trim() });
      socket.emit("join-room", roomId); // Join room after setting username
    } else {
      alert("Please enter a valid username.");
    }
  };

  // User interaction handling
  useEffect(() => {
    const handleInteraction = () => {
      setUserInteracted(true);
      window.removeEventListener("click", handleInteraction);
    };
    window.addEventListener("click", handleInteraction);
    return () => window.removeEventListener("click", handleInteraction);
  }, []);

  // Handle username updates
  useEffect(() => {
    socket.on("username-update", ({ userId, username }) => {
      setUserNames((prev) => ({ ...prev, [userId]: username }));
    });

    return () => {
      socket.off("username-update");
    };
  }, [socket]);

  // Visibility change handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        visibilityTimeout.current = setTimeout(() => {
          socket.emit("leave-room", roomId);
          socket.emit("user-left", userId);
        }, 3000);
      } else {
        if (visibilityTimeout.current) {
          clearTimeout(visibilityTimeout.current);
        }
        if (userId) socket.emit("join-room", roomId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (visibilityTimeout.current) clearTimeout(visibilityTimeout.current);
    };
  }, [socket, roomId, userId]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => console.log("Connected to server"));
    socket.on("receive-message", (data) => {
      if (!data || (!data.message && !data.content)) return;
      if (!data.messageId) data.messageId = uuidv4();
      data.isViewed = data.type === "view-once" ? false : true;
      data.timestamp = new Date().toLocaleTimeString();
      data.reactions = data.reactions || {};
      data.isPinned = data.isPinned || false;
      setChat((prev) => [...prev, data]);
      if (userInteracted && notificationTone.current) {
        notificationTone.current.play().catch((err) => console.error("Error playing tone:", err));
      }
    });
    socket.on("room-users", (users) => setRoomUsers(users));
    socket.on("user-joined", (userId) => {
      setChat((prev) => [...prev, { 
        type: "system", 
        message: `${userNames[userId] || "A user"} has joined the chat`, 
        senderId: "system", 
        messageId: uuidv4(), 
        timestamp: new Date().toLocaleTimeString() 
      }]);
      setRoomUsers((prev) => [...new Set([...prev, userId])]);
    });
    socket.on("user-left", (userId) => {
      setChat((prev) => [...prev, { 
        type: "system", 
        message: `${userNames[userId] || "A user"} has left the chat`, 
        senderId: "system", 
        messageId: uuidv4(), 
        timestamp: new Date().toLocaleTimeString() 
      }]);
      if (leaveTimeouts.current[userId]) clearTimeout(leaveTimeouts.current[userId]);
      leaveTimeouts.current[userId] = setTimeout(() => {
        setRoomUsers((prev) => prev.filter((id) => id !== userId));
        delete leaveTimeouts.current[userId];
      }, 5000);
    });
    socket.on("play-video", (videoId, videoTitle) => {
      setVideoId(videoId);
      setVideoTitle(videoTitle);
      if (player && userInteracted) {
        player.loadVideoById(videoId);
        player.playVideo();
        setIsPlaying(true);
      }
    });
    socket.on("pause-video", () => {
      if (player) {
        player.pauseVideo();
        setIsPlaying(false);
      }
    });
    socket.on("video-state", (isPlaying) => {
      setIsPlaying(isPlaying);
      if (player && userInteracted) {
        isPlaying ? player.playVideo() : player.pauseVideo();
      }
    });
    socket.on("typing", (senderId) => {
      if (senderId !== userId) setIsSomeoneTyping(true);
    });
    socket.on("stop-typing", (senderId) => {
      if (senderId !== userId) setIsSomeoneTyping(false);
    });
    socket.on("message-selected", ({ messageId, senderId }) => {
      if (senderId !== userId) {
        setChat((prev) =>
          prev.map((msg) =>
            msg.messageId === messageId ? { ...msg, isSelectedByOther: true } : msg
          )
        );
      }
    });
    socket.on("message-deleted", ({ messageId, deleteFor, deletedBy }) => {
      if (deleteFor === "everyone") {
        setChat((prev) => {
          const index = prev.findIndex((msg) => msg.messageId === messageId);
          if (index === -1) return prev;
          const newChat = [...prev];
          newChat.splice(index, 1, {
            type: "system",
            message: `This message was deleted by ${deletedBy === userId ? "you" : userNames[deletedBy] || "a user"}`,
            senderId: "system",
            messageId: uuidv4(),
            timestamp: new Date().toLocaleTimeString(),
          });
          return newChat;
        });
      } else if (deleteFor === "me") {
        setChat((prev) => prev.filter((msg) => !(msg.messageId === messageId && msg.senderId === userId)));
      }
    });
    socket.on("message-reaction", ({ messageId, userId: reactorId, reaction }) => {
      setChat((prev) =>
        prev.map((msg) => {
          if (msg.messageId === messageId) {
            const reactions = { ...msg.reactions, [reactorId]: reaction };
            return { ...msg, reactions };
          }
          return msg;
        })
      );
    });
    socket.on("message-pinned", ({ messageId, isPinned }) => {
      setChat((prev) =>
        prev.map((msg) =>
          msg.messageId === messageId ? { ...msg, isPinned } : msg
        )
      );
    });
    socket.on("room-destroyed", () => {
      setChat([]);
      setRoomUsers([]);
      setVideoId("");
      setVideoTitle("Unknown video");
      setIsPlaying(false);
      localStorage.removeItem(`chat_${roomId}`);
      localStorage.removeItem(`username_${roomId}`);
      alert("This room has been destroyed by the host.");
    });

    return () => {
      socket.emit("leave-room", roomId);
      socket.off();
      Object.values(leaveTimeouts.current).forEach(clearTimeout);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [socket, player, roomId, userInteracted, userId, userNames]);

  const API_KEY = "AIzaSyCzole9FD046NYTDff6SLCNI-vZe7R_XtI";

  const searchYouTube = async (query) => {
    if (!query.trim()) return;
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&key=${API_KEY}`
      );
      if (!response.ok) throw new Error(`YouTube API error: ${response.status}`);
      const data = await response.json();
      setSearchResults(data.items || []);
    } catch (error) {
      console.error("Error fetching YouTube data:", error);
    }
  };

  // YouTube Player setup
  useEffect(() => {
    if (typeof window.YT === "undefined") {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onload = () => (window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady);
      document.body.appendChild(script);
    } else if (!player) {
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }
  }, []);

  const onYouTubeIframeAPIReady = () => {
    if (videoId && !player) {
      const newPlayer = new window.YT.Player("youtube-player", {
        height: "1",
        width: "1",
        videoId: videoId,
        playerVars: { autoplay: 0, controls: 0, modestbranding: 1, showinfo: 0, fs: 0, rel: 0 },
        events: {
          onReady: (event) => {
            setPlayer(event.target);
            if (isPlaying && userInteracted) event.target.playVideo();
            else event.target.pauseVideo();
          },
          onStateChange: (event) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          },
        },
      });
    }
  };

  useEffect(() => {
    if (videoId && typeof window.YT !== "undefined" && !player) onYouTubeIframeAPIReady();
  }, [videoId]);

  const handlePlayPause = () => {
    if (!videoId) return;
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    if (player) {
      newPlayingState ? player.playVideo() : player.pauseVideo();
    }
    socket.emit(newPlayingState ? "play-video" : "pause-video", roomId, videoId, videoTitle);
  };

  const handleVideoSelect = (videoId, videoTitle) => {
    setVideoId(videoId);
    setVideoTitle(videoTitle);
    socket.emit("play-video", roomId, videoId, videoTitle);
    if (player) {
      player.loadVideoById(videoId);
      player.playVideo();
    }
    setIsPlaying(true);
    setModal(false);
  };

  const handleStopVideo = () => {
    setVideoId("");
    setVideoTitle("Unknown video");
    setIsPlaying(false);
    if (player) {
      player.stopVideo();
    }
    socket.emit("pause-video", roomId);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaFile(reader.result);
        sendMessage("media", reader.result);
      };
      reader.readAsDataURL(file);
    }
    setDropdownOpen(false);
  };

  const handleViewOnceUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setViewOnceMedia(reader.result);
        sendMessage("view-once", reader.result);
      };
      reader.readAsDataURL(file);
    }
    setDropdownOpen(false);
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("audio/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudioBlob(reader.result);
        sendMessage("media", reader.result);
      };
      reader.readAsDataURL(file);
    }
    setDropdownOpen(false);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support audio recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };
      mediaRecorder.current.onstop = () => {
        const audioBlobData = new Blob(audioChunks.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBlob(reader.result);
          if (!isRecordingPaused) {
            sendMessage("media", reader.result);
          }
        };
        reader.readAsDataURL(audioBlobData);
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setIsRecordingPaused(false);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start recording. Please ensure microphone access is granted.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.pause();
      setIsRecordingPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "paused") {
      mediaRecorder.current.resume();
      setIsRecordingPaused(false);
    }
  };

  const stopRecording = (discard = false) => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      setIsRecordingPaused(false);
      if (discard) {
        setAudioBlob(null);
      }
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      stopRecording();
    }
    setDropdownOpen(false);
  };

  useEffect(() => {
    let timer;
    if (isRecording && !isRecordingPaused) {
      timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, isRecordingPaused]);

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleCameraUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        const sendAsViewOnce = confirm("Do you want to send this image as View-Once?");
        if (sendAsViewOnce) {
          setViewOnceMedia(imageData);
          sendMessage("view-once", imageData);
        } else {
          setMediaFile(imageData);
          sendMessage("media", imageData);
        }
      };
      reader.readAsDataURL(file);
    }
    setDropdownOpen(false);
  };

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationData = { latitude, longitude };
          setLocation(locationData);
          sendMessage("location", JSON.stringify(locationData));
        },
        (error) => console.error("Error getting location:", error),
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
    setDropdownOpen(false);
  };

  const sendMessage = (type = "text", content = "") => {
    const trimmedMessage = message.trim();
    if ((type === "text" && !trimmedMessage) || (type !== "text" && !content)) return;

    const data = {
      roomId,
      type,
      message: type === "text" ? trimmedMessage : undefined,
      content: type !== "text" ? content : undefined,
      senderId: userId,
      messageId: uuidv4(),
      replyTo: replyTo ? replyTo.messageId : null,
      timestamp: new Date().toLocaleTimeString(),
      isViewed: type === "view-once" ? false : true,
      reactions: {},
      isPinned: false,
    };

    socket.emit("send-message", data);
    
    if (type === "text") {
      setMessage("");
      socket.emit("stop-typing", { roomId, senderId: userId });
    }
    setMediaFile(null);
    setViewOnceMedia(null);
    setAudioBlob(null);
    setLocation(null);
    setReplyTo(null);
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setMessage(value);
    if (value.trim()) {
      socket.emit("typing", { roomId, senderId: userId });
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit("stop-typing", { roomId, senderId: userId });
      }, 1000);
    } else {
      socket.emit("stop-typing", { roomId, senderId: userId });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && message.trim()) {
      sendMessage("text");
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji.native);
    setEmojiPickerOpen(false);
  };

  useEffect(() => {
    if (scroll.current) {
      const { scrollTop, scrollHeight, clientHeight } = scroll.current;
      isUserAtBottom.current = scrollTop + clientHeight >= scrollHeight - 10;
    }
  }, [chat, isSomeoneTyping]);

  useEffect(() => {
    if (scroll.current && isUserAtBottom.current) {
      scroll.current.scrollTo({
        top: scroll.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chat, isSomeoneTyping]);

  const handleScroll = () => {
    if (scroll.current) {
      const { scrollTop, scrollHeight, clientHeight } = scroll.current;
      isUserAtBottom.current = scrollTop + clientHeight >= scrollHeight - 10;
    }
  };

  const handleViewOnceClick = (msg, index) => {
    if (msg.senderId === userId) {
      alert("You cannot view this media as you are the sender.");
      return;
    }

    if (msg.isViewed) {
      alert("This media has already been viewed.");
      return;
    }

    if (confirm("This media will be deleted after viewing. Continue?")) {
      setViewingOnceMedia({ content: msg.content, type: msg.type });
      setChat((prev) => prev.map((m, i) => (i === index ? { ...m, isViewed: true } : m)));
    }
  };

  const closeViewOnceMedia = (index) => {
    setViewingOnceMedia(null);
    setChat((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReply = (msg) => {
    setReplyTo({
      messageId: msg.messageId,
      message: msg.type === "text" ? msg.message : "Media",
    });
    setSelectedMessage(msg.messageId);
    socket.emit("message-selected", { roomId, messageId: msg.messageId, senderId: userId });
    setContextMenu(null);
  };

  const cancelReply = () => {
    setReplyTo(null);
    setSelectedMessage(null);
  };

  const handleTouchStart = (e, msg) => {
    const touch = e.touches[0];
    msg.touchStartX = touch.clientX;
    msg.touchStartTime = Date.now();
  };

  const handleTouchMove = (e, msg, index) => {
    if (!msg.touchStartX) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - msg.touchStartX;
    if (deltaX > 50) {
      handleReply(msg);
      const messageElement = document.getElementById(`msg-${msg.messageId}`);
      if (messageElement) {
        messageElement.style.transition = "transform 0.3s ease";
        messageElement.style.transform = "translateX(20px)";
        setTimeout(() => {
          messageElement.style.transform = "translateX(0)";
        }, 300);
      }
      msg.touchStartX = null;
    }
  };

  const handleTouchEnd = (e, msg, index) => {
    const touchDuration = Date.now() - (msg.touchStartTime || 0);
    if (touchDuration > 500 && msg.touchStartX) {
      const touch = e.changedTouches[0];
      setContextMenu({
        messageId: msg.messageId,
        index,
        x: touch.clientX,
        y: touch.clientY,
      });
    }
    msg.touchStartX = null;
    msg.touchStartTime = null;
  };

  const handleContextMenu = (e, msg, index) => {
    e.preventDefault();
    setContextMenu({
      messageId: msg.messageId,
      index,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const stopAndSendRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      setIsRecordingPaused(false);
    }
  };

  const handleMarkMessage = (msg) => {
    setSelectedMessage(msg.messageId);
    socket.emit("message-selected", { roomId, messageId: msg.messageId, senderId: userId });
    setContextMenu(null);
  };

  const handleReactToMessage = (msg, index) => {
    setReactionPicker({
      messageId: msg.messageId,
      index,
      x: contextMenu.x,
      y: contextMenu.y,
    });
    setContextMenu(null);
  };

  const handleReactionSelect = (emoji, msg) => {
    const reaction = emoji.native;
    socket.emit("message-reaction", { roomId, messageId: msg.messageId, userId, reaction });
    setReactionPicker(null);
  };

  const handleDeleteMessage = (msg, deleteFor) => {
    socket.emit("message-deleted", { roomId, messageId: msg.messageId, deleteFor, deletedBy: userId });
    setContextMenu(null);
  };

  const handlePinMessage = (msg) => {
    const isPinned = !msg.isPinned;
    socket.emit("message-pinned", { roomId, messageId: msg.messageId, isPinned });
    setContextMenu(null);
  };

  const handleDestroyRoom = () => {
    if (destroyPassword === roomPassword) {
      socket.emit("destroy-room", { roomId, password: destroyPassword });
      setDestroyRoomModal(false);
      setDestroyPassword("");
    } else {
      alert("Incorrect password!");
    }
  };

  useEffect(() => {
    const preventScreenshot = (e) => {
      if (viewingOnceMedia) {
        if (
          (e.key === "PrintScreen") ||
          (e.metaKey && e.key === "s") ||
          (e.ctrlKey && e.key === "s") ||
          (e.metaKey && e.altKey && e.key === "4")
        ) {
          e.preventDefault();
          alert("Screenshots are disabled while viewing view-once media.");
        }
      }
    };

    const preventContextMenu = (e) => {
      if (viewingOnceMedia) e.preventDefault();
    };

    const preventCopy = (e) => {
      if (viewingOnceMedia) {
        e.preventDefault();
        alert("Copying is disabled while viewing view-once media.");
      }
    };

    if (viewingOnceMedia) {
      document.addEventListener("keydown", preventScreenshot);
      document.addEventListener("contextmenu", preventContextMenu);
      document.addEventListener("copy", preventCopy);
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.zIndex = "9999";
      overlay.style.pointerEvents = "none";
      overlay.style.background = "rgba(0, 0, 0, 0.1)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.color = "white";
      overlay.style.fontSize = "20px";
      overlay.style.opacity = "0.5";
      overlay.innerText = "Screenshot Disabled";
      document.body.appendChild(overlay);

      return () => {
        document.removeEventListener("keydown", preventScreenshot);
        document.removeEventListener("contextmenu", preventContextMenu);
        document.removeEventListener("copy", preventCopy);
        document.body.removeChild(overlay);
      };
    }
  }, [viewingOnceMedia]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownOpen && !e.target.closest(".dropdown-container")) {
        setDropdownOpen(false);
      }
      if (emojiPickerOpen && !e.target.closest(".emoji-picker-container")) {
        setEmojiPickerOpen(false);
      }
      if (contextMenu && !e.target.closest(".context-menu")) {
        setContextMenu(null);
      }
      if (reactionPicker && !e.target.closest(".reaction-picker")) {
        setReactionPicker(null);
      }
      if (roomInfoOpen && !e.target.closest(".room-info-dialog")) {
        setRoomInfoOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen, emojiPickerOpen, contextMenu, reactionPicker, roomInfoOpen]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white relative animate-fadeIn">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(${props => props.senderId === userId ? '100%' : '-100%'}); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        @keyframes pulseDots {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes glowWave {
          0% { box-shadow: 0 0 5px rgba(255, 0, 0, 0.5); transform: scale(1); }
          50% { box-shadow: 0 0 15px rgba(255, 0, 0, 1); transform: scale(1.2); }
          100% { box-shadow: 0 0 5px rgba(255, 0, 0, 0.5); transform: scale(1); }
        }
        @keyframes eyeBlink {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.1); }
        }
        @keyframes dialogPop {
          0% { transform: scale(0.8) rotate(-5deg); opacity: 0; }
          50% { transform: scale(1.05) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-in; }
        .animate-slideIn { animation: slideIn 0.3s ease-out forwards; }
        .animate-popIn { animation: popIn 0.3s ease-out forwards; }
        .animate-bounce { animation: bounce 0.5s ease; }
        .animate-pulseDots > span { display: inline-block; animation: pulseDots 1s infinite; }
        .animate-pulseDots > span:nth-child(2) { animation-delay: 0.2s; }
        .animate-pulseDots > span:nth-child(3) { animation-delay: 0.4s; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
        .animate-glowWave { animation: glowWave 1s infinite; }
        .eye-icon-open { animation: eyeBlink 2s infinite; }
        .eye-icon-closed { transform: scaleY(0.1); }
        .dialog-pop { animation: dialogPop 0.5s ease-out forwards; }
        .border-glow {
          border: 2px solid transparent;
          background-clip: padding-box;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.5);
          animation: glowWave 2s infinite alternate;
        }
      `}</style>

      <audio ref={notificationTone} src="/tone.mp3" preload="auto" />
      <div className="text-white font-semibold text-center py-4 text-xs sm:text-sm md:text-base relative z-10">
        <p className="text-base sm:text-lg md:text-xl">{roomUsers.length} Users Online</p>
        <p className="text-xs sm:text-sm md:text-base">Room Code: <span className="font-mono bg-gray-800 px-2 py-1 rounded">{roomId}</span></p>
        <div className="absolute top-2 left-2">
          <FaEye
            className={`text-white text-lg sm:text-xl md:text-2xl cursor-pointer hover:text-indigo-400 transition-colors ${roomInfoOpen ? "eye-icon-open" : "eye-icon-closed"}`}
            onClick={() => setRoomInfoOpen(!roomInfoOpen)}
            title="Room Info"
          />
        </div>
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center space-x-2 sm:space-x-4">
          <FaLock
            className="text-white text-lg sm:text-xl md:text-2xl cursor-pointer hover:text-red-400 transition-colors"
            onClick={() => setDestroyRoomModal(true)}
            title="Destroy Room"
          />
          <FaQuestionCircle
            className="text-white text-lg sm:text-xl md:text-2xl cursor-pointer hover:text-indigo-400 transition-colors"
            onClick={() => setHelpModal(true)}
            title="Help"
          />
          <div className="relative">
            <FaEllipsisV
              className="text-white text-lg sm:text-xl md:text-2xl cursor-pointer hover:text-indigo-400 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              title="More options"
            />
            {menuOpen && (
              <div className="absolute right-0 top-6 sm:top-8 bg-gray-900 rounded-lg p-2 shadow-lg z-20 animate-scaleIn">
                <button
                  onClick={clearChat}
                  className="block w-full text-left p-2 hover:bg-gray-800 text-white text-xs sm:text-sm md:text-base"
                >
                  Clear Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {usernameDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md shadow-xl dialog-pop border-glow">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-white text-center">Welcome to Room {roomId}!</h2>
            <p className="text-white text-sm sm:text-base mb-4 text-center">Please enter your name:</p>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleUsernameSubmit()}
              placeholder="Your Name"
              className="w-full p-3 mb-4 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm sm:text-base"
            />
            <button
              onClick={handleUsernameSubmit}
              className="w-full p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
            >
              Join Chat
            </button>
          </div>
        </div>
      )}

      {roomInfoOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 animate-fadeIn">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md shadow-2xl dialog-pop border-glow">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-white text-center animate-bounce">Room Info</h2>
            <div className="text-white text-sm sm:text-base space-y-3">
              <p><span className="font-semibold">Online Users:</span> {roomUsers.length}</p>
              <p><span className="font-semibold">Host Name:</span> {username}</p>
              <ul className="list-disc pl-5 space-y-2">
                {roomUsers.map((id) => (
                  <li key={id} className="text-xs sm:text-sm">
                    {userNames[id] || "Anonymous"} {id === userId ? "(You)" : ""}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setRoomInfoOpen(false)}
              className="mt-4 w-full p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="w-full mx-auto rounded-xl relative z-10 px-4 md:px-0 flex flex-col flex-grow max-w-[1200px]">
        <div className="flex w-full items-center justify-between py-3 px-5 bg-indigo-700 rounded-t-xl z-20 shadow-lg">
          <div className="flex items-center space-x-3">
            {videoId ? (
              <div className="flex items-center space-x-3">
                <span className="text-xs sm:text-sm md:text-lg font-medium truncate max-w-[150px] md:max-w-[400px]">{videoTitle}</span>
                <button
                  className={`px-2 py-1 sm:px-3 sm:py-1 md:px-4 md:py-2 ${isPlaying ? "bg-indigo-900" : "bg-indigo-500"} text-white rounded-full text-xs sm:text-sm md:text-base hover:bg-indigo-600 transition-colors`}
                  onClick={handlePlayPause}
                >
                  {isPlaying ? "Pause" : "Play"}
                </button>
                <button
                  className="px-2 py-1 sm:px-3 sm:py-1 md:px-4 md:py-2 bg-red-500 text-white rounded-full text-xs sm:text-sm md:text-base hover:bg-red-600 transition-colors"
                  onClick={handleStopVideo}
                >
                  Stop
                </button>
              </div>
            ) : (
              <span className="text-xs sm:text-sm md:text-lg font-medium">No music selected</span>
            )}
          </div>
          <Image 
            src="/music.png" 
            alt="music"
            width={20} 
            height={20} 
            className="sm:w-6 sm:h-6 md:w-8 md:h-8 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => setModal(true)} 
          />
        </div>

        <div id="youtube-player" className="mb-4"></div>

        <div
          className="h-[calc(100vh-300px)] md:h-[calc(100vh-250px)] overflow-y-auto flex flex-col gap-4 py-6 px-4 md:px-8 bg-gray-800 rounded-b-xl z-10 flex-grow shadow-inner"
          ref={scroll}
          onScroll={handleScroll}
        >
          {chat.map((msg, index) => (
            <div
              key={msg.messageId || index}
              id={`msg-${msg.messageId}`}
              className={`flex items-start ${msg.senderId === userId ? "justify-end" : "justify-start"} relative transition-transform duration-300 group ${msg.type === "text" ? "animate-popIn" : "animate-slideIn"}`}
              style={{ animationDelay: `${index * 0.05}s` }}
              onTouchStart={(e) => handleTouchStart(e, msg)}
              onTouchMove={(e) => handleTouchMove(e, msg, index)}
              onTouchEnd={(e) => handleTouchEnd(e, msg, index)}
              onContextMenu={(e) => handleContextMenu(e, msg, index)}
            >
              {msg.senderId !== userId && (
                <Image
                  src="/heart.png"
                  alt="User avatar"
                  width={24}
                  height={24}
                  className="sm:w-8 sm:h-8 md:w-9 md:h-9 mr-3 rounded-full bg-indigo-500 p-1 animate-bounce"
                />
              )}
              <div
                className={`py-3 px-5 max-w-[80%] md:max-w-md rounded-xl ${
                  msg.senderId === userId ? "bg-indigo-600 text-white" : "bg-gray-700 text-white"
                } text-xs sm:text-sm md:text-base ${msg.isSelectedByOther || selectedMessage === msg.messageId ? "border-2 border-yellow-400" : ""} shadow-md relative hover:shadow-lg transition-shadow`}
              >
                {msg.type !== "system" && (
                  <p className="font-bold text-xs sm:text-sm md:text-base mb-1">
                    {userNames[msg.senderId] || "Anonymous"}
                  </p>
                )}
                {msg.isPinned && (
                  <FaThumbtack className="absolute top-1 right-1 text-gray-400 text-xs sm:text-sm md:text-base" />
                )}
                {msg.replyTo && (
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-400 border-l-4 border-indigo-400 pl-2 mb-2">
                    Replying to: {chat.find((m) => m.messageId === msg.replyTo)?.message || "Message not found"}
                  </div>
                )}
                {msg.type === "text" && msg.message}
                {msg.type === "system" && <p className="text-gray-400 italic">{msg.message}</p>}
                {msg.type === "media" && (
                  <>
                    {msg.content?.startsWith("data:image") && (
                      <img src={msg.content} alt="Shared image" className="max-w-full rounded-lg" />
                    )}
                    {msg.content?.startsWith("data:video") && (
                      <video controls className="max-w-full rounded-lg">
                        <source src={msg.content} type="video/mp4" />
                        Your browser does not support the video element.
                      </video>
                    )}
                    {msg.content?.startsWith("data:audio") && (
                      <audio controls className="max-w-full">
                        <source src={msg.content} type="audio/webm" />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </>
                )}
                {msg.type === "view-once" && (
                  <div
                    className="flex items-center cursor-pointer hover:text-indigo-400 transition-colors"
                    onClick={() => handleViewOnceClick(msg, index)}
                  >
                    {msg.senderId === userId ? (
                      <span className="text-gray-300">Sent as View-Once</span>
                    ) : (
                      <>
                        {msg.content?.startsWith("data:image") && (
                          <>
                            <FaEye className="text-white mr-2 text-sm sm:text-base md:text-lg" />
                            <span className="text-gray-300">{msg.isViewed ? "Viewed" : "View Once Image"}</span>
                          </>
                        )}
                        {msg.content?.startsWith("data:video") && (
                          <>
                            <FaEye className="text-white mr-2 text-sm sm:text-base md:text-lg" />
                            <span className="text-gray-300">{msg.isViewed ? "Viewed" : "View Once Video"}</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
                {msg.type === "location" && (
                  <div>
                    <p>Location Shared:</p>
                    {(() => {
                      const { latitude, longitude } = JSON.parse(msg.content);
                      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                      return (
                        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-300 underline">
                          View on Map
                        </a>
                      );
                    })()}
                  </div>
                )}
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 mt-1">{msg.timestamp}</p>
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="absolute -bottom-3 left-0 flex space-x-1">
                    {Object.entries(msg.reactions).map(([reactorId, reaction]) => (
                      <span key={reactorId} className="text-xs bg-gray-600 rounded-full px-1 py-0.5 animate-bounce">
                        {reaction}
                      </span>
                    ))}
                  </div>
                )}
                <FaEllipsisV
                  className="absolute top-1 right-1 text-gray-400 text-xs sm:text-sm md:text-base cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleContextMenu(e, msg, index)}
                />
              </div>
              <FaReply
                className="text-white text-sm sm:text-base md:text-lg ml-3 cursor-pointer hover:text-indigo-400 transition-colors"
                onClick={() => handleReply(msg)}
                title="Reply to this message"
              />
            </div>
          ))}
          {isSomeoneTyping && (
            <div className="flex justify-start">
              <div className="py-3 px-5 max-w-[80%] md:max-w-md rounded-xl bg-gray-700 text-xs sm:text-sm md:text-base text-gray-400 italic shadow-md animate-slideIn">
                Someone is typing
                <span className="animate-pulseDots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="w-full max-w-[1200px] mx-auto py-4 z-20">
          {replyTo && (
            <div className="flex items-center justify-between bg-gray-900 p-3 rounded-lg mb-3 shadow-md animate-scaleIn">
              <p className="text-[10px] sm:text-sm md:text-base text-gray-300 truncate max-w-[80%]">Replying to: {replyTo.message}</p>
              <button className="text-white hover:text-red-400 transition-colors" onClick={cancelReply}>X</button>
            </div>
          )}
          <div className="flex flex-row items-center space-x-3 md:space-x-4 relative bg-indigo-800 rounded-full px-4 py-2 md:px-5 md:py-3 shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="relative emoji-picker-container">
              <FaSmile
                className="text-white text-base sm:text-lg md:text-xl cursor-pointer transform hover:scale-110 transition-transform duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setEmojiPickerOpen(!emojiPickerOpen);
                }}
                title="Emojis"
              />
              {emojiPickerOpen && (
                <div className="absolute bottom-12 left-0 md:bottom-14 z-20 animate-scaleIn">
                  <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="dark" />
                </div>
              )}
            </div>

            <div className="relative dropdown-container">
              <FaPaperclip
                className="text-white text-base sm:text-lg md:text-xl cursor-pointer transform hover:scale-110 transition-transform duration-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen((prev) => !prev);
                }}
                title="Attach"
              />
              {dropdownOpen && (
                <div className="absolute bottom-12 left-0 md:bottom-14 bg-gray-900 rounded-lg p-4 shadow-lg z-20 w-64 md:w-80 max-h-[50vh] overflow-y-auto grid grid-cols-3 gap-4 animate-scaleIn">
                  <label className="flex flex-col items-center cursor-pointer p-2 hover:bg-gray-800 rounded-lg text-white text-xs sm:text-sm md:text-base transition-colors">
                    <input type="file" accept="image/*,video/*" onChange={handleImageUpload} className="hidden" />
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 mb-1">
                      <FaImage className="text-white text-lg" />
                    </div>
                    Gallery
                  </label>
                  <label className="flex flex-col items-center cursor-pointer p-2 hover:bg-gray-800 rounded-lg text-white text-xs sm:text-sm md:text-base transition-colors">
                    <input type="file" accept="image/*" capture="environment" onChange={handleCameraUpload} className="hidden" />
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-600 mb-1">
                      <FaCamera className="text-white text-lg" />
                    </div>
                    Camera
                  </label>
                  <button onClick={handleShareLocation} className="flex flex-col items-center p-2 hover:bg-gray-800 rounded-lg text-white text-xs sm:text-sm md:text-base transition-colors">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-600 mb-1">
                      <FaMapMarkerAlt className="text-white text-lg" />
                    </div>
                    Location
                  </button>
                  <label className="flex flex-col items-center cursor-pointer p-2 hover:bg-gray-800 rounded-lg text-white text-xs sm:text-sm md:text-base transition-colors">
                    <input type="file" accept="image/*,video/*" onChange={handleViewOnceUpload} className="hidden" />
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-600 mb-1">
                      <FaEye className="text-white text-lg" />
                    </div>
                    View-Once
                  </label>
                  <label className="flex flex-col items-center cursor-pointer p-2 hover:bg-gray-800 rounded-lg text-white text-xs sm:text-sm md:text-base transition-colors">
                    <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-600 mb-1">
                      <FaMicrophone className="text-white text-lg" />
                    </div>
                    Audio
                  </label>
                </div>
              )}
            </div>

            <input
              type="text"
              value={message}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Type a message"
              className="flex-1 p-2 bg-transparent text-white text-xs sm:text-sm md:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-lg transition-all duration-200"
            />

            {message.trim() ? (
              <FaArrowRight
                className="text-white text-base sm:text-lg md:text-xl cursor-pointer transform hover:scale-110 transition-transform duration-200 bg-indigo-600 p-1 rounded-full"
                onClick={() => sendMessage("text")}
              />
            ) : isRecording ? (
              <div className="flex items-center space-x-2">
                <FaTrash
                  className="text-white text-base sm:text-lg md:text-xl cursor-pointer transform hover:scale-110 transition-transform duration-200"
                  onClick={() => stopRecording(true)}
                  title="Cancel Recording"
                />
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-glowWave"></span>
                  <span className="text-white text-[10px] sm:text-xs md:text-sm">{formatRecordingTime(recordingTime)}</span>
                </div>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`w-1 h-${Math.floor(Math.random() * 4) + 1} bg-white rounded animate-glowWave`}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    ></span>
                  ))}
                </div>
                <button onClick={isRecordingPaused ? resumeRecording : pauseRecording}>
                  {isRecordingPaused ? (
                    <FaPlay className="text-white text-base sm:text-lg md:text-xl cursor-pointer transform hover:scale-110 transition-transform duration-200" />
                  ) : (
                    <FaPause className="text-white text-base sm:text-lg md:text-xl cursor-pointer transform hover:scale-110 transition-transform duration-200" />
                  )}
                </button>
                <FaArrowRight
                  className="text-white text-base sm:text-lg md:text-xl cursor-pointer transform hover:scale-110 transition-transform duration-200 bg-indigo-600 p-1 rounded-full"
                  onClick={stopAndSendRecording}
                />
              </div>
            ) : (
              <FaMicrophone
                className="text-white text-base sm:text-lg md:text-xl cursor-pointer transform hover:scale-110 transition-transform duration-200 bg-red-600 p-1 rounded-full"
                onClick={toggleRecording}
              />
            )}
          </div>
        </div>
      </div>

      {contextMenu && (
        <div
          className="absolute bg-gray-900 rounded-lg shadow-lg p-2 z-30 context-menu animate-scaleIn"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => handleReply(chat[contextMenu.index])}
            className="block w-full text-left p-2 hover:bg-gray-800 text-white text-xs sm:text-sm md:text-base"
          >
            Reply
          </button>
          <button
            onClick={() => handleMarkMessage(chat[contextMenu.index])}
            className="block w-full text-left p-2 hover:bg-gray-800 text-white text-xs sm:text-sm md:text-base"
          >
            Mark
          </button>
          <button
            onClick={() => handleReactToMessage(chat[contextMenu.index], contextMenu.index)}
            className="block w-full text-left p-2 hover:bg-gray-800 text-white text-xs sm:text-sm md:text-base"
          >
            React
          </button>
          <button
            onClick={() => handlePinMessage(chat[contextMenu.index])}
            className="block w-full text-left p-2 hover:bg-gray-800 text-white text-xs sm:text-sm md:text-base"
          >
            {chat[contextMenu.index].isPinned ? "Unpin" : "Pin"}
          </button>
          {chat[contextMenu.index].senderId === userId && (
            <>
              <button
                onClick={() => handleDeleteMessage(chat[contextMenu.index], "me")}
                className="block w-full text-left p-2 hover:bg-gray-800 text-white text-xs sm:text-sm md:text-base"
              >
                Delete for Me
              </button>
              <button
                onClick={() => handleDeleteMessage(chat[contextMenu.index], "everyone")}
                className="block w-full text-left p-2 hover:bg-gray-800 text-red-400 text-xs sm:text-sm md:text-base"
              >
                Delete for Everyone
              </button>
            </>
          )}
        </div>
      )}

      {reactionPicker && (
        <div
          className="absolute reaction-picker animate-scaleIn"
          style={{ top: reactionPicker.y, left: reactionPicker.x }}
        >
          <Picker
            data={data}
            onEmojiSelect={(emoji) => handleReactionSelect(emoji, chat[reactionPicker.index])}
            theme="dark"
            previewPosition="none"
            set="native"
          />
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-xl">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-white">Select Music</h2>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchYouTube(searchQuery)}
              placeholder="Search YouTube..."
              className="w-full p-3 mb-4 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-xs sm:text-sm md:text-base"
            />
            <button
              onClick={() => searchYouTube(searchQuery)}
              className="w-full p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mb-4 text-xs sm:text-sm md:text-base"
            >
              Search
            </button>
            <div className="space-y-3">
              {searchResults.map((video) => (
                <div
                  key={video.id.videoId}
                  onClick={() => handleVideoSelect(video.id.videoId, video.snippet.title)}
                  className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <img
                    src={video.snippet.thumbnails.default.url}
                    alt={video.snippet.title}
                    className="w-16 h-12 rounded-md"
                  />
                  <span className="text-white text-xs sm:text-sm md:text-base truncate">{video.snippet.title}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setModal(false)}
              className="mt-4 w-full p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm md:text-base"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {helpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-white">Help</h2>
            <div className="text-white text-xs sm:text-sm md:text-base space-y-3">
              <p>• Use the paperclip to attach media or share location</p>
              <p>• Click the music icon to search and play YouTube videos</p>
              <p>• Right-click or long-press messages for more options</p>
              <p>• Use the microphone to record audio messages</p>
              <p>• View-once media can only be viewed once</p>
              <p>• Room code can be shared to invite others</p>
            </div>
            <button
              onClick={() => setHelpModal(false)}
              className="mt-4 w-full p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs sm:text-sm md:text-base"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {destroyRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md shadow-xl dialog-pop border-glow">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-white text-center">Destroy Room</h2>
            <p className="text-white text-sm sm:text-base mb-4 text-center">Enter the room password to destroy it:</p>
            <input
              type="password"
              value={destroyPassword}
              onChange={(e) => setDestroyPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleDestroyRoom()}
              placeholder="Password"
              className="w-full p-3 mb-4 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm sm:text-base"
            />
            <div className="flex space-x-4">
              <button
                onClick={handleDestroyRoom}
                className="flex-1 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                Destroy
              </button>
              <button
                onClick={() => setDestroyRoomModal(false)}
                className="flex-1 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingOnceMedia && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 animate-fadeIn">
          <div className="relative max-w-full max-h-full p-4">
            {viewingOnceMedia.content.startsWith("data:image") && (
              <img
                src={viewingOnceMedia.content}
                alt="View once image"
                className="max-w-[90vw] max-h-[90vh] rounded-lg"
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
            {viewingOnceMedia.content.startsWith("data:video") && (
              <video
                controls
                autoPlay
                className="max-w-[90vw] max-h-[90vh] rounded-lg"
                onContextMenu={(e) => e.preventDefault()}
              >
                <source src={viewingOnceMedia.content} type="video/mp4" />
              </video>
            )}
            <button
              onClick={() => closeViewOnceMedia(chat.findIndex((msg) => msg.content === viewingOnceMedia.content))}
              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
