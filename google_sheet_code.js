/**
 * Google Apps Script for ScentSpace Collection Sync
 * 
 * Instructions:
 * 1. Create a Google Sheet.
 * 2. Click Extensions -> Apps Script.
 * 3. Delete any default code and paste this script.
 * 4. Click Save (disk icon).
 * 5. Click Deploy -> New deployment.
 * 6. Select gear icon -> Web app.
 * 7. Set options:
 *    - Execute as: Me (your-email@gmail.com)
 *    - Who has access: Anyone
 * 8. Click Deploy, authorize permissions, and copy the Web App URL.
 * 9. Paste the URL into ScentSpace sheets sync modal!
 */

function doPost(e) {
  // Set CORS headers for Apps Script Web App response
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Max-Age": "86400"
  };

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No data received in request body.");
    }
    
    var contents = e.postData.contents;
    var collection = JSON.parse(contents);
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("ScentSpace Collection");
    if (!sheet) {
      sheet = ss.insertSheet("ScentSpace Collection");
    }
    
    // Clear sheet
    sheet.clear();
    
    // Column Headers
    var columnHeaders = [
      "ID", "Brand", "Name", "Concentration", "Gender", 
      "Accords", "Top Notes", "Middle Notes", "Base Notes", 
      "Longevity", "Sillage", "Day %", "Night %", 
      "Spring %", "Summer %", "Autumn %", "Winter %", "Image URL"
    ];
    sheet.appendRow(columnHeaders);
    
    // Format Header Row (Styled in ScentSpace gold accent)
    var headerRange = sheet.getRange(1, 1, 1, columnHeaders.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#d4af37"); // Gold Accent
    headerRange.setFontColor("#ffffff");
    headerRange.setHorizontalAlignment("center");
    
    // Write Rows
    if (collection && collection.length > 0) {
      var rows = [];
      for (var i = 0; i < collection.length; i++) {
        var p = collection[i];
        
        // Accords formatting (e.g. Woody (100%), Citrus (85%))
        var accordsStr = "";
        if (p.accords && p.accords.length > 0) {
          accordsStr = p.accords.map(function(a) { 
            return a.name + " (" + a.value + "%)"; 
          }).join(", ");
        }
        
        // Notes formatting
        var topNotes = p.notes && p.notes.top ? p.notes.top.join(", ") : "";
        var middleNotes = p.notes && p.notes.middle ? p.notes.middle.join(", ") : "";
        var baseNotes = p.notes && p.notes.base ? p.notes.base.join(", ") : "";
        
        var row = [
          p.id,
          p.brand,
          p.name,
          p.concentration,
          p.gender,
          accordsStr,
          topNotes,
          middleNotes,
          baseNotes,
          p.longevity.label || p.longevity || "Moderate",
          p.sillage.label || p.sillage || "Moderate",
          p.timeOfDay ? p.timeOfDay.day + "%" : "50%",
          p.timeOfDay ? p.timeOfDay.night + "%" : "50%",
          p.seasons ? p.seasons.spring + "%" : "25%",
          p.seasons ? p.seasons.summer + "%" : "25%",
          p.seasons ? p.seasons.autumn + "%" : "25%",
          p.seasons ? p.seasons.winter + "%" : "25%",
          p.image || ""
        ];
        rows.push(row);
      }
      
      // Paste block data (faster than appending rows one-by-one)
      sheet.getRange(2, 1, rows.length, columnHeaders.length).setValues(rows);
    }
    
    // Auto-fit column widths
    sheet.autoResizeColumns(1, columnHeaders.length);
    
    var result = {
      "status": "success",
      "count": collection.length,
      "message": "Closet synced successfully!"
    };
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    var errResult = {
      "status": "error",
      "message": err.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
