import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import searchRoutes from './routes/search.js';
import resourceRoutes from './routes/resources.js';
import bookingRoutes from './routes/bookings.js';
import { loadData } from './data/dataLoader.js';
import { initBookings } from './services/bookingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', searchRoutes);
app.use('/api', resourceRoutes);
app.use('/api', bookingRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start() {
  try {
    await loadData();
    initBookings();
    console.log('Data loaded successfully');
    
    app.listen(PORT, () => {
      console.log(`CampusGuide backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
