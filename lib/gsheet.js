// lib/gsheet.js
import { google } from 'googleapis';

export async function getSheetRecords(sheetKey, worksheetName) {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error("Google service account credentials not set in environment");
  }
  const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Get data from the given worksheet (range = worksheetName)
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetKey,
    range: worksheetName,
  });
  
  const rows = res.data.values;
  if (!rows || rows.length === 0) {
    return [];
  }
  
  // Convert rows (first row as header)
  const headers = rows[0];
  const records = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] || "";
    });
    return obj;
  });
  
  return records;
}