import fs from 'fs';
import csvParser from 'csv-parser';
import { pool } from '../db/db.js';
import { validateRowBeforeInsertion } from './validateRow.js';
/**
 * Function to parse and insert CSV data to the PostgreSQL database
 * @param {string} filepath - Path to the CSV file
 * @param {string} tableName - Name of the table to insert data
 */
const parseAndInsertCSVdataToDb = async (filepath, tableName) => {
  const insertedRows = [];
  fs.createReadStream(filepath)
    .pipe(csvParser())
    .on('data', (row) =>
      insertedRows.push(validateRowBeforeInsertion(row, tableName))
    )
    .on('end', async () => {
      console.log(`Parsed ${insertedRows.length} rows from ${filepath}`);

      const client = await pool.connect();
      try {
        // inserting into databse only if there is some data to insert
        if (insertedRows.length > 0) {
          const keys = Object.keys(insertedRows[0]);
          const placeholderForInsertion = keys
            .map((_, i) => `$${i + 1}`)
            .join(',');
          const query = `INSERT INTO ${tableName} (${keys.join(
            ','
          )}) VALUES (${placeholderForInsertion})`;

          for (const row of insertedRows) {
            const values = Object.values(row);
            await client.query(query, values);
          }
        }
        console.log(
          `${insertedRows.length} from ${filepath} Data inserted into database successfully.`
        );
      } catch (error) {
        console.error(`Failed to insert data into ${tableName}:`, error);
      } finally {
        client.release();
      }
    })
    .on('error', (error) => {
      console.error(`Error parsing CSV file: ${error.message}`);
    });
};

export { parseAndInsertCSVdataToDb };
