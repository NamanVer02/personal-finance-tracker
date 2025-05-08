import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../AuthContext";
import ChatService from "../utils/ChatService";
import ConnectionTest from "../utils/ConnectionTest";
import WebSocketDebug from "../utils/WebSocketDebug";
import ChatMessage from "./ChatMessage";
import { toast } from "react-toastify";
import { Send, RefreshCw, AlertCircle, Activity, Bug, Zap } from "lucide-react";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    api: false,
    socket: false,
    broker: false,
    authenticated: false,
    diagnostics: {
      online: navigator.onLine,
      secureContext: window.isSecureContext,
      protocol: window.location.protocol,
      ports: null,
    },
  });
  const [certificateError, setCertificateError] = useState(false);
  const { currentUser } = useAuth();
  const messagesEndRef = useRef(null);
  const connectionCheckRef = useRef(null);
  const messageHandlerRef = useRef(null);

  // Add new debug state
  const [debugMode, setDebugMode] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const debugLogRef = useRef([]);

  // New debug monitoring function
  const addDebugLog = (message, type = "info") => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };

    // Update both the state and ref (ref for immediate access in callbacks)
    debugLogRef.current = [...debugLogRef.current, logEntry].slice(-100); // Keep last 100 entries
    setDebugLog(debugLogRef.current);

    // Also log to console with type-based formatting
    switch (type) {
      case "error":
        console.error(`[CHAT DEBUG] ${message}`);
        break;
      case "warning":
        console.warn(`[CHAT DEBUG] ${message}`);
        break;
      default:
        console.log(`[CHAT DEBUG] ${message}`);
    }
  };

  // Message handler function that will be registered with ChatService
  const handleIncomingMessage = (message) => {
    addDebugLog(`Message received: ${JSON.stringify(message)}`);

    // If this is a receipt confirmation
    if (message.type === "RECEIPT") {
      setMessages((prevMessages) => {
        return prevMessages.map((msg) => {
          if (msg.localId === message.localId) {
            // Update the pending message with confirmed status
            addDebugLog(
              `Updating message status: ${msg.localId} is now confirmed`
            );
            return {
              ...msg,
              pending: false,
              // Don't copy over string IDs from receipts, server will assign proper ID later
              timestamp: message.timestamp || msg.timestamp,
            };
          }
          return msg;
        });
      });
      return;
    }

    // If this is a confirmed message with a localId (response to our own message)
    if (message.confirmed && message.localId) {
      setMessages((prevMessages) => {
        // Check if we have this as a pending message
        const hasPendingMessage = prevMessages.some(
          (msg) => msg.localId === message.localId
        );

        if (hasPendingMessage) {
          // Update the existing message with server info
          return prevMessages.map((msg) => {
            if (msg.localId === message.localId) {
              addDebugLog(
                `Updating pending message with server data: ${msg.localId} -> id: ${message.id}`
              );
              return {
                ...msg,
                id: message.id, // Use server-assigned ID
                pending: false,
                timestamp: message.timestamp,
              };
            }
            return msg;
          });
        } else {
          // It's a new message we don't have yet
          addDebugLog(`Adding new confirmed message: ${message.content}`);
          return [...prevMessages, message];
        }
      });
      return;
    }

    // Regular new message from someone else
    addDebugLog(
      `Adding regular message from ${message.sender}: ${message.content}`
    );
    setMessages((prevMessages) => {
      // Avoid duplicates by checking if we already have this message
      const isDuplicate = prevMessages.some(
        (msg) =>
          // Check if we have this message by server ID
          (message.id && msg.id === message.id) ||
          // Or if we have this message by localId
          (message.localId && msg.localId === message.localId)
      );

      if (isDuplicate) {
        addDebugLog(
          `Duplicate message detected, ignoring: ${
            message.id || message.localId
          }`
        );
        return prevMessages;
      }
      return [...prevMessages, message];
    });
  };

  useEffect(() => {
    if (currentUser && currentUser.username) {
      addDebugLog(`Chat component mounted. User: ${currentUser.username}`);

      // First, check SSL certificate
      addDebugLog("Checking SSL certificate...");
      verifyCertificate();

      // Run network diagnostics
      addDebugLog("Running network diagnostics...");
      runNetworkDiagnostics();

      addDebugLog("Connecting to chat...");
      connectToChat();

      addDebugLog("Loading chat history...");
      loadChatHistory();

      addDebugLog("Checking server status...");
      checkServerStatus();

      // Set up periodic connection checks
      addDebugLog("Setting up periodic connection checks");
      connectionCheckRef.current = setInterval(() => {
        addDebugLog("Running periodic server status check", "info");
        checkServerStatus();
      }, 30000); // Check every 30 seconds
    }

    return () => {
      addDebugLog("Chat component unmounting, cleaning up...");

      // Clean up message handler
      if (messageHandlerRef.current) {
        ChatService.removeMessageHandler(messageHandlerRef.current);
        messageHandlerRef.current = null;
      }

      ChatService.disconnect();
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
    };
  }, [currentUser]);

  useEffect(() => {
    // Scroll to bottom whenever messages update
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Handle reconnection state changes
    if (isConnected) {
      const pendingMessages = messages.filter((msg) => msg.pending);

      if (pendingMessages.length > 0) {
        addDebugLog(
          `Found ${pendingMessages.length} pending messages after reconnection`
        );

        // For each pending message, check if we should retry sending it
        pendingMessages.forEach((msg) => {
          // Only retry sending recent pending messages (less than 30 minutes old)
          const msgTime = new Date(msg.timestamp).getTime();
          const now = new Date().getTime();
          const thirtyMinutes = 30 * 60 * 1000;

          if (now - msgTime < thirtyMinutes) {
            addDebugLog(
              `Retrying send for recent pending message: ${msg.content}`
            );
            ChatService.sendMessage({
              ...msg,
              timestamp: new Date().toISOString(), // Update timestamp for retry
            });
          }
        });
      }

      // Refresh chat history after reconnection
      loadChatHistory();
    }
  }, [isConnected]); // Only run when connection state changes

  const checkServerStatus = () => {
    addDebugLog("Checking server status...");
    ChatService.testConnection()
      .then((response) => {
        addDebugLog(`Server status check success: ${JSON.stringify(response)}`);
        setConnectionStatus({
          api: true,
          broker: response.brokerActive,
          authenticated: response.authenticated,
          username: response.username,
        });

        // If we think we're disconnected but the API is working, try to reconnect
        if (!isConnected && currentUser) {
          addDebugLog(
            "API available but socket disconnected. Attempting to reconnect...",
            "warning"
          );
          connectToChat();
        }
      })
      .catch((error) => {
        addDebugLog(`Server status check failed: ${error.message}`, "error");
        setConnectionStatus({
          api: false,
          socket: false,
          broker: false,
          authenticated: false,
        });

        // If we previously thought we were connected, update status
        if (isConnected) {
          setIsConnected(false);
          setConnectionError(
            "Cannot reach chat server. Please check your internet connection."
          );
        }
      });
  };

  const connectToChat = () => {
    setIsLoading(true);
    setConnectionError(null);
    addDebugLog(`Connecting to chat as ${currentUser.username}...`);
    addDebugLog(`Using URL: ${ChatService.serverUrl}`);

    // Always use WSS - this should already be set in ChatService
    // but we double-check here for safety
    if (!ChatService.serverUrl.startsWith("wss:")) {
      addDebugLog("Forcing WSS protocol for connection");
      ChatService.serverUrl = "wss://localhost:8080/ws";
      ChatService.apiBaseUrl = "https://localhost:8080/api";
      ChatService.serverBaseUrl = "https://localhost:8080";
    }

    // Remove existing message handler if it exists
    if (messageHandlerRef.current) {
      addDebugLog("Removing existing message handler");
      ChatService.removeMessageHandler(messageHandlerRef.current);
      messageHandlerRef.current = null;
    }

    // Connect to chat service
    ChatService.connect(
      currentUser.username,
      () => {
        addDebugLog("Chat connection successful!");
        setIsConnected(true);
        setConnectionError(null);
        setIsLoading(false);
        setConnectionStatus((prev) => ({ ...prev, socket: true }));
        toast.success("Connected to chat");

        // Register message handler function
        messageHandlerRef.current = handleIncomingMessage;
        ChatService.addMessageHandler(messageHandlerRef.current);
        addDebugLog("Message handler registered");
      },
      (error) => {
        addDebugLog(
          `Chat connection error: ${error.message || JSON.stringify(error)}`,
          "error"
        );
        setIsConnected(false);
        setIsLoading(false);
        setConnectionStatus((prev) => ({ ...prev, socket: false }));

        let errorMessage = "Could not connect to chat server";
        if (error && error.message) {
          errorMessage += `: ${error.message}`;
        } else if (error && error.type === "error") {
          // WebSocket error
          errorMessage += ": Network error - Check SSL certificate settings";
        }

        addDebugLog(`Setting error message: ${errorMessage}`, "error");
        setConnectionError(errorMessage);
        toast.error(errorMessage);
      }
    );
  };

  const loadChatHistory = () => {
    setIsLoading(true);
    addDebugLog("Loading chat history...");

    ChatService.fetchChatHistory()
      .then((data) => {
        addDebugLog(`Chat history loaded: ${data.length} messages`);

        // Merge with existing messages - favor server data but keep pending messages
        setMessages((prevMessages) => {
          // Get all pending messages that might not be on the server yet
          const pendingMessages = prevMessages.filter((msg) => msg.pending);
          addDebugLog(
            `Found ${pendingMessages.length} pending messages to preserve`
          );

          // Create a map of all server messages by ID for easy lookup
          const serverMessagesMap = new Map();
          data.forEach((msg) => {
            if (msg.id) {
              serverMessagesMap.set(msg.id, msg);
            }
          });

          // Create a map to track existing messages by localId
          const pendingByLocalId = new Map();
          pendingMessages.forEach((msg) => {
            if (msg.localId) {
              pendingByLocalId.set(msg.localId, msg);
            }
          });

          // First, check if any pending messages have matching server messages (by content/sender/time)
          // This can happen if the server received our message but the client didn't get the confirmation
          data.forEach((serverMsg) => {
            if (!serverMsg.content) return;

            pendingMessages.forEach((pendingMsg) => {
              // If content, sender, and approximate timestamp match, they're likely the same message
              if (
                pendingMsg.content === serverMsg.content &&
                pendingMsg.sender === serverMsg.sender
              ) {
                const serverTime = new Date(serverMsg.timestamp).getTime();
                const pendingTime = new Date(pendingMsg.timestamp).getTime();
                const timeDiff = Math.abs(serverTime - pendingTime);

                // If messages are within 1 minute of each other, assume it's the same message
                if (timeDiff < 60000) {
                  addDebugLog(
                    `Found matching server message for pending message: ${pendingMsg.localId} -> ${serverMsg.id}`
                  );
                  // Update the pendingByLocalId map entry to include the server id
                  if (pendingMsg.localId) {
                    const updatedPending = {
                      ...pendingMsg,
                      id: serverMsg.id,
                      pending: false, // No longer pending since server has it
                    };
                    pendingByLocalId.set(pendingMsg.localId, updatedPending);
                  }
                }
              }
            });
          });

          // Now create the final merged message list
          // Start with all server messages
          const mergedMessages = [...data];

          // Then add any remaining pending messages that don't have server IDs
          pendingByLocalId.forEach((pendingMsg) => {
            // Only add truly pending messages with no server ID
            if (pendingMsg.pending && !pendingMsg.id) {
              mergedMessages.push(pendingMsg);
            }
          });

          // Remove duplicates (by id)
          const uniqueMessages = [];
          const seenIds = new Set();
          const seenLocalIds = new Set();

          for (const msg of mergedMessages) {
            // Skip if we've seen this server ID before
            if (msg.id && seenIds.has(msg.id)) {
              continue;
            }

            // Skip if we've seen this localId before and it's not a real server message
            if (!msg.id && msg.localId && seenLocalIds.has(msg.localId)) {
              continue;
            }

            // Track IDs we've seen
            if (msg.id) {
              seenIds.add(msg.id);
            }
            if (msg.localId) {
              seenLocalIds.add(msg.localId);
            }

            uniqueMessages.push(msg);
          }

          // Sort by timestamp
          return uniqueMessages.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeA - timeB;
          });
        });

        setIsLoading(false);
        setConnectionStatus((prev) => ({ ...prev, api: true }));
      })
      .catch((error) => {
        addDebugLog(`Failed to load chat history: ${error.message}`, "error");
        setIsLoading(false);
        setConnectionStatus((prev) => ({ ...prev, api: false }));
        const errorMessage = `Failed to load chat history: ${
          error.message || "Network error"
        }`;
        toast.error(errorMessage);
      });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (messageContent.trim() && currentUser && isConnected) {
      const messageText = messageContent.trim();
      addDebugLog(`Sending message: "${messageText}"`);

      // Generate a unique ID for client-side tracking only
      const localId = `tmp-${Date.now()}`;

      const chatMessage = {
        content: messageText,
        sender: currentUser.username,
        type: "CHAT",
        userId: currentUser.id,
        timestamp: new Date().toISOString(),
        localId: localId, // Add this for tracking in our client-side system
      };

      // Add to local messages immediately for instant feedback
      const tempMessage = {
        ...chatMessage,
        pending: true,
      };

      setMessages((prevMessages) => [...prevMessages, tempMessage]);

      // Clear input field immediately for better UX
      setMessageContent("");

      // Send to server
      ChatService.sendMessage(chatMessage);

      // Set a timeout to check if message was confirmed within 5 seconds
      setTimeout(() => {
        setMessages((prevMessages) => {
          const isPending = prevMessages.some(
            (m) => m.localId === localId && m.pending
          );

          if (isPending) {
            addDebugLog(
              `Message still pending after 5s: ${messageText}`,
              "warning"
            );

            // Update the pending message status
            return prevMessages.map((m) =>
              m.localId === localId && m.pending
                ? { ...m, sendStatus: "delayed" }
                : m
            );

            // After first timeout, try to reload chat history
            setTimeout(() => {
              if (isConnected) {
                addDebugLog(
                  "Refreshing chat history to sync with server",
                  "info"
                );
                loadChatHistory();
              }
            }, 3000);
          }

          return prevMessages;
        });
      }, 5000);
    } else if (!isConnected) {
      addDebugLog("Cannot send message: Not connected to chat server", "error");
      toast.error("Cannot send message: Not connected to chat server");
    }
  };

  const handleReconnect = () => {
    if (currentUser) {
      addDebugLog("Manual reconnect initiated by user");
      // Always ensure we're using WSS
      addDebugLog("Using WSS protocol for reconnection");
      ChatService.serverUrl = "wss://localhost:8080/ws";
      ChatService.apiBaseUrl = "https://localhost:8080/api";
      ChatService.serverBaseUrl = "https://localhost:8080";

      checkServerStatus();
      connectToChat();
    }
  };

  const scrollToBottom = () => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const getConnectionStatusMessage = () => {
    if (isConnected) {
      return "Connected to chat server";
    }

    if (connectionError) {
      return connectionError;
    }

    if (isLoading) {
      return "Connecting to chat server...";
    }

    return "Not connected to chat server";
  };

  const verifyCertificate = () => {
    addDebugLog("Verifying SSL certificate settings");

    fetch("https://localhost:8080/api/network-test/ping")
      .then((response) => {
        addDebugLog("SSL certificate accepted by browser");
        setCertificateError(false);
      })
      .catch((error) => {
        addDebugLog(`SSL certificate error: ${error.message}`, "error");
        setCertificateError(true);
      });
  };

  const runNetworkDiagnostics = () => {
    addDebugLog("Running network diagnostics");

    const diagnosticsData = {
      online: navigator.onLine,
      secureContext: window.isSecureContext,
      protocol: window.location.protocol,
      ports: null,
    };

    addDebugLog(`Browser: ${navigator.userAgent}`);
    addDebugLog(`Window protocol: ${window.location.protocol}`);
    addDebugLog(`Secure context: ${window.isSecureContext}`);
    addDebugLog(`Online status: ${navigator.onLine}`);
    addDebugLog(
      `Auth token exists: ${localStorage.getItem("token") ? "Yes" : "No"}`
    );
    addDebugLog(`Connected to chat: ${isConnected ? "Yes" : "No"}`);
    addDebugLog(`ChatService URL: ${ChatService.serverUrl}`);
    addDebugLog(`ChatService API URL: ${ChatService.apiBaseUrl}`);
    addDebugLog(`Using forced WSS: Yes`);

    setConnectionStatus((prev) => ({
      ...prev,
      diagnostics: diagnosticsData,
    }));

    // Test WSS connection
    testDirectWebSocket("wss");
  };

  const runConnectionTest = async () => {
    addDebugLog("Starting connection test");

    try {
      addDebugLog("Testing basic HTTPS connectivity...");
      const httpsResponse = await fetch(
        "https://localhost:8080/api/network-test/ping",
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (httpsResponse.ok) {
        const data = await httpsResponse.json();
        addDebugLog(`HTTPS endpoint test successful: ${JSON.stringify(data)}`);

        // If HTTPS worked, test WebSocket over WSS
        addDebugLog("HTTPS endpoint is working, testing WebSocket over wss://");
        await testDirectWebSocket("wss");
      }
    } catch (error) {
      addDebugLog(`HTTPS endpoint test failed: ${error.message}`, "error");
    }

    try {
      // Test CORS
      addDebugLog("Testing CORS-specific endpoint");
      const corsResponse = await fetch(
        "https://localhost:8080/api/network-test/cors-test",
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (corsResponse.ok) {
        const data = await corsResponse.json();
        addDebugLog(`CORS test successful: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      addDebugLog(`CORS test failed: ${error.message}`, "error");
    }

    try {
      // Test WebSocket send via HTTP endpoint
      addDebugLog("Testing WebSocket send via HTTP endpoint");
      const wsHttpResponse = await fetch(
        "https://localhost:8080/api/ws-debug/send-test-message",
        {
          method: "GET",
        }
      );

      if (wsHttpResponse.ok) {
        addDebugLog("WebSocket message triggered via HTTP endpoint");
      } else {
        addDebugLog(`HTTP endpoint returned ${wsHttpResponse.status}`, "error");
      }
    } catch (error) {
      addDebugLog(`WebSocket HTTP trigger failed: ${error.message}`, "error");
    }

    addDebugLog("Connection test completed");
  };

  const runFullDiagnostics = () => {
    const timestamp = new Date().toISOString();
    addDebugLog(`[${timestamp}] Running full diagnostics...`);

    // Browser info
    addDebugLog(`Browser: ${navigator.userAgent}`);
    addDebugLog(`Window protocol: ${window.location.protocol}`);
    addDebugLog(`Secure context: ${window.isSecureContext}`);
    addDebugLog(`Online status: ${navigator.onLine}`);
    addDebugLog(
      `Auth token exists: ${localStorage.getItem("token") ? "Yes" : "No"}`
    );
    addDebugLog(`Connected to chat: ${isConnected ? "Yes" : "No"}`);
    addDebugLog(`ChatService URL: ${ChatService.serverUrl}`);
    addDebugLog(`ChatService API URL: ${ChatService.apiBaseUrl}`);
    addDebugLog(`Using forced WSS: Yes`);

    // Connection status
    const connectionStatusString = JSON.stringify({
      api: connectionStatus.api,
      socket: connectionStatus.socket,
      broker: connectionStatus.broker,
      authenticated: connectionStatus.authenticated,
      diagnostics: {
        online: navigator.onLine,
        secureContext: window.isSecureContext,
        protocol: window.location.protocol,
        ports: null,
      },
    });
    addDebugLog(`Connection status: ${connectionStatusString}`);

    // Run comprehensive test
    addDebugLog("Testing basic HTTP/HTTPS connectivity without WebSocket...");
    addDebugLog("Testing HTTPS endpoint");
    fetch("https://localhost:8080/api/network-test/ping")
      .then((response) => response.json())
      .then((data) => {
        addDebugLog(`HTTPS endpoint test successful: ${JSON.stringify(data)}`);

        // If HTTPS worked, test WebSocket over WSS
        addDebugLog("HTTPS endpoint is working, testing WebSocket over wss://");
        testDirectWebSocket("wss");
      })
      .catch((error) => {
        addDebugLog(`HTTPS endpoint test failed: ${error.message}`, "error");
      });

    // Test CORS
    addDebugLog("Testing CORS-specific endpoint");
    fetch("https://localhost:8080/api/network-test/cors-test")
      .then((response) => response.json())
      .then((data) => {
        addDebugLog(`CORS test successful: ${JSON.stringify(data)}`);
      })
      .catch((error) => {
        addDebugLog(`CORS test failed: ${error.message}`, "error");
      });

    // Test WebSocket directly
    addDebugLog("Testing direct WebSocket connections...");
    addDebugLog("Starting comprehensive WebSocket protocol test");
    addDebugLog("Testing wss:// protocol");
    testDirectWebSocket("wss");
  };

  const testDirectWebSocket = (protocol) => {
    if (protocol !== "wss") {
      addDebugLog(
        "Skipping non-WSS direct WebSocket test. Only WSS is supported.",
        "warning"
      );
      return;
    }

    const wsUrl = "wss://localhost:8080/ws";
    addDebugLog(`Testing direct WebSocket connection to: ${wsUrl}`);

    let wsConnectionAttempt = 0;
    try {
      // Close any existing test connection
      addDebugLog("Closing existing WebSocket connection");

      // Create new test connection
      wsConnectionAttempt++;
      addDebugLog(
        `Creating new WebSocket connection, attempt #${wsConnectionAttempt}`
      );

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        addDebugLog("WebSocket connection OPENED successfully!", "info");
        addDebugLog("Sending test message...");

        // Send a test message
        ws.send(
          JSON.stringify({
            type: "TEST",
            content: "Connection test message",
            timestamp: new Date().toISOString(),
          })
        );

        // Close after successful test
        setTimeout(() => {
          ws.close();
          addDebugLog("WSS connection successful!");

          // Update connection status
          setConnectionStatus((prev) => ({
            ...prev,
            diagnostics: {
              ...prev.diagnostics,
              wssWorks: true,
            },
          }));
        }, 1000);
      };

      ws.onmessage = (event) => {
        addDebugLog(`Received WebSocket message: ${event.data}`);
      };

      ws.onerror = (error) => {
        addDebugLog(`WebSocket error: ${error.type}`, "error");
        setConnectionStatus((prev) => ({
          ...prev,
          diagnostics: {
            ...prev.diagnostics,
            wssWorks: false,
          },
        }));
      };

      ws.onclose = (event) => {
        addDebugLog(
          `WebSocket connection closed. Code: ${event.code}, Reason: ${
            event.reason || ""
          }, Clean: ${event.wasClean}`
        );
      };
    } catch (error) {
      addDebugLog(`Error creating WebSocket: ${error.message}`, "error");
    }
  };

  return (
    <div className="bg-gray-100 rounded-lg shadow-neumorphic-button overflow-hidden">
      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">Chat</h2>
        <div className="flex items-center">
          <span
            className={`h-2 w-2 rounded-full mr-2 ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></span>
          <span className="text-sm text-gray-600">
            {getConnectionStatusMessage()}
          </span>
          {!isConnected && !isLoading && (
            <button
              onClick={handleReconnect}
              className="ml-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
              title="Reconnect"
            >
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </button>
          )}
          {isLoading && (
            <div className="ml-2 animate-spin">
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </div>
          )}
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="ml-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
            title="Toggle Debug Mode"
          >
            <Bug
              className={`h-4 w-4 ${
                debugMode ? "text-purple-600" : "text-gray-600"
              }`}
            />
          </button>
        </div>
      </div>

      {debugMode && (
        <div className="p-2 bg-gray-800 text-xs text-gray-300 max-h-48 overflow-y-auto font-mono">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold">WebSocket Debug Console</span>
            <button
              onClick={runFullDiagnostics}
              className="px-2 py-1 bg-purple-700 text-white rounded text-xs"
            >
              Run Full Diagnostics
            </button>
          </div>
          {debugLog.map((log, index) => (
            <div
              key={index}
              className={`mb-1 ${
                log.type === "error"
                  ? "text-red-400"
                  : log.type === "warning"
                  ? "text-yellow-400"
                  : "text-gray-300"
              }`}
            >
              <span className="opacity-50">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>{" "}
              {log.message}
            </div>
          ))}
          {debugLog.length === 0 && (
            <div className="italic text-gray-500">
              No logs yet. Actions will be logged here.
            </div>
          )}
        </div>
      )}

      <div
        className={`${
          debugMode ? "h-64" : "h-96"
        } overflow-y-auto p-4 flex flex-col space-y-2 bg-gray-100`}
      >
        {messages.length === 0 && !connectionError && !isLoading && (
          <div className="text-center text-gray-500 py-8">No messages yet</div>
        )}

        {isLoading && messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="inline-block animate-spin mr-2">
              <RefreshCw className="h-5 w-5 text-purple-600" />
            </div>
            Loading chat...
          </div>
        )}

        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            message={msg}
            isOwnMessage={msg.sender === currentUser?.username}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-4 bg-gray-100">
        <form onSubmit={sendMessage} className="flex">
          <input
            type="text"
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600 mr-2 shadow-neumorphic-inset-button bg-gray-100"
            placeholder={
              isConnected ? "Type a message..." : "Connect to start chatting..."
            }
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            disabled={!isConnected}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg shadow-neumorphic-button bg-gray-100 text-purple-600 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:text-gray-400 flex items-center justify-center"
            disabled={!isConnected || !messageContent.trim()}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
        {connectionError && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 text-sm rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Connection Error:</p>
                <p>{connectionError}</p>
                {(certificateError ||
                  connectionError.includes("certificate") ||
                  connectionError.includes("SSL")) && (
                  <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded">
                    <p className="font-bold">SSL Certificate Issue Detected</p>
                    <p className="mt-1">
                      This application uses a self-signed SSL certificate that
                      your browser needs to accept:
                    </p>
                    <ol className="list-decimal ml-5 mt-2">
                      <li>
                        Open{" "}
                        <a
                          href="https://localhost:8080"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-600"
                        >
                          https://localhost:8080
                        </a>{" "}
                        directly in a new tab
                      </li>
                      <li>
                        You'll see a warning about the certificate not being
                        trusted
                      </li>
                      <li>
                        Click "Advanced" and then "Proceed to localhost
                        (unsafe)"
                      </li>
                      <li>
                        Return to this tab and click the reconnect button below
                      </li>
                    </ol>
                    <button
                      onClick={handleReconnect}
                      className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors w-full"
                    >
                      Reconnect after accepting certificate
                    </button>
                  </div>
                )}
                <div className="mt-2 text-xs">
                  <p>Connection Status:</p>
                  <ul className="list-disc pl-5">
                    <li>
                      API: {connectionStatus.api ? "Available" : "Unavailable"}
                    </li>
                    <li>
                      WebSocket:{" "}
                      {connectionStatus.socket ? "Connected" : "Disconnected"}
                    </li>
                    <li>
                      Authentication:{" "}
                      {connectionStatus.authenticated
                        ? "Authenticated"
                        : "Not Authenticated"}
                    </li>
                  </ul>

                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={runNetworkDiagnostics}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                    >
                      Run Diagnostics
                    </button>

                    <button
                      onClick={runConnectionTest}
                      className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded flex items-center"
                    >
                      <Activity className="w-3 h-3 mr-1" /> Test Connection
                    </button>

                    <button
                      onClick={() => {
                        const result = ChatService.toggleProtocol();
                        toast.info(
                          `Switched to ${result.protocol.toUpperCase()} protocol`
                        );
                        setConnectionStatus((prev) => ({
                          ...prev,
                          diagnostics: {
                            ...prev.diagnostics,
                            protocol: result.protocol,
                          },
                        }));
                      }}
                      className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded"
                    >
                      Toggle HTTP/HTTPS
                    </button>

                    <button
                      onClick={() => {
                        runNetworkDiagnostics();
                        setTimeout(() => handleReconnect(), 1000);
                      }}
                      className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded"
                    >
                      Switch & Reconnect
                    </button>
                  </div>

                  {connectionStatus.diagnostics && (
                    <div className="mt-2 border-t pt-2 border-gray-200">
                      <p>Diagnostics:</p>
                      <ul className="list-disc pl-5">
                        <li>
                          Browser Online:{" "}
                          {connectionStatus.diagnostics.online ? "Yes" : "No"}
                        </li>
                        <li>
                          Secure Context:{" "}
                          {connectionStatus.diagnostics.secureContext
                            ? "Yes"
                            : "No"}
                        </li>
                        <li>
                          Protocol: {connectionStatus.diagnostics.protocol}
                        </li>
                        {connectionStatus.diagnostics.ports && (
                          <>
                            <li>
                              HTTP Endpoint:{" "}
                              {connectionStatus.diagnostics.ports.httpEndpoint}
                            </li>
                            <li>
                              WebSocket Endpoint:{" "}
                              {connectionStatus.diagnostics.ports.wsEndpoint}
                            </li>
                          </>
                        )}
                      </ul>

                      {connectionStatus.diagnostics.connectionTest && (
                        <div className="mt-2 text-xs">
                          <p className="font-semibold">
                            Connection Test Results:
                          </p>
                          <table className="w-full text-xs mt-1 border-collapse">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border px-1 py-1">Protocol</th>
                                <th className="border px-1 py-1">Status</th>
                                <th className="border px-1 py-1">Time (ms)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border px-1 py-1">HTTP</td>
                                <td className="border px-1 py-1">
                                  {connectionStatus.diagnostics.connectionTest
                                    .httpTestResults?.success ? (
                                    <span className="text-green-600">✓</span>
                                  ) : (
                                    <span className="text-red-600">✗</span>
                                  )}
                                </td>
                                <td className="border px-1 py-1">
                                  {connectionStatus.diagnostics.connectionTest
                                    .httpTestResults?.duration || "-"}
                                </td>
                              </tr>
                              <tr>
                                <td className="border px-1 py-1">HTTPS</td>
                                <td className="border px-1 py-1">
                                  {connectionStatus.diagnostics.connectionTest
                                    .httpsTestResults?.success ? (
                                    <span className="text-green-600">✓</span>
                                  ) : (
                                    <span className="text-red-600">✗</span>
                                  )}
                                </td>
                                <td className="border px-1 py-1">
                                  {connectionStatus.diagnostics.connectionTest
                                    .httpsTestResults?.duration || "-"}
                                </td>
                              </tr>
                              <tr>
                                <td className="border px-1 py-1">WS</td>
                                <td className="border px-1 py-1">
                                  {connectionStatus.diagnostics.connectionTest
                                    .wsTestResults?.success ? (
                                    <span className="text-green-600">✓</span>
                                  ) : (
                                    <span className="text-red-600">✗</span>
                                  )}
                                </td>
                                <td className="border px-1 py-1">
                                  {connectionStatus.diagnostics.connectionTest
                                    .wsTestResults?.duration || "-"}
                                </td>
                              </tr>
                              <tr>
                                <td className="border px-1 py-1">WSS</td>
                                <td className="border px-1 py-1">
                                  {connectionStatus.diagnostics.connectionTest
                                    .wssTestResults?.success ? (
                                    <span className="text-green-600">✓</span>
                                  ) : (
                                    <span className="text-red-600">✗</span>
                                  )}
                                </td>
                                <td className="border px-1 py-1">
                                  {connectionStatus.diagnostics.connectionTest
                                    .wssTestResults?.duration || "-"}
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          {connectionStatus.diagnostics.connectionTest.errors
                            .length > 0 && (
                            <div className="mt-2">
                              <p className="font-semibold">Errors:</p>
                              <ul className="list-disc pl-5">
                                {connectionStatus.diagnostics.connectionTest.errors.map(
                                  (error, index) => (
                                    <li key={index} className="text-red-600">
                                      {error.type}: {error.message}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {connectionStatus.diagnostics.httpResults && (
                        <div className="mt-2 text-xs">
                          <p className="font-semibold">Basic HTTP Tests:</p>
                          <table className="w-full text-xs mt-1 border-collapse">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="border px-1 py-1">Endpoint</th>
                                <th className="border px-1 py-1">Status</th>
                                <th className="border px-1 py-1">Error</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border px-1 py-1">HTTP</td>
                                <td className="border px-1 py-1">
                                  {connectionStatus.diagnostics.httpResults.http
                                    ?.success ? (
                                    <span className="text-green-600">✓</span>
                                  ) : (
                                    <span className="text-red-600">✗</span>
                                  )}
                                </td>
                                <td className="border px-1 py-1 text-red-500">
                                  {connectionStatus.diagnostics.httpResults.http
                                    ?.error || "-"}
                                </td>
                              </tr>
                              <tr>
                                <td className="border px-1 py-1">HTTPS</td>
                                <td className="border px-1 py-1">
                                  {connectionStatus.diagnostics.httpResults
                                    .https?.success ? (
                                    <span className="text-green-600">✓</span>
                                  ) : (
                                    <span className="text-red-600">✗</span>
                                  )}
                                </td>
                                <td className="border px-1 py-1 text-red-500">
                                  {connectionStatus.diagnostics.httpResults
                                    .https?.error || "-"}
                                </td>
                              </tr>
                              <tr>
                                <td className="border px-1 py-1">CORS</td>
                                <td className="border px-1 py-1">
                                  {connectionStatus.diagnostics.httpResults.cors
                                    ?.success ? (
                                    <span className="text-green-600">✓</span>
                                  ) : (
                                    <span className="text-red-600">✗</span>
                                  )}
                                </td>
                                <td className="border px-1 py-1 text-red-500">
                                  {connectionStatus.diagnostics.httpResults.cors
                                    ?.error || "-"}
                                </td>
                              </tr>
                            </tbody>
                          </table>

                          {connectionStatus.diagnostics.httpResults.http
                            ?.success && (
                            <div className="mt-1 text-xs">
                              <p>
                                HTTP response:{" "}
                                {JSON.stringify(
                                  connectionStatus.diagnostics.httpResults.http
                                    .data
                                ).substring(0, 100) + "..."}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
