package com.autorepairpro.server;

import com.autorepairpro.handler.AuthHandler;
import com.autorepairpro.handler.EmployeeHandler;
import com.autorepairpro.handler.CustomerHandler;

import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SimpleHttpServer {
    private final int port;
    private final ExecutorService pool;

    public SimpleHttpServer(int port) {
        this.port = port;
        // Use a thread pool to handle multiple client connections concurrently.
        this.pool = Executors.newFixedThreadPool(10);
    }

    public void start() throws IOException {
        try (ServerSocket serverSocket = new ServerSocket(port)) {
            System.out.println("Server started on port: " + port);
            System.out.println("Access the application at http://localhost:" + port);

            while (true) {
                // Accept new client connections.
                Socket clientSocket = serverSocket.accept();
                // Handle each client request in a new thread from the pool.
                pool.execute(new ClientHandler(clientSocket));
            }
        }
    }

    private static class ClientHandler implements Runnable {
        private final Socket clientSocket;
        
        public ClientHandler(Socket socket) {
            this.clientSocket = socket;
        }

        @Override
        public void run() {
            try (BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
                 OutputStream out = clientSocket.getOutputStream()) {

                // Read the HTTP request line.
                String requestLine = in.readLine();
                if (requestLine == null || requestLine.isEmpty()) {
                    return; // Ignore empty requests.
                }

                String[] requestParts = requestLine.split(" ");
                String method = requestParts[0];
                String path = requestParts[1];

                // Simple routing logic.
                if (path.startsWith("/api/")) {
                    handleApiRequest(method, path, in, out);
                } else {
                    handleFileRequest(path, out);
                }

            } catch (IOException e) {
                System.err.println("Error handling client request: " + e.getMessage());
            } finally {
                try {
                    clientSocket.close();
                } catch (IOException e) {
                    // Ignore
                }
            }
        }

        private void handleApiRequest(String method, String path, BufferedReader in, OutputStream out) throws IOException {
            // Debug logging
            System.out.println("API Request: " + method + " " + path);
            
            // Read headers to find Content-Length for POST requests.
            int contentLength = 0;
            String line;
            while ((line = in.readLine()) != null && !line.isEmpty()) {
                if (line.toLowerCase().startsWith("content-length:")) {
                    contentLength = Integer.parseInt(line.substring(line.indexOf(':') + 1).trim());
                }
            }

            // Read the request body if it's a POST/PUT request.
            StringBuilder bodyBuilder = new StringBuilder();
            if ((method.equals("POST") || method.equals("PUT")) && contentLength > 0) {
                char[] bodyChars = new char[contentLength];
                in.read(bodyChars, 0, contentLength);
                bodyBuilder.append(bodyChars);
            }
            String body = bodyBuilder.toString();
            
            // Debug logging
            if (!body.isEmpty()) {
                System.out.println("Request body: " + body);
            }

            // Route API calls to specific handlers.
            String responseJson = "{\"error\":\"Not Found\"}";
            int statusCode = 404;

            if (path.startsWith("/api/auth/") || path.equals("/api/services") || path.equals("/api/test")) {
                AuthHandler handler = new AuthHandler();
                responseJson = handler.handle(method, path, body);
                statusCode = responseJson.contains("error") ? 401 : 200;
            } else if (path.startsWith("/api/employee/")) {
                EmployeeHandler handler = new EmployeeHandler();
                responseJson = handler.handle(method, path, body);
                statusCode = responseJson.contains("error") ? 500 : 200;
            } else if (path.startsWith("/api/customer/")) {
                CustomerHandler handler = new CustomerHandler();
                responseJson = handler.handleRequest(path, method, body);
                statusCode = responseJson.contains("error") ? 500 : 200;
            }

            // Debug logging
            System.out.println("Response: " + statusCode + " - " + responseJson);

            sendJsonResponse(out, statusCode, responseJson);
        }
        
        private void handleFileRequest(String path, OutputStream out) throws IOException {
            // Debug logging
            System.out.println("File Request: " + path);
            
            // Serve static files (HTML, CSS, JS) from the 'public' directory.
            if (path.equals("/")) {
                path = "/index.html";
            }

            // Remove query parameters from the path before creating file path
            String filePath = path;
            if (path.contains("?")) {
                filePath = path.substring(0, path.indexOf("?"));
                System.out.println("File path after removing query params: " + filePath);
            }

            Path fileSystemPath = Paths.get("public", filePath);
            System.out.println("Looking for file: " + fileSystemPath.toAbsolutePath());
            
            if (Files.exists(fileSystemPath) && !Files.isDirectory(fileSystemPath)) {
                String contentType = Files.probeContentType(fileSystemPath);
                if (contentType == null) {
                    if (filePath.endsWith(".css")) contentType = "text/css";
                    else if (filePath.endsWith(".js")) contentType = "application/javascript";
                    else contentType = "application/octet-stream";
                }
                
                byte[] fileBytes = Files.readAllBytes(fileSystemPath);
                System.out.println("Serving file: " + filePath + " (" + fileBytes.length + " bytes)");
                sendHttpResponse(out, 200, "OK", contentType, fileBytes);
            } else {
                System.out.println("File not found: " + fileSystemPath.toAbsolutePath());
                byte[] notFoundContent = "<h1>404 Not Found</h1>".getBytes();
                sendHttpResponse(out, 404, "Not Found", "text/html", notFoundContent);
            }
        }
        
        private void sendJsonResponse(OutputStream out, int code, String json) throws IOException {
            String statusMessage = code == 200 ? "OK" : "Error";
            sendHttpResponse(out, code, statusMessage, "application/json", json.getBytes());
        }

        private void sendHttpResponse(OutputStream out, int statusCode, String statusMessage, String contentType, byte[] content) throws IOException {
            PrintWriter writer = new PrintWriter(out, true);
            writer.println("HTTP/1.1 " + statusCode + " " + statusMessage);
            writer.println("Content-Type: " + contentType);
            writer.println("Content-Length: " + content.length);
            writer.println("Access-Control-Allow-Origin: *"); // For development
            writer.println("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
            writer.println("Access-Control-Allow-Headers: Content-Type, Authorization");
            writer.println(); // Blank line between headers and content
            writer.flush();
            out.write(content);
            out.flush();
        }
    }
}