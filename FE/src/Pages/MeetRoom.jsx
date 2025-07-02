import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import Peer from 'simple-peer/simplepeer.min.js';
import image from "../assets/bg2.jpg";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from "react-icons/fa";
import { FiPhone } from "react-icons/fi";
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const MeetRoom = () => {
  const { roomId } = useParams();
  const location = useLocation(); // displayName, camera, mic
  const { displayName, camera, mic } = location.state || {};
  const [showInviteModal, setShowInviteModal] = useState(true);
  const [peers, setPeers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const userVideo = useRef();
  const peersRef = useRef([]);
  const socketRef = useRef();
  const streamRef = useRef();
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [remoteMediaStates, setRemoteMediaStates] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const totalUsers = peers.length + (isMobile || currentPage === 0 ? 1 : 0);
  const navigate = useNavigate();

  const getGridColumns = () => {
    if (isMobile) {
      if (totalUsers <= 2) return 'repeat(1, 1fr)';
      if (totalUsers <= 4) return 'repeat(2, 1fr)';
    }
  
    if (totalUsers === 1) return 'repeat(1, 1fr)';
    if (totalUsers === 2) return 'repeat(2, 1fr)';
    if (totalUsers <= 4) return 'repeat(2, 1fr)';
    if (totalUsers <= 6) return 'repeat(3, 1fr)';
  
    return 'repeat(3, 1fr)';
  };   

  const getGridRows = () => {
    if (isMobile) {
      if (totalUsers <= 2) return 'repeat(1, 1fr)';
      return 'repeat(2, 1fr)'; // force 2 rows
    }
  
    return 'auto';
  };  

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
  
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


const handleLeaveCall = () => {
  // Stop media tracks and clear references
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }
  
  // Clear video element reference
  if (userVideo.current) {
    userVideo.current.srcObject = null;
  }

  // Destroy peers
  peersRef.current.forEach(({ peer }) => peer.destroy());
  peersRef.current = [];

  // Disconnect socket
  if (socketRef.current) {
    socketRef.current.disconnect();
    socketRef.current = null;
  }

  navigate('/');
};

  const getPagedPeers = () => {
    const pages = [];
  
    if (isMobile) {
      // Phone view: 3 peers per page (self is always included)
      for (let i = 0; i < peers.length; i += 3) {
        pages.push(peers.slice(i, i + 3));
      }
    } else {
      // Laptop view
      if (peers.length <= 5) {
        pages.push(peers); // All peers fit on first page
      } else {
        // First page: self + first 5 peers
        pages.push(peers.slice(0, 5));
        // Next pages: 6 peers per page (self not included)
        for (let i = 5; i < peers.length; i += 6) {
          pages.push(peers.slice(i, i + 6));
        }
      }
    }
  
    return pages;
  };     

  const peerPages = getPagedPeers();
  const currentPeers = peerPages[currentPage] || [];

  const toggleMic = () => {
    const audioTrack = streamRef.current?.getAudioTracks()[0];
    const videoTrack = streamRef.current?.getVideoTracks()[0];

    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);

      // ✅ Emit update to others
      socketRef.current?.emit('media-toggle', {
        userId: socketRef.current.id,
        mic: audioTrack.enabled,
        camera: videoTrack?.enabled ?? false,
      });
    }
  };

  const toggleCamera = () => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    const audioTrack = streamRef.current?.getAudioTracks()[0];

    const isCurrentlyOn = videoTrack?.enabled ?? false;
    const newCameraState = !isCurrentlyOn;

    if (videoTrack) {
      videoTrack.enabled = newCameraState;
    }

    setIsCameraOn(newCameraState);

    socketRef.current?.emit('media-toggle', {
      userId: socketRef.current.id,
      mic: audioTrack?.enabled ?? false,
      camera: newCameraState,
    });
  };

  const createPeer = (userToSignal, callerID, stream) => {
    console.log(`Creating peer for ${userToSignal} with stream tracks:`,
      stream ? stream.getTracks().map(t => t.kind).join(', ') : 'no stream');

    const existingPeer = peersRef.current.find(p => p.peerID === userToSignal);
    if (existingPeer) {
      console.warn(`Peer already exists for user ${userToSignal}`);
      return existingPeer.peer;
    }

    try {
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:3478' },
            { urls: 'stun:stun.voip.aql.com' },
            { urls: 'stun:stun.voiparound.com' },
            // {
            //   urls: 'turn:0.tcp.in.ngrok.io:18481?transport=tcp',
            //   username: 'testuser',
            //   credential: 'testpassword'
            // },
          ],
        },
      });


      peer.on('signal', signal => {
        console.log('📤 Sending signal to:', userToSignal);
        socketRef.current.emit('sending-signal', {
          userToSignal,
          callerID,
          signal,
        });
      });

      return peer;
    } catch (error) {
      console.error("Error creating peer:", error);
      return null;
    }
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    console.log('Adding peer...', callerID);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:3478' },
          { urls: 'stun:stun.voip.aql.com' },
          { urls: 'stun:stun.voiparound.com' },
          // {
          //   urls: 'turn:0.tcp.in.ngrok.io:18481?transport=tcp',
          //   username: 'testuser',
          //   credential: 'testpassword'
          // },
        ],
      },
    });

    peer.on('signal', signal => {
      console.log('📤 Returning signal to:', callerID);
      socketRef.current.emit('returning-signal', { signal, callerID });
    });

    peer.signal(incomingSignal);
    return peer;
  };

  useEffect(() => {
    if (!displayName) {
      alert('Missing user info!');
      return;
    }

    const audioTrack = streamRef.current?.getAudioTracks()[0];
    const videoTrack = streamRef.current?.getVideoTracks()[0];

    navigator.mediaDevices.getUserMedia({
      video: camera,
      audio: mic,
    }).then(stream => {
      console.log("Got local stream", stream);
      streamRef.current = stream;
      const clonedStream = stream.clone();
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }

      // Initialize socket connection
      if (!socketRef.current) {
        socketRef.current = io(`${import.meta.env.VITE_BASE_URL}`);

        socketRef.current.on('ice-candidate', ({ candidate, targetId }) => {
          console.log(`Received ICE candidate for ${targetId}`);
          const peerObject = peersRef.current.find(p => p.peerID === targetId);

          if (peerObject?.peer?.signal) {
            try {
              const iceCandidate = new RTCIceCandidate(candidate);
              peerObject.peer.addIceCandidate(iceCandidate);
              console.log("✅ Added ICE candidate for", targetId);
            } catch (error) {
              console.error("❌ ICE candidate error:", error);
            }
          } else {
            console.warn("Peer not found for ICE candidate", targetId);
          }
        });

        socketRef.current.on("connect", () => {
          console.log("Connected to socket:", socketRef.current.id);

          // 🟩 Emit join-room event
          socketRef.current.emit('join-room', {
            roomId,
            userId: socketRef.current.id,
            displayName,
            isCameraOn: videoTrack?.enabled ?? false,
            isMicOn: audioTrack?.enabled ?? false
          });

          socketRef.current?.emit('media-toggle', {
            userId: socketRef.current.id,
            mic: audioTrack?.enabled ?? false,
            camera: videoTrack?.enabled ?? false,

          });
        });

        socketRef.current.on('media-toggle', ({ userId, mic, camera }) => {
          console.log(`📡 Media status from ${userId}: mic=${mic}, camera=${camera}`);
          setRemoteMediaStates(prev => ({
            ...prev,
            [userId]: { mic, camera }
          }));
          if (userId === socketRef.current.id) {
            const localAudioTrack = streamRef.current?.getAudioTracks()[0];
            const localVideoTrack = streamRef.current?.getVideoTracks()[0];

            if (localAudioTrack) localAudioTrack.enabled = mic;
            if (localVideoTrack) localVideoTrack.enabled = camera;
          }
        });

        socketRef.current.on('all-users', users => {
          console.log("Received all-users", users);
          if (users.length === 0) return;
          const peers = [];
          setParticipants(users);

          users.forEach(user => {
            if (user.userId === socketRef.current.id) return;
            console.log('Creating peer with stream:', stream);
            const peer = createPeer(user.userId, socketRef.current.id, stream.clone());
            peersRef.current.push({
              peerID: user.userId,
              peer,
              displayName: user.displayName,
            });
            peers.push({ peer, displayName: user.displayName });
          });

          setPeers(peers);
        });

        socketRef.current.on('user-joined', payload => {
          const { callerID, displayName, isCameraOn, isMicOn } = payload;

          // Add duplicate check
          if (peersRef.current.some(p => p.peerID === callerID)) return;

          const peer = createPeer(callerID, socketRef.current.id, streamRef.current);

          if (!peer) {
            console.error("Peer creation failed for", callerID);
            return;
          }

          peersRef.current.push({
            peerID: callerID,
            peer,
            displayName,
            isCameraOn,
            isMicOn
          });

          // Functional update to avoid stale state
          setPeers(prev => [...prev, { peer, displayName, isCameraOn, isMicOn }]);
        });


        socketRef.current.on('sending-signal', payload => {
          // Check if peer already exists
          if (peersRef.current.some(p => p.peerID === payload.callerID)) return;

          const peer = addPeer(payload.signal, payload.callerID, streamRef.current);

          // Null check
          if (!peer) return;

          peersRef.current.push({
            peerID: payload.callerID,
            peer,
            displayName: payload.displayName,
          });

          // Batch state updates
          setPeers(prev => [...prev, { peer, displayName: payload.displayName }]);
        });

        socketRef.current.on('user-left', ({ userId }) => {
          const peerObj = peersRef.current.find(p => p.peerID === userId);
          if (peerObj) {
            peerObj.peer.destroy();
            peersRef.current = peersRef.current.filter(p => p.peerID !== userId);
            setPeers(prev => prev.filter(p => p.peer !== peerObj.peer));
            setRemoteMediaStates(prev => {
              const newState = { ...prev };
              delete newState[userId];
              return newState;
            });
          }
        });

        socketRef.current.on('receiving-returned-signal', payload => {
          console.log("📥 Got returning signal", payload);
          const item = peersRef.current.find(p => p.peerID === payload.id);
          if (item) {
            item.peer.signal(payload.signal);
            if (payload.displayName) {
              item.displayName = payload.displayName;
              setPeers(prevPeers => {
                return prevPeers.map(p => {
                  if (p.peer === item.peer) {
                    return { ...p, displayName: payload.displayName };
                  }
                  return p;
                });
              });
            }
          }
        });

      }
    });

    return () => {
      
    // Stop media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Clean peers
    peersRef.current.forEach(p => p.peer.destroy());
    peersRef.current = [];
  
      setPeers([]);
      setParticipants([]);
      setRemoteMediaStates({});
 };
    
  }, [displayName, camera, mic, roomId]);

  return (
    <div
      className="flex flex-col h-screen w-full"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
<div
  className="grid gap-4 justify-center items-center"
  style={{
    height: 'calc(100vh - 80px)',
    gridTemplateColumns: getGridColumns(),
    gridTemplateRows: getGridRows(),
  }}
>
  {/* Self Video */}
  {(isMobile || currentPage === 0) && (
  <div className="relative w-full aspect-video h-full rounded overflow-hidden bg-black shadow-lg">
    <video
      muted
      ref={userVideo}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-sm px-3 py-1">
      {displayName || "You"}
    </div>
  </div>
)}
  {/* Peers */}
  {currentPeers.map((peerObj, index) => (
    <Video key={index} peer={peerObj.peer} name={peerObj.displayName} />
  ))}
</div>
  
      {/* Pagination */}
      {peerPages.length > 1 && (
        <div className="flex justify-center mt-2">
          {peerPages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-3 h-3 mx-1 rounded-full ${index === currentPage ? "bg-white" : "bg-gray-400"}`}
            />
          ))}
        </div>
      )}
  
      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed bottom-1 sm:bottom-1 right-4 z-50">
          <div className="bg-white shadow-xl border rounded-xl p-4 w-72 relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <p className="font-semibold mb-2">Invite Link</p>
            <input
              type="text"
              value={`${window.location.origin}/join/${roomId}`}
              readOnly
              className="w-full p-2 border rounded mb-2 text-sm"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/join/${roomId}`);
                toast.success("Link copied to clipboard!");
              }}
              className="bg-blue-500 text-white text-sm px-3 py-1 rounded w-full"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
  
      {/* Bottom Taskbar */}
      <div className="h-[80px] w-full flex justify-center items-center bg-black bg-opacity-90 z-40">
      <div className="flex flex-wrap items-center gap-4 px-6 py-4 shadow-2xl w-full sm:max-w-xl justify-center">
          {/* Mic */}
          <button
            onClick={() => setMicOn((prev) => !prev)}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition group focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {micOn ? (
              <FaMicrophone className="w-6 h-6 text-white group-hover:text-red-400" />
            ) : (
              <FaMicrophoneSlash className="w-6 h-6 text-white group-hover:text-red-400" />
            )}
          </button>
  
          {/* Camera */}
          <button
            onClick={() => setVideoOn((prev) => !prev)}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition group focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {videoOn ? (
              <FaVideo className="w-6 h-6 text-white group-hover:text-yellow-400" />
            ) : (
              <FaVideoSlash className="w-6 h-6 text-white group-hover:text-yellow-400" />
            )}
          </button>
  
          {/* End Call */}
          <button
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-400"
           onClick={handleLeaveCall} >
            <FiPhone className="w-6 h-6 text-white" />
          </button>
  
          {/* Invite Toggle */}
          <button
            onClick={() => setShowInviteModal((prev) => !prev)}
            className="text-sm text-white hover:underline ml-4"
          >
            {showInviteModal ? "Hide Invite" : "Show Invite"}
          </button>
        </div>
      </div>
    </div>
  ); 
};

