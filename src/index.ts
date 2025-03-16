import { connectToMongo } from "./config/mongodb.js";
import { createUserModule } from "./routes/users.js";
import { serve } from "@hono/node-server";
import { apiReference } from "@scalar/hono-api-reference";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createProjectModule } from "./routes/project.js";
import { createTaskModule } from "./routes/tasks.js";
import { createCommentModule } from "./routes/comments.js";
import { snowFlakeConnection } from "./config/snowflake.js";
import { createLogModule } from "./routes/test.js";

const app = new OpenAPIHono();

snowFlakeConnection.connect((error, conn) => {
  if (error) {
    console.log("Error connecting to snowflake", error);
  } else {
    console.log("Connected to snowflake");
  }
});

app.doc("/api", {
  info: {
    title: "Documentation for users API",
    version: "v1",
  },
  openapi: "3.1.0",
});

app.route("/fileParser/upload", createLogModule()).post(
  "/",
  apiReference({
    spec: {
      url: "./api",
    },
  })
);

app.all("/fileParser", async (c) => {
  return c.html(`
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>File Upload and Data Display</title>
  <style>
    body {
      background: linear-gradient(135deg, #ece9e6, #ffffff);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      background: #fff;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      border-radius: 10px;
      padding: 40px;
      width: 80%;
    }
    h1 {
      margin-bottom: 20px;
      font-size: 24px;
      color: #333;
      text-align: center;
    }
    .upload-section {
      text-align: center;
      margin-bottom: 30px;
    }
    input[type="file"] {
      display: none;
    }
    label[for="fileInput"] {
      background-color: #007bff;
      color: #fff;
      padding: 10px 20px;
      font-size: 16px;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }
    label[for="fileInput"]:hover {
      background-color: #0056b3;
    }
    button {
      background-color: #28a745;
      color: #fff;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s ease;
      margin-left: 10px;
    }
    button:hover {
      background-color: #1e7e34;
    }
    .file-info {
      margin-top: 10px;
      font-size: 14px;
      color: #555;
    }
    .upload-status {
      margin-top: 10px;
      font-size: 16px;
      color: #333;
    }
    .table-container {
      overflow-x: auto;
      margin-top: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 600px; 
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
      font-weight: 600;
    }
    tr:nth-child(even) {
      background-color: #fafafa;
    }
    tr:hover {
      background-color: #f1f1f1;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>File Upload and Data Display</h1>
    <div class="upload-section">
      <input type="file" id="fileInput">
      <label for="fileInput">Choose File</label>
      <button id="uploadBtn">Upload File</button>
      <div class="file-info" id="fileIndicator">No file selected</div>
      <div class="upload-status" id="uploadStatus"></div>
    </div>
    <div class="table-container">
      <table id="resultTable" style="display:none;">
        <thead>
          <tr>
            <th>IP_ADDRESS</th>
            <th>LOG_TIMESTAMP</th>
            <th>REQUEST</th>
            <th>STATUS_CODE</th>
            <th>RESPONSE_SIZE</th>
            <th>REFERRER</th>
            <th>USER_AGENT</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  </div>

  <script>
    const fileInput = document.getElementById('fileInput');
    const fileIndicator = document.getElementById('fileIndicator');
    const uploadStatus = document.getElementById('uploadStatus');

    // Update file indicator when a file is selected
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        fileIndicator.textContent = 'Selected file: ' + fileInput.files[0].name;
      } else {
        fileIndicator.textContent = 'No file selected';
      }
    });

    document.getElementById('uploadBtn').addEventListener('click', async () => {
      if (!fileInput.files.length) {
        alert('Please select a file to upload.');
        return;
      }
      
      const file = fileInput.files[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        uploadStatus.textContent = 'Uploading...';
        const response = await fetch('/fileParser/upload', {
          method: 'POST',
          headers: {
            'Accept': 'application/json'
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Error uploading file: ' + response.statusText);
        }
        
        const jsonData = await response.json();
        populateTable(jsonData);
        uploadStatus.textContent = 'Upload successful';
      } catch (error) {
        console.error('Error:', error);
        uploadStatus.textContent = 'Error: ' + error.message;
      }
    });

    function populateTable(data) {
      const table = document.getElementById('resultTable');
      const tbody = table.querySelector('tbody');
      tbody.innerHTML = '';

      // Expected that data is an array of objects
      data.forEach(item => {
        const row = document.createElement('tr');

        const ipCell = document.createElement('td');
        ipCell.textContent = item.ip_address || '';
        row.appendChild(ipCell);

        const timestampCell = document.createElement('td');
        timestampCell.textContent = item.log_timestamp || '';
        row.appendChild(timestampCell);

        const requestCell = document.createElement('td');
        requestCell.textContent = item.request || '';
        row.appendChild(requestCell);

        const statusCell = document.createElement('td');
        statusCell.textContent = item.status_code || '';
        row.appendChild(statusCell);

        const sizeCell = document.createElement('td');
        sizeCell.textContent = item.response_size || '';
        row.appendChild(sizeCell);

        const referrerCell = document.createElement('td');
        referrerCell.textContent = item.referrer || '';
        row.appendChild(referrerCell);

        const userAgentCell = document.createElement('td');
        userAgentCell.textContent = item.user_agent || '';
        row.appendChild(userAgentCell);

        tbody.appendChild(row);
      });

      table.style.display = 'table';
    }
  </script>
</body>
</html>
  `);
});

const PORT = 3000;

serve({
  fetch: app.fetch,
  port: PORT,
});
