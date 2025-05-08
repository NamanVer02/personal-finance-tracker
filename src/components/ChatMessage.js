import React, { useEffect, useState } from "react";
import { Clock, AlertCircle, Check } from "lucide-react";

const ChatMessage = ({ message, isOwnMessage }) => {
  const [isNew, setIsNew] = useState(true);

  // Set isNew to false after animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNew(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Render appropriate status icon for messages
  const renderStatusIcon = () => {
    if (message.pending) {
      if (message.sendStatus === "delayed") {
        return <AlertCircle className="h-3 w-3 text-orange-500 mr-1" />;
      }
      return <Clock className="h-3 w-3 text-gray-400 mr-1" />;
    }

    // Message was confirmed
    return <Check className="h-3 w-3 text-green-500 mr-1" />;
  };

  // Get status text for messages
  const getStatusText = () => {
    if (message.pending) {
      if (message.sendStatus === "delayed") {
        return "Checking...";
      }
      return "Sending...";
    }

    return ""; // No status text needed for confirmed messages
  };

  // Handle system messages (JOIN/LEAVE)
  if (message.type === "JOIN" || message.type === "LEAVE") {
    return (
      <div
        className={`flex justify-center my-2 ${isNew ? "animate-fade-in" : ""}`}
      >
        <div className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-600 shadow-neumorphic-button">
          {message.content}
        </div>
      </div>
    );
  }

  // Handle regular chat messages
  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} my-2 
                  ${isNew ? "animate-fade-in" : ""}`}
    >
      <div
        className={`max-w-xs px-4 py-3 rounded-lg ${
          isOwnMessage
            ? "bg-gray-100 text-gray-700 shadow-neumorphic-button"
            : "bg-gray-100 text-gray-700 shadow-neumorphic-inset-button"
        } ${message.pending ? "opacity-70" : ""}`}
      >
        {!isOwnMessage && (
          <div className="font-semibold text-xs mb-1 text-purple-600">
            {message.sender}
          </div>
        )}
        <div className="break-words">{message.content}</div>
        <div
          className={`text-xs mt-1 text-right flex items-center justify-end ${
            isOwnMessage ? "text-gray-500" : "text-gray-500"
          }`}
        >
          {isOwnMessage && (
            <span className="inline-flex items-center mr-2 text-xs">
              {renderStatusIcon()}
              {getStatusText()}
            </span>
          )}
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
