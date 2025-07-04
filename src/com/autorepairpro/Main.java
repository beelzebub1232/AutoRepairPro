package com.autorepairpro;

import com.autorepairpro.server.SimpleHttpServer;

public class Main {
    public static void main(String[] args) {
        // Define the port to run the server on.
        int port = 8080;
        try {
            // Create and start the server.
            SimpleHttpServer server = new SimpleHttpServer(port);
            server.start();
        } catch (Exception e) {
            System.err.println("Failed to start server: " + e.getMessage());
            e.printStackTrace();
        }
    }
}