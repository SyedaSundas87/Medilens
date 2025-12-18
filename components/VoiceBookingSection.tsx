
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Phone, PhoneOff, Loader2, Sparkles, Volume2 } from 'lucide-react';
import { RetellWebClient } from 'retell-client-js-sdk';

// NOTE: In a production app, this key should be stored securely on a backend server.
// The frontend should call your backend, which then calls Retell APIs.
const RETELL_API_KEY = "key_b14cf8688db6c69bc86f0badc466";

const VoiceBookingSection: React.FC = () => {
  const [isCalling, setIsCalling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [agentTalking, setAgentTalking] = useState(false);
  
  const retellClient = useRef<RetellWebClient | null>(null);

  useEffect(() => {
    // Initialize Retell Client
    const client = new RetellWebClient();
    
    client.on('call_started', () => {
      console.log('Call started');
      setIsCalling(true);
      setIsLoading(false);
      setStatus('Connected - Listening...');
    });

    client.on('call_ended', () => {
      console.log('Call ended');
      setIsCalling(false);
      setIsLoading(false);
      setAgentTalking(false);
      setStatus('Call Ended');
      setTimeout(() => setStatus(''), 2000);
    });

    client.on('agent_start_talking', () => {
      setAgentTalking(true);
      setStatus('Agent Speaking...');
    });

    client.on('agent_stop_talking', () => {
      setAgentTalking(false);
      setStatus('Listening...');
    });

    client.on('error', (error) => {
      console.error('Retell Error:', error);
      setIsCalling(false);
      setIsLoading(false);
      setStatus('Error occurred');
      alert(`Call Error: ${error.message || 'Unknown error'}`);
    });

    retellClient.current = client;

    return () => {
      if (retellClient.current) {
        retellClient.current.stopCall();
      }
    };
  }, []);

  const handleToggleCall = async () => {
    if (isCalling) {
      retellClient.current?.stopCall();
      setIsCalling(false);
      return;
    }

    setIsLoading(true);
    setStatus('Connecting...');

    try {
      // --- SIMULATED BACKEND FLOW ---
      // Step 1: Frontend calls "backend" (simulated here) to start call
      
      // A. Get Agent ID (Since we don't have one hardcoded, we fetch the first available agent)
      // In production, you would likely hardcode your specific Agent ID
      const agentListResponse = await fetch('https://api.retellai.com/list-agents', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${RETELL_API_KEY}`
        }
      });
      
      if (!agentListResponse.ok) throw new Error('Failed to fetch agents');
      const agents = await agentListResponse.json();
      
      if (!agents || agents.length === 0) {
        throw new Error('No Retell Agents found. Please create an agent in the Retell Dashboard.');
      }
      
      const agentId = agents[0].agent_id;
      console.log("Using Agent ID:", agentId);

      // B. Register the Call to get Access Token
      // This corresponds to "Step 2: Backend calls Retell's API"
      const registerResponse = await fetch('https://api.retellai.com/v2/create-web-call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RETELL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_id: agentId,
        })
      });

      if (!registerResponse.ok) {
        const err = await registerResponse.json();
        throw new Error(err.message || 'Failed to register call');
      }

      const data = await registerResponse.json();
      const accessToken = data.access_token;

      // Step 3: Start the call in Frontend using the token
      await retellClient.current?.startCall({
        accessToken: accessToken,
      });

    } catch (error: any) {
      console.error('Failed to start call:', error);
      setStatus('Connection Failed');
      setIsLoading(false);
      alert(`Could not start call: ${error.message}`);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white to-teal/5 border-t border-teal/10">
      <div className="container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal/10 text-teal rounded-full text-sm font-bold uppercase tracking-wider mb-6 animate-[fadeIn_0.5s_ease-out]">
          <Sparkles size={16} /> AI Voice Assistant
        </div>
        <h2 className="text-4xl md:text-5xl font-serif text-gray-800 mb-6">
          Book with your <span className="text-teal">Voice</span>
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-12 text-lg leading-relaxed">
          Skip the forms. Talk directly to our AI agent to schedule appointments, check doctor availability, or ask general questions.
        </p>

        <div className="relative inline-block group">
          {isCalling && (
             <div className="absolute inset-0 bg-teal rounded-full opacity-20 animate-ping duration-1000"></div>
          )}
          
          <button
            onClick={handleToggleCall}
            disabled={isLoading}
            className={`relative flex items-center justify-center w-28 h-28 rounded-full shadow-2xl transition-all duration-300 transform group-hover:scale-105 ${
                isCalling 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-400/40' 
                : 'bg-teal hover:bg-teal-dark shadow-teal/40'
            }`}
          >
            {isLoading ? (
               <Loader2 className="text-white animate-spin" size={48} />
            ) : isCalling ? (
               <PhoneOff className="text-white" size={48} />
            ) : (
               <Phone className="text-white" size={48} />
            )}
          </button>
        </div>
        
        <div className="mt-8 h-8 flex items-center justify-center">
            {status ? (
                <div className={`flex items-center gap-2 font-bold uppercase tracking-widest text-sm ${
                    status.includes('Error') || status.includes('Failed') ? 'text-red-500' :
                    status.includes('Ended') ? 'text-gray-400' :
                    'text-teal'
                }`}>
                    {isCalling && !agentTalking && <Mic size={16} className="animate-pulse" />}
                    {agentTalking && <Volume2 size={16} className="animate-bounce" />}
                    {status}
                </div>
            ) : (
                <p className="text-sm font-bold text-teal uppercase tracking-widest">Tap to Call Agent</p>
            )}
        </div>
      </div>
    </section>
  );
};

export default VoiceBookingSection;
