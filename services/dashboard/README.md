# Nexus Weaver Dashboard

A modern web interface for managing Nexus Weaver deployments.

## Features

- 🚀 **Deployment Management**: Create, start, stop, and delete deployments
- 📊 **Real-time Monitoring**: View deployment and service status updates
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔒 **Secure Authentication**: Basic auth integration with Control Plane
- 📝 **Application Tracking**: View all applications and their deployment history

## Prerequisites

- Node.js 20+ (for local development)
- Docker (for containerized deployment)
- Control Plane running on port 8080

## Development Setup

1. Install dependencies:
```bash
cd services/dashboard
npm install
```

2. Start the development server:
```bash
npm run dev
```

The dashboard will be available at http://localhost:3000

## Configuration

Create a `.env.local` file for local development:
```env
VITE_API_URL=http://localhost:8080/api/v1
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Docker Deployment

### Development
```bash
docker-compose -f docker-compose.dashboard.yml up dashboard-dev
```

### Production
```bash
docker-compose -f docker-compose.dashboard.yml --profile production up dashboard
```

## Project Structure

```
dashboard/
├── src/
│   ├── api/           # API client and types
│   ├── components/    # Reusable components
│   ├── contexts/      # React contexts
│   ├── lib/           # Utility functions
│   ├── pages/         # Page components
│   ├── App.tsx        # Main app component
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles
├── public/            # Static assets
├── index.html         # HTML template
└── package.json       # Dependencies
```

## Authentication

The dashboard uses basic authentication. Default credentials:
- Username: `admin`
- Password: `admin`

Credentials are stored in localStorage and sent with each API request.

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Query** - Data fetching
- **React Router** - Routing
- **Axios** - HTTP client
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## Contributing

1. Follow the existing code style
2. Write meaningful commit messages
3. Test your changes thoroughly
4. Update documentation as needed

## Troubleshooting

### API Connection Issues
- Ensure Control Plane is running on port 8080
- Check CORS settings in Control Plane
- Verify network connectivity

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Ensure Node.js version is 20+

### Authentication Issues
- Clear localStorage: `localStorage.clear()`
- Verify Control Plane credentials
- Check browser console for errors