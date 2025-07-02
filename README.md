# 🔗 WebRTC Video Chat Application

This project is a real-time video chat application built with **React**, **Socket.io**, and **WebRTC**. It supports **multi-user video/audio communication**, **screen sharing**, **media toggles (mic/cam)**, and **dynamic room creation**.

---

## ✅ Features Implemented

### ✅ Core Functionality
- [x] **Room creation and joining**
  - Users can create and join rooms via unique room IDs.
- [x] **Real-time audio/video communication**
  - Using WebRTC peer connections.
- [x] **Socket-based signaling**
  - Socket.io handles all signaling between clients for peer connection establishment.
- [x] **Media toggles**
  - Users can toggle their camera and mic, and the change is reflected in real time.
- [x] **Screen sharing**
  - Users can share their screen, replacing the camera feed.
- [x] **Multiple user support**
  - Works in multi-user rooms with dynamic peer connections.

### ✅ UI Functionality
- [x] Dynamic UI updates based on media toggle (mic/camera/screen).
- [x] Shows correct peer video tiles and statuses.

### ✅ Media Sync
- [x] Sends initial media states (camera/mic/screenSharing) to new users joining a room.
- [x] Sends updates on media state changes via `media-toggle` socket event.

---

## 🧩 Issues Previously Fixed

- ❌ **Incorrect media status on join**: Remote peers were shown with wrong mic/camera state.
  - ✅ Fixed by ensuring proper track checks before emitting socket events.
- ❌ **Crash when accessing media tracks before they were initialized**
  - ✅ Fixed using safe optional chaining (`?.`) and nullish checks (`?? false`).

---

## 🚧 Remaining Tasks / TODO

### 🔜 Core Features
- [ ] **Handle user disconnection cleanly**
  - Remove peer tiles and connections when a user leaves.
- [ ] **Improve media sync for late joiners**
  - Emit current media state from all users to new joiners.
- [ ] **Mute/Unmute other users (admin feature)**
  - Allow moderators to remotely mute participants.

### 💻 UI Improvements
- [ ] Show user names or labels on video tiles.
- [ ] Add participant list with mic/camera status indicators.
- [ ] Add fullscreen toggle and grid view improvements.
- [ ] Add toast notifications (e.g. “User X joined”, “User Y turned off mic”).

### 🔐 Optional Enhancements
- [ ] Add authentication and protected rooms.
- [ ] Add recording functionality.
- [ ] Add chat window (text messaging alongside video).

---

## 🛠️ Tech Stack

| Tech         | Purpose                             |
|--------------|-------------------------------------|
| React        | Frontend framework                  |
| Socket.io    | Real-time signaling / communication |
| WebRTC       | Peer-to-peer audio/video            |
| Node.js      | Backend server for Socket.io        |
| Tailwind CSS |Styling and layout                   |

---

## 💡 Usage

### 1. Start Backend (Node.js + Socket.io server)
```bash
cd BE
npm install
npm run dev
```

### 1. Start FE
```bash
cd FE
npm install
npm run dev
```

Visit: http://localhost:3000/room/{roomId} to create or join a room.


---
### Images of Website

![Screenshot 2025-07-02 150214](https://github.com/user-attachments/assets/dfd6fc61-19c9-4b71-9eb7-bbd8f47e5e61)

![Screenshot 2025-07-02 150313](https://github.com/user-attachments/assets/8c4f3590-203d-461a-99da-6163a79ce1b0)

![Screenshot 2025-07-02 150409](https://github.com/user-attachments/assets/caba1a69-9598-4f4a-bf2b-a6e7e7192671)

![Screenshot 2025-07-02 152247](https://github.com/user-attachments/assets/a670d56e-c486-4536-859a-f1d907e89880)
