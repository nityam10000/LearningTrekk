# E-Learning Platform

A modern, responsive e-learning platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js). This project showcases a complete, full-stack application for an online learning platform.

Visit my website at: https://learning-trekk-zfgd.vercel.app/

## 🌟 Features

- **Modern UI/Design**: Clean, professional interface with a unified theme system.
- **Full-Stack Architecture**: Separate frontend and backend for a scalable and maintainable structure.
- **Responsive Layout**: Fully responsive design that works on all devices.
- **Course Management**: Create, read, update, and delete courses.
- **User Authentication**: Secure user registration and login system with JWT.
- **Enrollment System**: Users can enroll in courses.
- **Blog System**: Read and create educational blog posts.
- **API**: A well-structured RESTful API for all platform functionalities.

## 🎨 Design System

- **Primary Colors**: Blue gradient (#667eea to #764ba2)
- **Typography**: Poppins font family with consistent sizing
- **Components**: Reusable button, card, and layout components
- **Responsive**: Mobile-first design approach

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager
- MongoDB (local or a cloud instance like MongoDB Atlas)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd e-learning-platform
    ```

2.  **Setup Backend:**
    ```bash
    cd backend
    npm install
    ```
    Create a `.env` file in the `backend` directory and add the following environment variables:
    ```
    PORT=5000
    MONGO_URI=<your_mongodb_connection_string>
    JWT_SECRET=<your_jwt_secret>
    ```

3.  **Setup Frontend:**
    ```bash
    cd ../frontend
    npm install
    ```

### Running the Application

1.  **Start the backend server:**
    ```bash
    cd backend
    npm start
    ```
    The backend server will be running on `http://localhost:5000`.

2.  **Start the frontend development server:**
    ```bash
    cd frontend
    npm start
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 📁 Project Structure

```
e-learning-platform/
├── backend/
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware (e.g., auth)
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   └── server.js         # Backend entry point
└── frontend/
    ├── public/           # Static assets
    ├── src/
    │   ├── components/   # Reusable React components
    │   ├── contexts/     # React contexts for state management
    │   ├── pages/        # Page components
    │   ├── services/     # API service for frontend-backend communication
    │   └── App.js        # Main application component
    └── package.json
```

## 🛠 Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework for Node.js
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT (JSON Web Tokens)** - For authentication
- **bcryptjs** - For password hashing

### Frontend
- **React** 18.2.0 - Frontend framework
- **React Router** - Client-side routing
- **Axios** - For making HTTP requests to the backend
- **FontAwesome** - Icons and UI elements
- **CSS Custom Properties** - Theme system

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions are welcome! Please feel free to fork the repository, make changes, and submit a pull request.

## 📞 Support

For questions or support, please open an issue in the repository.