const Video = ({ peer, name }) => {
  const ref = useRef();
  const [hasStream, setHasStream] = useState(false);

  useEffect(() => {
    const setVideoStream = (stream) => {
      if (ref.current) {
        ref.current.srcObject = stream;
        setHasStream(true);
      }
    };

    const handleStream = (stream) => {
      console.log("🔁 Received remote stream", stream);
      setVideoStream(stream);
    };

    if (peer.streams && peer.streams.length > 0) {
      console.log("Using existing peer stream:", peer.streams[0].id);
      setVideoStream(peer.streams[0]);
    }

    peer.on('stream', handleStream);

    const videoElement = ref.current;
    if (videoElement) {
      const handleCanPlay = () => setHasStream(true);
      videoElement.addEventListener('canplay', handleCanPlay);

      // If already has data, update state immediately
      if (videoElement.readyState >= 2) {
        setHasStream(true);
      }

      return () => {
        videoElement.removeEventListener('canplay', handleCanPlay);
        peer.off('stream', handleStream);
      };
    }

    return () => peer.off('stream', handleStream);
  }, [peer]);


  return (
    <div className="relative w-full h-full rounded overflow-hidden bg-black shadow-md">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-sm px-3 py-1 rounded">
        {name}
      </div>
      {!hasStream && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
          Connecting...
        </div>
      )}
    </div>
  );
};
export default MeetRoom;