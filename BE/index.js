const express = require("express");
const dotenv = require("dotenv");
const http = require("http");
const cors = require("cors");
const setupSocketIO = require("./socket")
const {connectDB} = require("./config/db")
const meetRoutes = require('./routes/meetRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
  origin: "https://meetapp-frontend-z33b.onrender.com",
  credentials: true,
}));
app.use(express.json());
app.use('/api/meet', meetRoutes);

app.get("/", (req, res) => {
  res.send("API is running ✅");
});


const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);
  setupSocketIO(server); 

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
