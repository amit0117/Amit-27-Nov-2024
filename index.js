import express from 'express';
import {
  getReport,
  triggerReport,
} from './src/controllers/reportController.js';
import { notFound, errorHandler } from './src/middleware/authmiddleware.js';

const app = express();

app.use(express.json());

app.get('/get_report/:report_id', getReport);
app.post('/trigger_report', triggerReport);

// middleware for any other route for showing not found
app.use(notFound);

// middleware for error handling on backend
app.use(errorHandler);
const port = process.env.port || 3000;
app.listen(port, () => {
  console.log(`app is listening on port number ${port}`);
});
