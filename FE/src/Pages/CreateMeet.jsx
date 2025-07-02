import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import image from "../assets/bg2.jpg";

export default function CreateMeet() {
  const [displayName, setDisplayName] = useState('');
  const [camera, setCamera] = useState(true);
  const [mic, setMic] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const navigate = useNavigate();

  const handleCreate = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/meet/create`, {
        display_name: displayName,
        camera_enabled: camera,
        mic_enabled: mic,
      });
      const code = res.data.room_code;
      setRoomCode(code);

      // Delay a bit before navigating (optional)
      setTimeout(() => navigate(`/meet/${code}`, {
        state: {
          displayName,
          camera,
          mic,
        },
      }), 3000);
    } catch (err) {
      console.error('Error creating meet:', err);
    }
  };


  return (
    <div className="relative w-full h-screen bg-cover bg-center"  
     style={{
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}>
      <div className="absolute inset-0 opacity-60"></div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-white space-y-8">
        <div className="text-center max-w-xl">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Set Up Your Meeting</h1>
          <p className="text-lg sm:text-xl">
            Prepare to connect with others. Enable your camera and mic, and choose a display name to get started.
          </p>
        </div>

        <div className="bg-white/90 text-black bg-opacity-10 backdrop-blur-md p-8 rounded-xl shadow-xl w-full max-w-md space-y-6">
          <h2 className="text-2xl font-semibold text-center">Create Meet</h2>
          <input
            type="text"
            placeholder="Enter display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border border-black bg-[#e3e3ed] placeholder-gray-500 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex items-center justify-center space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={camera}
                onChange={() => setCamera(!camera)}
                className="accent-blue-600"
              />
              <span>Camera</span>
            </label>
            <label className="flex items-center space-x-2">
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200"
            onClick={handleCreate}
          >
            Create and Join
          </button>
        </div>
      </div>
    </div>
  );
}