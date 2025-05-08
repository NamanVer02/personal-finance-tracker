// A utility to test connection to the backend
const ConnectionTest = {
  /**
   * Run a comprehensive test of backend connectivity
   * @returns {Promise<Object>} Test results
   */
  runTest: async () => {
    console.log("Starting backend connection test");
    const results = {
      httpTestResults: null,
      httpsTestResults: null,
      wsTestResults: null,
      wssTestResults: null,
      errors: [],
      timestamp: new Date().toISOString(),
    };

    // Test HTTP/HTTPS endpoints
    try {
      results.httpTestResults = await ConnectionTest.testHttpEndpoint(
        "http://localhost:8080/api/diagnostics/ping"
      );
      console.log("HTTP test results:", results.httpTestResults);
    } catch (error) {
      console.error("HTTP test failed:", error);
      results.errors.push({ type: "http", message: error.message });
    }

    try {
      results.httpsTestResults = await ConnectionTest.testHttpEndpoint(
        "https://localhost:8080/api/diagnostics/ping"
      );
      console.log("HTTPS test results:", results.httpsTestResults);
    } catch (error) {
      console.error("HTTPS test failed:", error);
      results.errors.push({ type: "https", message: error.message });
    }

    // Test WebSocket endpoints
    try {
      results.wsTestResults = await ConnectionTest.testWebSocketEndpoint(
        "ws://localhost:8080/ws"
      );
      console.log("WS test results:", results.wsTestResults);
    } catch (error) {
      console.error("WS test failed:", error);
      results.errors.push({ type: "ws", message: error.message });
    }

    try {
      results.wssTestResults = await ConnectionTest.testWebSocketEndpoint(
        "wss://localhost:8080/ws"
      );
      console.log("WSS test results:", results.wssTestResults);
    } catch (error) {
      console.error("WSS test failed:", error);
      results.errors.push({ type: "wss", message: error.message });
    }

    return results;
  },

  /**
   * Test HTTP/HTTPS endpoint
   * @param {string} url URL to test
   * @returns {Promise<Object>} Test results
   */
  testHttpEndpoint: async (url) => {
    console.log(`Testing HTTP endpoint: ${url}`);
    const startTime = new Date().getTime();

    try {
      // Use no-cors mode to handle CORS issues in testing
      const response = await fetch(url, {
        method: "GET",
        mode: "no-cors",
        cache: "no-store",
      });

      const endTime = new Date().getTime();
      const duration = endTime - startTime;

      return {
        success: true,
        url,
        duration,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error testing ${url}:`, error);
      throw error;
    }
  },

  /**
   * Test WebSocket endpoint
   * @param {string} url URL to test
   * @returns {Promise<Object>} Test results
   */
  testWebSocketEndpoint: (url) => {
    console.log(`Testing WebSocket endpoint: ${url}`);
    const startTime = new Date().getTime();

    return new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(url);

        socket.onopen = () => {
          const endTime = new Date().getTime();
          const duration = endTime - startTime;

          console.log(`WebSocket connected to ${url} in ${duration}ms`);
          socket.close();

          resolve({
            success: true,
            url,
            duration,
            timestamp: new Date().toISOString(),
          });
        };

        socket.onerror = (error) => {
          console.error(`WebSocket error for ${url}:`, error);
          reject(new Error(`WebSocket connection failed to ${url}`));
        };

        // Set a timeout for connecting
        setTimeout(() => {
          if (socket.readyState !== WebSocket.OPEN) {
            socket.close();
            reject(new Error(`Connection timeout for ${url}`));
          }
        }, 5000);
      } catch (error) {
        console.error(`Error creating WebSocket to ${url}:`, error);
        reject(error);
      }
    });
  },
};

export default ConnectionTest;
