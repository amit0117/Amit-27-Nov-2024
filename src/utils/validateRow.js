import moment from 'moment-timezone';
function validateBusinessHourRow(row) {
  let { day_of_week, start_time_local, end_time_local } = row;
  if (
    !day_of_week ||
    day_of_week === '' ||
    isNaN(day_of_week) ||
    parseInt(day_of_week) > 6 ||
    parseInt(day_of_week) < 0
  )
    return 6;
  else {
    day_of_week = parseInt(day_of_week);
  }
  if (!start_time_local || start_time_local.trim() === '')
    start_time_local = '00:00:00';
  if (!end_time_local || end_time_local.trim() === '')
    end_time_local = '23:59:59';
  return { ...row, day_of_week, start_time_local, end_time_local };
}

function validateStoreTimeZoneRow(row) {
  let { timezone_str } = row;
  if (!timezone_str || timezone_str.trim() === '')
    timezone_str = 'America/Chicago';
  return { ...row, timezone_str };
}

function convertStoreTimeStampForAWeekRange(row) {
  return { ...row, timestamp_utc: adjustTimestamp(row.timestamp_utc) };
}

function adjustTimestamp(timestamp) {
  // Get the date range from today (Nov 27) to one week ago (Nov 20)
  const today = moment('2024-11-27', 'YYYY-MM-DD');
  const oneWeekAgo = moment('2024-11-20', 'YYYY-MM-DD');

  const originalMoment = moment(timestamp, 'YYYY-MM-DD HH:mm:ss.SSSSSS');

  const randomDate = moment(oneWeekAgo).add(
    Math.random() * (today - oneWeekAgo),
    'milliseconds'
  );

  const adjustedTimestamp = originalMoment
    .set('year', randomDate.year())
    .set('month', randomDate.month())
    .set('date', randomDate.date())
    .set('hour', randomDate.hour())
    .set('minute', randomDate.minute())
    .set('second', randomDate.second())
    .set('millisecond', randomDate.millisecond())
    .format('YYYY-MM-DD HH:mm:ss.SSSSSS');

  return adjustedTimestamp;
}

function validateRowBeforeInsertion(row, tableName) {
  switch (tableName) {
    case 'business_hours':
      return validateBusinessHourRow(row);
    case 'store_timezone':
      return validateStoreTimeZoneRow(row);
    case 'store_status':
      return convertStoreTimeStampForAWeekRange(row);
    default:
      return row;
  }
}

export { validateRowBeforeInsertion };
