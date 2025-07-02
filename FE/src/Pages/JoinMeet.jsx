import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import image from "../assets/bg2.jpg";

const JoinMeet = () => {
  const { roomId } = useParams();
  const [displayName, setDisplayName] = useState('');
  const [camera, setCamera] = useState(true);
  const [mic, setMic] = useState(true);
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!displayName.trim()) return alert("Please enter a display name");
    navigate(`/meet/${roomId}`, {
      state: { displayName, camera, mic }
    });
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center px-4 py-12"
      style={{
           backgroundImage: `url(${image})`,
           backgroundSize: "cover",
           backgroundPosition: "center",
           backgroundRepeat: "no-repeat",
         }}
    >

      {/* Main Card */}
      <div className="relative z-10 max-w-md w-full bg-white/90 rounded-2xl shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Join a Meeting</h2>
        <p className="text-sm text-center text-gray-600 mb-6">
          Enter your name to join the video call and connect with your team, clients, or friends.
        </p>

        <input
          type="text"
          placeholder="Your display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full border border-black px-4 py-2 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex items-center justify-center space-x-6 mb-6">
          <label className="flex items-center space-x-2 text-gray-700">
            <input
              type="checkbox"
              checked={camera}
              onChange={() => setCamera(!camera)}
              className="accent-blue-600"
            />
            <span>Camera</span>
          </label>
          <label className="flex items-center space-x-2 text-gray-700">
            <input
              type="checkbox"
              checked={mic}
              onChange={() => setMic(!mic)}
              className="accent-green-600"
            />
            <span>Mic</span>
          </label>
        </div>

        <button
          onClick={handleJoin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200"
        >
          Join Now
        </button>
      </div>

      {/* Optional text content */}
      <div className="absolute bottom-6 text-white text-center px-4 z-10 max-w-2xl">
        <h3 className="text-xl font-semibold mb-1">VideoMeet: Connect from Anywhere</h3>
        <p className="text-sm">
          Whether you're working remotely, catching up with friends, or hosting a virtual event — VideoMeet keeps you connected.
        </p>
      </div>
    </div>
  );
};

export default JoinMeet;