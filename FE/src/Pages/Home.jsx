import { useNavigate } from 'react-router-dom';
import image from "../assets/bg2.jpg";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-screen bg-cover bg-center"
      style={{
      backgroundImage: `url(${image})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}>
      <div className="absolute inset-0  opacity-50"></div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white space-y-6 px-4">
        <h1 className="text-4xl sm:text-5xl font-bold">Welcome to VideoMeet</h1>
        <p className="text-lg sm:text-xl max-w-2xl mx-auto">
          Stay connected with your team, clients, and loved ones. Create or join a meeting in just a few clicks. Seamlessly connect, collaborate, and communicate—whether for work, study, or fun!
        </p>
        <div className="flex flex-col items-center justify-center space-y-6 pt-8">
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg w-full sm:w-auto"
            onClick={() => navigate('/create')}
          >
            Create Meet
          </button>
          <button
            className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg w-full sm:w-auto"
            onClick={() => alert('Join Meet coming soon')}
          >
            Join Meet
          </button>
        </div>
      </div>
    </div>
  );
}
