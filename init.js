import fs from 'fs';
import { pool } from './src/db/db.js';
import { parseAndInsertCSVdataToDb } from './src/utils/csvParser.js';
const schemaPath = './src/db/schema.sql';

// for inserting CSV Data To PostgreSQL Database
const populateCSVdataToDatabase = async () => {
  try {
    const fileToTableMappings = [
      { filePath: './data/menu_hours.csv', tableName: 'business_hours' },
      {
        filePath: './data/store_status.csv',
        tableName: 'store_status',
      },
      { filePath: './data/timezones.csv', tableName: 'store_timezone' },
    ];

    const promises = fileToTableMappings.map(({ filePath, tableName }) =>
      parseAndInsertCSVdataToDb(filePath, tableName)
    );

    await Promise.all(promises);

    console.log('Data inserted successfully.');
  } catch (err) {
    console.error('Error during insertion:', err);
  }
};

// for table generation and calling data population in postgreSQL database
async function init() {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = await pool.connect();

  try {
    await client.query(sql);
    await populateCSVdataToDatabase();
    console.log('Database schema successfully applied.');
  } catch (error) {
    console.error('Error applying database schema:', error.message);
  } finally {
    client.release();
  }
}

init().catch((err) => console.error(err));
