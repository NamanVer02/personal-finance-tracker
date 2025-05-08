import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

class ChatService {
  constructor() {
    this.stompClient = null;
    this.subscriptions = [];
    this.messageHandlers = [];
    this.connected = false;

    // Always use HTTPS/WSS regardless of browser protocol
    this.serverBaseUrl = "https://localhost:8080";
    this.serverUrl = "wss://localhost:8080/ws";
    this.apiBaseUrl = "https://localhost:8080/api";

    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.heartbeatInterval = null;
    this.connectionAttemptCount = 0;

    // Initialize with debug logging
    console.log(`[WEBSOCKET] ChatService initialized with:
      - Server URL: ${this.serverUrl}
      - API Base URL: ${this.apiBaseUrl}
      - Browser secure context: ${window.isSecureContext}
      - Current page protocol: ${window.location.protocol}
      - Using forced HTTPS/WSS connection
    `);
  }

  // Get authentication token from localStorage
  getAuthToken() {
    const token = localStorage.getItem("token");
    console.log(
      `[WEBSOCKET] Auth token ${token ? "found" : "not found"} in localStorage`
    );
    return token;
  }

  connect(username, successCallback, errorCallback) {
    if (this.stompClient) {
      this.log("Disconnecting existing STOMP client before creating a new one");
      this.disconnect();
    }

    if (!username) {
      const error = new Error("Username is required to connect to chat");
      this.log(`Connection error: ${error.message}`, "error");
      if (errorCallback) errorCallback(error);
      return;
    }

    // Current connection attempt
    this.reconnectAttempts++;

    this.log(
      `Attempting WSS connection (${this.reconnectAttempts}/${this.maxReconnectAttempts}) with username: ${username}`
    );

    // First try direct WebSocket to test connectivity
    try {
      const ws = new WebSocket("wss://localhost:8080/ws");

      ws.onopen = () => {
        this.log(
          "Direct WebSocket connection successful! Proceeding with STOMP",
          "info"
        );
        ws.close();

        // Now create STOMP client
        this.createStompClient(username, successCallback, errorCallback);
      };

      ws.onerror = (err) => {
        this.log(
          "Direct WebSocket connection failed, trying STOMP directly as fallback",
          "warn"
        );
        this.createStompClient(username, successCallback, errorCallback);
      };
    } catch (err) {
      this.log(`WebSocket connection test failed: ${err.message}`, "error");
      this.createStompClient(username, successCallback, errorCallback);
    }
  }

  /**
   * Create STOMP client connection
   * @private
   */
  createStompClient(username, successCallback, errorCallback) {
    this.log("Creating STOMP client");

    try {
      // Get authentication token
      const token = this.getAuthToken();

      // Use direct WebSocket for STOMP (no SockJS)
      const webSocketFactory = () => {
        this.log(`Creating WebSocket directly using: ${this.serverUrl}`);
        return new WebSocket(this.serverUrl);
      };

      this.stompClient = new Client({
        connectHeaders: {
          username: username,
          Authorization: token ? `Bearer ${token}` : "",
        },
        debug: (msg) => this.log(`STOMP: ${msg}`, "debug"),
        webSocketFactory: webSocketFactory,
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
      });

      // Set up connection success handler
      this.stompClient.onConnect = (frame) => {
        this.log(`STOMP connected: ${frame}`);
        this.connected = true;
        this.reconnectAttempts = 0;

        // Subscribe to chat topic
        this.log("Subscribing to chat topics");
        this.stompClient.subscribe(`/topic/chat`, (message) => {
          this.log(`Received message on /topic/chat: ${message.body}`);
          this.handleMessage(JSON.parse(message.body));
        });

        // Subscribe to user-specific topic
        this.stompClient.subscribe(
          `/user/${username}/queue/messages`,
          (message) => {
            this.log(
              `Received message on /user/${username}/queue/messages: ${message.body}`
            );
            this.handleMessage(JSON.parse(message.body));
          }
        );

        // Set up heartbeat
        this.setupHeartbeat();

        if (successCallback) successCallback(frame);
      };

      // Set up connection error handler
      this.stompClient.onStompError = (frame) => {
        const error = new Error(
          `STOMP protocol error: ${frame.headers.message}`
        );
        this.log(`STOMP error: ${error.message}`, "error");

        if (errorCallback) errorCallback(error);
        this.handleReconnect(username, successCallback, errorCallback);
      };

      // Set up WebSocket error handler
      this.stompClient.onWebSocketError = (event) => {
        const error = new Error(`WebSocket error: ${event.type}`);
        this.log(`WebSocket error: ${error.message}`, "error");

        if (errorCallback) errorCallback(error);
        this.handleReconnect(username, successCallback, errorCallback);
      };

      // Activate connection
      this.log("Activating STOMP client connection");
      this.stompClient.activate();
    } catch (error) {
      this.log(`STOMP client setup error: ${error.message}`, "error");
      if (errorCallback) errorCallback(error);
      this.handleReconnect(username, successCallback, errorCallback);
    }
  }

