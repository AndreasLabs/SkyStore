# SkyStore

SkyStore is a modern web application for managing astronomical observation data and assets. It provides a hierarchical organization system with organizations, projects, and missions to effectively manage astronomical observations and their associated data.

## Features

- **Organizations**: Create and manage organizations to group related astronomical projects
- **Projects**: Organize work into projects within organizations
- **Missions**: Create observation missions with detailed metadata
- **Asset Management**: Upload and manage observation data and images
- **Modern UI**: Built with React and Mantine UI components for a great user experience

## Tech Stack

- **Frontend**: React with TypeScript, Mantine UI components, Vite
- **Backend**: Bun, Elysia.js
- **Storage**: MinIO for object storage
- **Database**: Redis Stack
- **Development**: Moon for task running and workspace management
- **Containerization**: Docker and Docker Compose

## Prerequisites

- Node.js 18+ or Bun 1.0+
- Docker and Docker Compose
- Moon (optional, for workspace management)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/SkyStore.git
   cd SkyStore
   ```

2. Install dependencies:
   ```bash
   # If using Moon
   moon run :install

   # If using Bun directly
   cd web && bun install
   cd ../app && bun install
   ```

3. Start the development environment:
   ```bash
   # Using Moon (recommended)
   moon run :dev

   # Or manually:
   docker compose up -d  # Start Redis and MinIO
   cd app && bun run dev  # Start backend
   cd web && bun run dev  # Start frontend
   ```

4. Access the application:
   - Web UI: http://localhost:5173
   - Backend API: http://localhost:3000
   - MinIO Console: http://localhost:9001 (credentials: minioadmin/minioadmin)
   - Redis Insight: http://localhost:8001

## Project Structure

```
SkyStore/
├── app/                 # Backend application
│   ├── src/
│   │   ├── routes/     # API routes
│   │   └── types/      # TypeScript types
├── web/                 # Frontend application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   └── api/        # API client
├── docker-compose.yml   # Docker services configuration
└── .moon/              # Moon workspace configuration
```

## Development

- The project uses Moon for task running and workspace management
- Hot reloading is enabled for both frontend and backend
- TypeScript is used throughout for type safety
- Mantine UI components for consistent design

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Add your license here]