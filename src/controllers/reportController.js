import { v4 as uuidv4 } from 'uuid';
import expressAsyncHandler from 'express-async-handler';
import { createClient } from 'redis';
import path from 'path';
import { query } from '../db/db.js';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import {
  calculateHourlyReport,
  calculateDailyReport,
  calculateWeeklyReport,
} from '../utils/reportUtils.js';

const redisClient = createClient();
const reportChannel = 'report_generation';

redisClient.connect().then(() => console.log('Connected to Redis'));

// Persistent subscriber
const subscriber = redisClient.duplicate();
subscriber.connect();
subscriber.subscribe(reportChannel, async (message) => {
  const { reportId } = JSON.parse(message);
  console.log(`Processing report ${reportId}`);
  await generateReport(reportId);
  await redisClient.hSet(reportId, 'status', 'complete');
  await redisClient.hSet(reportId, 'file_path', `./reports/${reportId}.csv`);
  console.log(`Report generation complete for ${reportId}`);
});

const triggerReport = expressAsyncHandler(async (_, res) => {
  const reportId = uuidv4();

  await redisClient.hSet(reportId, 'status', 'pending');
  await redisClient.publish(reportChannel, JSON.stringify({ reportId }));

  res.status(202).json({ report_id: reportId });
});

const getReport = expressAsyncHandler(async (req, res) => {
  const { report_id } = req.params;

  const status = await redisClient.hGet(report_id, 'status');

  if (status === 'pending') {
    return res.status(200).json({ status: 'Running' });
  }

  if (status === 'complete') {
    const filePath = await redisClient.hGet(report_id, 'file_path');
    res.download(filePath);
  } else {
    res.status(404).json({ status: 'Report not found or error' });
  }
});

export { triggerReport, getReport };

async function generateReport(reportId) {
  const reportsDir = './reports';

  const csvWriter = createCsvWriter({
    path: path.join(reportsDir, `${reportId}.csv`),
    header: [
      { id: 'store_id', title: 'store_id' },
      { id: 'uptime_last_hour', title: 'uptime_last_hour(in minutes)' },
      { id: 'uptime_last_day', title: 'uptime_last_day(in hours)' },
      { id: 'uptime_last_week', title: 'uptime_last_week(in hours)' },
      { id: 'downtime_last_hour', title: 'downtime_last_hour(in minutes)' },
      { id: 'downtime_last_day', title: 'downtime_last_day(in hours)' },
      { id: 'downtime_last_week', title: 'downtime_last_week(in hours)' },
    ],
  });

  const reportData = await fetchReportData();

  await csvWriter.writeRecords(reportData);
}

async function fetchReportData() {
  // create data for each store id
  const storeIdQuery = `SELECT DISTINCT (store_id) FROM store_timezone`;
  const result = (await query(storeIdQuery)).rows;
  let reportData = [];
  for (const store of result) {
    const { store_id } = store;
    let requests = [
      calculateHourlyReport(store_id),
      calculateDailyReport(store_id),
      calculateWeeklyReport(store_id),
    ];
    const result = await Promise.all(requests);
    const combinedResult = result.reduce(
      (prev, curr) => ({ ...prev, ...curr }),
      { store_id: store_id }
    );
    reportData.push(combinedResult);
  }
  return reportData;
}
