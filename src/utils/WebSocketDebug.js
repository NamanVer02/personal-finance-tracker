/**
 * WebSocketDebug.js - Utility for direct WebSocket debugging
 *
 * This utility provides low-level WebSocket connection testing,
 * bypassing SockJS and STOMP to test the raw WebSocket connection.
 * WSS is enforced as the only protocol since WS doesn't work.
 */

class WebSocketDebug {
  constructor() {
    this.ws = null;
    this.logCallback = null;
    this.connected = false;
    this.connectionAttempts = 0;

    // Based on diagnostics, WSS works while WS doesn't, so force WSS
    this.baseUrl = "https://localhost:8080";
    this.wsUrl = "wss://localhost:8080/ws";
  }

  /**
   * Set a callback function to receive logs
   * @param {Function} callback Function that receives log entries
   */
  setLogCallback(callback) {
    this.logCallback = callback;
  }

  /**
   * Log a message both to console and through the callback if set
   * @param {string} message Message to log
   * @param {string} level Log level (info, warn, error)
   */
  log(message, level = "info") {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, level };

    // Log to console
    switch (level) {
      case "error":
        console.error(`[WS-DEBUG] ${message}`);
        break;
      case "warn":
        console.warn(`[WS-DEBUG] ${message}`);
        break;
      default:
        console.log(`[WS-DEBUG] ${message}`);
    }