  /**
   * Internal logging function
   * @private
   */
  log(message, level = "info") {
    const msg = `[WEBSOCKET] ${message}`;

    switch (level) {
      case "error":
        console.error(msg);
        break;
      case "warn":
        console.warn(msg);
        break;
      case "debug":
        console.debug(msg);
        break;
      default:
        console.log(msg);
    }
  }

  // Process received message
  handleMessage(message) {
    this.log(`Processing message: ${JSON.stringify(message)}`);

    // Process message based on type
    if (message.type === "RECEIPT") {
      this.log(`Processing receipt for message`);
      // This is a message receipt, notify handlers with receipt info
      this.notifyMessageHandlers(message);
      return;
    }

    // For other message types, check if this is a server-side confirmation
    // of a message we've already sent locally
    if (message.localId) {
      this.log(
        `Message has localId: ${message.localId}, might be a confirmation`
      );
      message.confirmed = true;
      this.notifyMessageHandlers(message);
      return;
    }

    // Otherwise it's a regular incoming message
    this.log(`Regular incoming message`);
    this.notifyMessageHandlers(message);
  }

  /**
   * Handle reconnection attempts
   * @private
   */
  handleReconnect(username, successCallback, errorCallback) {
    // If we have remaining reconnection attempts
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.log(
        `Scheduling reconnection attempt ${this.reconnectAttempts + 1}/${
          this.maxReconnectAttempts
        }`
      );

      // Exponential backoff
      const backoff = Math.min(
        30000,
        1000 * Math.pow(2, this.reconnectAttempts)
      );
      this.log(`Reconnection backoff: ${backoff}ms`);

      setTimeout(() => {
        this.log("Attempting to reconnect...");
        this.connect(username, successCallback, errorCallback);
      }, backoff);
    } else {
      this.log("Maximum reconnection attempts reached. Giving up.", "error");
    }
  }

  async checkServerReachability() {
    try {
      console.log(
        `[WEBSOCKET] Checking server reachability at ${this.apiBaseUrl}/network-test/ping`
      );
      const response = await fetch(`${this.apiBaseUrl}/network-test/ping`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: `Server is reachable via ${data.protocol} on port ${data.serverPort}`,
          data,
        };
      } else {
        return {
          success: false,
          message: `Server returned status ${response.status} ${response.statusText}`,
        };
      }
    } catch (error) {
      console.error(`[WEBSOCKET] Server reachability check failed:`, error);
      return {
        success: false,
        message: `Cannot reach server: ${error.message}`,
        error,
      };
    }
  }

  setupHeartbeat() {
    // Setup a periodic check to ensure connection is alive
    this.heartbeatInterval = setInterval(() => {
      if (this.stompClient && this.stompClient.connected) {
        console.log(`[WEBSOCKET] Connection heartbeat check: CONNECTED`);
      } else {
        console.warn(`[WEBSOCKET] Connection heartbeat check: DISCONNECTED`);
        // Only attempt reconnect if not already in progress
        if (this.stompClient && !this.stompClient.active) {
          console.log(
            `[WEBSOCKET] Attempting to reconnect from heartbeat check...`
          );
          this.reconnect("user", () => {
            console.log(
              "[WEBSOCKET] Reconnected successfully from heartbeat check."
            );
          });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  reconnect(username, onConnected, onError) {
    console.log(`[WEBSOCKET] Attempting to reconnect STOMP client...`);
    this.disconnect();
    // Wait a moment before reconnecting
    setTimeout(() => this.connect(username, onConnected, onError), 1000);
  }

  disconnect() {
    // Clear heartbeat check
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log(`[WEBSOCKET] Cleared heartbeat interval during disconnect`);
    }

    if (this.stompClient) {
      try {
        console.log(`[WEBSOCKET] Deactivating STOMP client...`);
        this.stompClient.deactivate();
        console.log(`[WEBSOCKET] STOMP client deactivated successfully`);
      } catch (error) {
        console.error(`[WEBSOCKET ERROR] Error disconnecting:`, error);
      }
      this.connected = false;
    } else {
      console.log(`[WEBSOCKET] No STOMP client to disconnect`);
    }
  }

  sendMessage(chatMessage) {
    console.log(`[CHAT] Attempting to send message:`, chatMessage);

    // Create a unique localId if not present (for client-side tracking only)
    if (!chatMessage.localId) {
      chatMessage.localId = `msg_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
    }

    // Remove any client-generated ID to avoid conflicts with server
    // The server will assign a proper Long ID
    if (
      chatMessage.id &&
      typeof chatMessage.id === "string" &&
      chatMessage.id.startsWith("tmp-")
    ) {
      delete chatMessage.id;
    }

    if (this.stompClient && this.connected) {
      try {
        const token = this.getAuthToken();
        console.log(
          `[CHAT] Publishing to /app/chat.sendMessage with token: ${
            token ? "Yes" : "No"
          }`
        );

        // Add timestamp if not present
        if (!chatMessage.timestamp) {
          chatMessage.timestamp = new Date().toISOString();
        }

        this.stompClient.publish({
          destination: "/app/chat.sendMessage",
          body: JSON.stringify(chatMessage),
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        console.log(`[CHAT] Message published successfully:`, chatMessage);

        // Also publish receipt confirmation to help client-side UI updates
        setTimeout(() => {
          const confirmationMsg = {
            ...chatMessage,
            type: "RECEIPT",
            timestamp: new Date().toISOString(),
            status: "SENT",
          };
          this.handleMessage(confirmationMsg);
        }, 500);
      } catch (error) {
        console.error(`[CHAT ERROR] Error sending message:`, error);
      }
    } else {
      console.error(
        `[CHAT ERROR] Cannot send message - STOMP client ${
          this.stompClient ? "exists" : "does not exist"
        }, connected: ${this.connected}`
      );
    }
  }

  addMessageHandler(handler) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler) {
    const index = this.messageHandlers.indexOf(handler);
    if (index !== -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  notifyMessageHandlers(message) {
    this.messageHandlers.forEach((handler) => handler(message));
  }

  fetchChatHistory() {
    console.log(
      "Fetching chat history from:",
      `${this.apiBaseUrl}/chat/history`
    );
    const token = this.getAuthToken();

    return fetch(`${this.apiBaseUrl}/chat/history`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then((response) => {
        if (!response.ok) {
          console.error(
            "Error fetching chat history:",
            response.status,
            response.statusText
          );
          throw new Error(
            `Failed to fetch chat history: ${response.status} ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((messages) => {
        // Mark all fetched messages as confirmed (they're from the server)
        return messages.map((msg) => ({
          ...msg,
          confirmed: true,
          pending: false,
        }));
      })
      .catch((error) => {
        console.error("Chat history fetch error:", error);
        throw error;
      });
  }

  // Test direct WebSocket connection
  testDirectWebSocket() {
    const token = this.getAuthToken();
    const wsUrl = "wss://localhost:8080/ws";
    console.log(`[WEBSOCKET] Testing direct WebSocket connection to ${wsUrl}`);

    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log(`[WEBSOCKET] Direct WebSocket connection successful!`);
          ws.send(
            JSON.stringify({
              type: "TEST",
              content: "Test message for direct WebSocket",
              timestamp: new Date().toISOString(),
            })
          );

          setTimeout(() => {
            ws.close();
            resolve({
              success: true,
              url: wsUrl,
              timestamp: new Date().toISOString(),
            });
          }, 1000);
        };

        ws.onerror = (error) => {
          console.error(
            `[WEBSOCKET] Direct WebSocket connection failed:`,
            error
          );
          reject({
            success: false,
            url: wsUrl,
            error: error.message || "Unknown WebSocket error",
            timestamp: new Date().toISOString(),
          });
        };

        ws.onmessage = (event) => {
          console.log(
            `[WEBSOCKET] Received message on direct WebSocket:`,
            event.data
          );
        };

        ws.onclose = (event) => {
          console.log(
            `[WEBSOCKET] Direct WebSocket closed. Code: ${
              event.code
            }, Reason: ${event.reason || "none"}`
          );
        };

        // Set a timeout
        setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            console.error(`[WEBSOCKET] Direct WebSocket connection timed out`);
            ws.close();
            reject({
              success: false,
              url: wsUrl,
              error: "Connection timeout",
              timestamp: new Date().toISOString(),
            });
          }
        }, 5000);
      } catch (error) {
        console.error(`[WEBSOCKET] Error creating direct WebSocket:`, error);
        reject({
          success: false,
          url: wsUrl,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  // Test connectivity to server
  testConnection() {
    const startTime = new Date().toISOString();
    console.log(`
    =====================================================
    [CONNECTION TEST] Started at ${startTime}
    =====================================================
    - Testing endpoint: ${this.apiBaseUrl}/network-test/ping
    - Browser URL: ${window.location.href}
    - Using auth token: ${this.getAuthToken() ? "Yes" : "No"}
    `);

    return fetch(`${this.apiBaseUrl}/network-test/ping`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then((response) => {
        console.log(
          `[CONNECTION TEST] Test endpoint response: ${response.status} ${response.statusText}`
        );
        if (response.ok) {
          return response.json().then((data) => {
            console.log(`[CONNECTION TEST] Server protocol: ${data.protocol}`);

            return {
              status: "success",
              message: "Server ping successful",
              protocol: data.protocol,
              brokerActive: true,
              authenticated: !!this.getAuthToken(),
            };
          });
        } else {
          throw new Error(`Server responded with ${response.status}`);
        }
      })
      .catch((error) => {
        console.error(`[CONNECTION TEST] Test failed: ${error.message}`);
        throw new Error("Server unreachable via HTTPS");
      });
  }
}

export default new ChatService();
