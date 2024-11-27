import moment from 'moment-timezone';
import { query } from '../db/db.js';

/**
 * Function to calculate the report for each report based on the parameter
 * @param {string} store_id - store_id of current store
 * @param {object} timeframe - have object with key as amount and unit. Amount : how many time the calculation should happen (inside the fucntion) ,unit : signifies current type of calculation
 * @param {object} granularity- have object as days
 */
async function calculateReport(store_id, timeframe, granularity) {
  const today = new Date().getDay() - 1;
  const timezoneQuery = `SELECT timezone_str FROM store_timezone WHERE store_id = $1`;
  const { timezone_str } =
    (await query(timezoneQuery, [store_id])).rows[0] || 'America/Chicago';
  let totalUpTime = 0,
    totalDownTime = 0;
  const currentTime = moment().utc().format('YYYY-MM-DD HH:mm:ss.SSS');
  const oneWeekAgoTime = moment()
    .utc()
    .subtract(timeframe.amount, timeframe.unit)
    .format('YYYY-MM-DD HH:mm:ss.SSS');
  for (let day = 0; day < granularity.days; ++day) {
    const dayDate = moment().utc().subtract(day, 'days');
    const currentDayOfWeek = (today - day + 7) % 7;
    const businessHourQuery = `
    SELECT start_time_local, end_time_local
    FROM business_hours
    WHERE store_id = $1 AND day_of_week = $2
  `;
    const businessHours = (
      await query(businessHourQuery, [store_id, currentDayOfWeek])
    ).rows[0] || { start_time_local: '00:00:00', end_time_local: '23:59:59' };

    const localStartTime = `${dayDate.format('YYYY-MM-DD')} ${
      businessHours.start_time_local
    }`;
    const localEndTime = `${dayDate.format('YYYY-MM-DD')} ${
      businessHours.end_time_local
    }`;

    const startTimeUtc = moment
      .tz(localStartTime, timezone_str)
      .utc()
      .format('YYYY-MM-DD HH:mm:ss.SSS');
    const endTimeUtc = moment
      .tz(localEndTime, timezone_str)
      .utc()
      .format('YYYY-MM-DD HH:mm:ss.SSS');

    if (!moment(startTimeUtc).isValid() || !moment(endTimeUtc).isValid()) {
      continue;
    }

    const commonStartTime = moment.max(
      moment(startTimeUtc),
      moment(oneWeekAgoTime)
    ); // to microsecond
    const commonEndTime = moment.min(moment(endTimeUtc), moment(currentTime));
    // Validate that the common start time is before the common end time
    if (commonStartTime.isBefore(commonEndTime)) {
      const commonStartTimeWithMicroSecond =
        commonStartTime.format('YYYY-MM-DD HH:mm:ss.SSS') + '000';
      const commonEndTimeWithMicroSecond =
        commonEndTime.format('YYYY-MM-DD HH:mm:ss.SSS') + '000';

      const storeStatusQuery = `
        SELECT timestamp_utc, status
        FROM store_status
        WHERE store_id = $1
        AND timestamp_utc BETWEEN $2 AND $3 ORDER BY timestamp_utc
      `;

      const result = (
        await query(storeStatusQuery, [
          store_id,
          commonStartTimeWithMicroSecond,
          commonEndTimeWithMicroSecond,
        ])
      ).rows;

      // console.log('result is', result);
      if (result.length > 0) {
        let prevStatus = result[0].status,
          prevMatchedTime = moment.utc(result[0].timestamp_utc);

        for (const row of result) {
          const currentTime = moment.utc(row.timestamp_utc);
          const timeDiff = currentTime.diff(prevMatchedTime, 'seconds');
          if (row.status !== prevStatus) {
            if (prevStatus === 'active') {
              totalUpTime += timeDiff;
            } else {
              totalDownTime += timeDiff;
            }
            prevStatus = row.status;
            prevMatchedTime = currentTime;
          }
        }

        const lastTimeDiff = moment(currentTime).diff(
          prevMatchedTime,
          'seconds'
        );
        if (prevStatus === 'active') {
          totalUpTime += lastTimeDiff;
        } else {
          totalDownTime += lastTimeDiff;
        }
      }
    }
  }

  return {
    uptime: (totalUpTime / 3600).toFixed(0), // Total uptime in hours
    downtime: (totalDownTime / 3600).toFixed(0), // Total downtime in hours
  };
}

async function calculateHourlyReport(store_id) {
  const { uptime, downtime } = await calculateReport(
    store_id,
    { amount: 1, unit: 'hours' },
    { days: 1 }
  );
  return {
    uptime_last_hour: uptime * 60, // converting to minute because returned data is in hours
    downtime_last_hour: downtime * 60,
  };
}

async function calculateDailyReport(store_id) {
  const { uptime, downtime } = await calculateReport(
    store_id,
    { amount: 1, unit: 'days' },
    { days: 2 }
  );
  return { uptime_last_day: uptime, downtime_last_day: downtime };
}

async function calculateWeeklyReport(store_id) {
  const { uptime, downtime } = await calculateReport(
    store_id,
    { amount: 7, unit: 'days' },
    { days: 7 }
  );
  return { uptime_last_week: uptime, downtime_last_week: downtime };
}

export {
  calculateHourlyReport,
  calculateDailyReport,
  calculateWeeklyReport,
  calculateReport,
};
