# E-Learning Platform Frontend

A modern, responsive e-learning platform built with React.js. This is a **frontend-only** demonstration project showcasing a complete user interface for an online learning platform.

## 🌟 Features

- **Modern UI/Design**: Clean, professional interface with a unified theme system
- **Responsive Layout**: Fully responsive design that works on all devices
- **Course Catalog**: Browse and explore various courses with filtering
- **Blog System**: Read educational blog posts with categories and search
- **User Authentication**: Mock login/signup system for demonstration
- **Interactive Components**: Carousels, cards, and dynamic content
- **Theme Consistency**: Unified color scheme and styling across all components

## 🎨 Design System

- **Primary Colors**: Blue gradient (#667eea to #764ba2)
- **Typography**: Poppins font family with consistent sizing
- **Components**: Reusable button, card, and layout components
- **Responsive**: Mobile-first design approach

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd e-learning-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 📁 Project Structure

```
src/
├── components/          # Reusable React components
│   ├── pages/          # Page components (Home, Courses, Blog, etc.)
│   ├── images/         # Component-specific images
│   └── ...             # Other components (Navbar, Footer, Cards, etc.)
├── css/                # Styling files
├── App.js              # Main application component
└── index.js            # Application entry point
```

## 🔧 Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode. The page will reload if you make edits.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

## 📱 Pages & Features

### Home Page

- Hero section with call-to-action
- Featured courses carousel
- New courses section
- Latest blog posts
- Top categories

### Courses Page

- Complete course catalog
- Course cards with descriptions
- Category-based organization

### Blog Page

- Educational blog posts
- Category filtering
- Search functionality
- Individual blog post pages

### Authentication

- Mock login/signup forms
- Frontend-only user session simulation
- Account management page

## 🎯 Demo Mode

This project runs in **demo mode** with:

- Mock data for courses and blog posts
- Simulated user authentication
- Frontend-only functionality
- No backend dependencies

## 🛠 Technologies Used

- **React** 18.2.0 - Frontend framework
- **React Router** 7.7.0 - Client-side routing
- **React Multi Carousel** - Interactive carousels
- **FontAwesome** - Icons and UI elements
- **CSS Custom Properties** - Theme system
- **Responsive Design** - Mobile-first approach

## 🎨 Customization

The project uses CSS custom properties for easy theming. You can modify colors, fonts, and spacing by updating the variables in `src/index.css`:

```css
:root {
  --primary-color: #667eea;
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* ... other theme variables */
}
```

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

This is a demonstration project. Feel free to fork and customize for your own needs!

## 📞 Support

For questions or support, please refer to the code comments or React documentation.

---

*This is a frontend-only demonstration project. All functionality is simulated for educational and portfolio purposes.*
