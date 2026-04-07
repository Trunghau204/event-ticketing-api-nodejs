# Ticket System Project (Node.js & React)

A full-stack ticket booking platform built with **Node.js (Express)** and **React (Vite)**. Standardized to match the original Spring Boot business logic.

## Project Structure
- `node-backend/`: Node.js Express server with Sequelize ORM (SQL Server).
- `node-frontend/`: React application built with Vite and Axios.

## Prerequisites
- **Node.js 18+** & **npm**
- **SQL Server** (Local instance or Azure SQL)
- **Stripe Account** (For payment integration)

## Backend Setup (Node.js)
1. Navigate to the `node-backend` directory:
   ```bash
   cd node-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env`:
   Create a `.env` file in `node-backend/` with the following variables:
   ```env
   PORT=5000
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_NAME=TicketSystem
   DB_SERVER=localhost
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=sk_test_...
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   FRONTEND_URL=http://localhost:5173
   ```
4. Run the application:
   ```bash
   npm run start
   ```
   *The backend will start on `http://localhost:5000`*

## Frontend Setup (React)
1. Navigate to the `node-frontend` directory:
   ```bash
   cd node-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will start on `http://localhost:5173`*

## Key Features
- **User Authentication**: Login, Registration with JWT.
- **Dynamic Seat Management**: Create venues with row configurations; automatic sync to active events.
- **Interactive Seat Map**: Real-time selection with color-coded status (Available vs. Booked).
- **Stripe Payment**: Integrated checkout flow with VND/USD automatic currency fallback.
- **PDF Tickets & QR Codes**: Standardized PDF templates with unique QR codes sent via email.
- **Admin Dashboard**: Comprehensive management of Events, Venues, and Real-time Check-in stats.
- **Auto-Cancellation**: Background cron job to release abandoned seat reservations after 5 minutes.
