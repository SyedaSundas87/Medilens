
import React, { useState } from 'react';
import { Mic, Loader2, MessageCircle } from 'lucide-react';

const API_KEY = "key_c480fd6bc970da789f48a287c04b";

const VoiceBookingAgent: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    // Using native prompt as requested in the snippet
    const userSpeech = window.prompt("Speak your request (Type your request for the agent):");

    if (!userSpeech) return;

    setLoading(true);
    try {
      const res = await fetch("https://api.rattleai.com/v1/agent/message", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userSpeech
        })
      });

      const data = await res.json();
      
      // Using a slightly nicer alert or just standard alert as per snippet
      alert("Agent says: " + (data.reply || "No response text received."));
      
    } catch (error) {
      console.error("Voice Agent Error:", error);
      alert("Sorry, I couldn't connect to the booking agent at the moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      id="voiceAgentBtn"
      onClick={handleClick}
      className="fixed bottom-6 left-6 z-50 p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-105 group flex items-center gap-2"
      style={{ backgroundColor: '#4A90E2', color: 'white' }}
      title="Voice Booking Agent"
    >
      {loading ? (
        <Loader2 className="animate-spin" size={24} />
      ) : (
        <>
          <Mic size={24} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap text-sm font-bold">
            Booking Agent
          </span>
        </>
      )}
    </button>
  );
};

export default VoiceBookingAgent;