    // Call the callback if set
    if (this.logCallback) {
      this.logCallback(logEntry);
    }
  }

  /**
   * Test direct WebSocket connection to the server
   * @param {string} url WebSocket URL to connect to (always uses WSS)
   * @returns {Promise} Promise resolved when connection test completes
   */
  testDirectWebSocketConnection(url) {
    // Always use WSS regardless of provided URL
    const wsUrl = url?.startsWith("wss:") ? url : "wss://localhost:8080/ws";

    this.log(`Testing direct WebSocket connection to: ${wsUrl}`);
    this.connectionAttempts++;

    return new Promise((resolve, reject) => {
      try {
        // Close any existing connection
        if (this.ws) {
          this.log("Closing existing WebSocket connection", "info");
          this.ws.close();
          this.ws = null;
        }

        this.log(
          `Creating new WebSocket connection, attempt #${this.connectionAttempts}`
        );
        this.connected = false;

        // Create raw WebSocket connection
        this.ws = new WebSocket(wsUrl);

        // Connection opened handler
        this.ws.onopen = (event) => {
          this.log("WebSocket connection OPENED successfully!", "info");
          this.connected = true;

          // Send a test message
          try {
            this.log("Sending test message...");
            this.ws.send(
              JSON.stringify({
                type: "TEST",
                message: "Hello from WebSocketDebug",
                timestamp: new Date().toISOString(),
              })
            );
          } catch (err) {
            this.log(`Error sending test message: ${err.message}`, "error");
          }

          resolve({
            success: true,
            url: wsUrl,
            timestamp: new Date().toISOString(),
            event,
          });
        };

        // Error handler
        this.ws.onerror = (error) => {
          this.log(
            `WebSocket error: ${error.type || JSON.stringify(error)}`,
            "error"
          );
          this.connected = false;

          reject({
            success: false,
            url: wsUrl,
            timestamp: new Date().toISOString(),
            error: error.message || "Unknown WebSocket error",
          });
        };

        // Message handler
        this.ws.onmessage = (event) => {
          this.log(`Received message: ${event.data}`);
          try {
            const data = JSON.parse(event.data);
            this.log(`Parsed message data: ${JSON.stringify(data)}`);
          } catch (err) {
            this.log(`Message is not JSON: ${err.message}`, "warn");
          }
        };

        // Close handler
        this.ws.onclose = (event) => {
          this.log(
            `WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`
          );
          this.connected = false;
        };

        // Set timeout for connection
        setTimeout(() => {
          if (!this.connected) {
            this.log(
              "WebSocket connection timed out after 10 seconds",
              "error"
            );
            reject({
              success: false,
              url: wsUrl,
              timestamp: new Date().toISOString(),
              error: "Connection timeout",
            });

            // Try to clean up
            if (this.ws) {
              this.ws.close();
              this.ws = null;
            }
          }
        }, 10000);
      } catch (error) {
        this.log(
          `Failed to create WebSocket connection: ${error.message}`,
          "error"
        );
        reject({
          success: false,
          url: wsUrl,
          timestamp: new Date().toISOString(),
          error: error.message,
        });
      }
    });
  }

  /**
   * Test WSS protocol only - WS is no longer supported
   */
  async testAllProtocols() {
    this.log("Starting WSS protocol test");
    const results = {
      wss: null,
      sockjs: null,
      timestamp: new Date().toISOString(),
    };

    // Test secure WSS protocol
    try {
      this.log("Testing wss:// protocol");
      results.wss = await this.testDirectWebSocketConnection(
        "wss://localhost:8080/ws"
      );
    } catch (error) {
      this.log(`wss:// test failed: ${error.message}`, "error");
      results.wss = { success: false, error: error.message };
    }

    // Test HTTP endpoint that triggers a WebSocket message
    try {
      this.log("Testing WebSocket send via HTTP endpoint");
      const response = await fetch(
        `${this.baseUrl}/api/ws-debug/send-test-message`,
        {
          method: "GET",
        }
      );

      if (response.ok) {
        const data = await response.json();
        results.httpTrigger = {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
        this.log(
          `WebSocket message triggered via HTTP endpoint: ${JSON.stringify(
            data
          )}`
        );
      } else {
        results.httpTrigger = {
          success: false,
          status: response.status,
          statusText: response.statusText,
          timestamp: new Date().toISOString(),
        };
        this.log(`HTTP endpoint returned ${response.status}`, "error");
      }
    } catch (error) {
      results.httpTrigger = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
      this.log(`WebSocket HTTP trigger failed: ${error.message}`, "error");
    }

    return results;
  }

  /**
   * Test basic HTTPS connectivity
   */
  async testBasicHttpConnectivity() {
    this.log("Testing basic HTTPS connectivity");
    const results = {
      https: null,
      cors: null,
      timestamp: new Date().toISOString(),
    };

    // Test HTTPS endpoint
    try {
      this.log("Testing HTTPS endpoint");
      const httpsResponse = await fetch(
        `${this.baseUrl}/api/network-test/ping`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (httpsResponse.ok) {
        const data = await httpsResponse.json();
        results.https = {
          success: true,
          status: httpsResponse.status,
          data,
          timestamp: new Date().toISOString(),
        };
        this.log(`HTTPS endpoint test successful: ${JSON.stringify(data)}`);
      } else {
        results.https = {
          success: false,
          status: httpsResponse.status,
          statusText: httpsResponse.statusText,
          timestamp: new Date().toISOString(),
        };
        this.log(
          `HTTPS endpoint test failed: ${httpsResponse.status} ${httpsResponse.statusText}`,
          "error"
        );
      }
    } catch (error) {
      results.https = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
      this.log(`HTTPS endpoint test failed: ${error.message}`, "error");
    }

    // Test CORS-specific endpoint
    try {
      this.log("Testing CORS-specific endpoint");
      const corsResponse = await fetch(
        `${this.baseUrl}/api/network-test/cors-test`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (corsResponse.ok) {
        const data = await corsResponse.json();
        results.cors = {
          success: true,
          status: corsResponse.status,
          data,
          timestamp: new Date().toISOString(),
        };
        this.log(`CORS test successful: ${JSON.stringify(data)}`);
      } else {
        results.cors = {
          success: false,
          status: corsResponse.status,
          statusText: corsResponse.statusText,
          timestamp: new Date().toISOString(),
        };
        this.log(
          `CORS test failed: ${corsResponse.status} ${corsResponse.statusText}`,
          "error"
        );
      }
    } catch (error) {
      results.cors = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
      this.log(`CORS test failed: ${error.message}`, "error");
    }

    return results;
  }

  /**
   * Close the WebSocket connection
   */
  close() {
    if (this.ws) {
      this.log("Closing WebSocket connection");
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  /**
   * Get server information
   */
  async getServerInfo() {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/network-test/server-info`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        this.log(`Server info: ${JSON.stringify(data)}`);
        return { success: true, data };
      } else {
        return { success: false, status: response.status };
      }
    } catch (error) {
      this.log(`Failed to get server info: ${error.message}`, "error");
      return { success: false, error: error.message };
    }
  }
}

// Export a singleton instance
export default new WebSocketDebug();
