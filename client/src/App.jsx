import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  MessageSquare,
  Send,
  UserX,
  RefreshCw,
  Users,
  Shield,
  Zap,
  Mic,
  Square,
  Lock,
  Clock,
  Play,
  Pause
} from 'lucide-react';
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedKey,
  generateSafetyFingerprint,
  encryptData,
  decryptData
} from './crypto';

const SOCKET_SERVER_URL = 'http://localhost:5000';
const MESSAGE_LIFETIME_SECONDS = 30;

// Subcomponent: Audio Player for Encrypted Voice Notes
function AudioMessage({ src }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-3 py-1">
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all cursor-pointer"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex flex-col">
        <span className="text-xs font-medium">Voice Note</span>
        <span className="text-[10px] opacity-70">Encrypted audio</span>
      </div>
    </div>
  );
}

// Subcomponent: Disappearing Message Timer Indicator
function DisappearingIndicator({ createdAt }) {
  const [timeLeft, setTimeLeft] = useState(MESSAGE_LIFETIME_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - createdAt) / 1000);
      const remaining = Math.max(0, MESSAGE_LIFETIME_SECONDS - elapsed);
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  const progress = (timeLeft / MESSAGE_LIFETIME_SECONDS) * 100;

  return (
    <div className="flex items-center gap-1.5 mt-1 text-[10px] opacity-75">
      <Clock className="w-3 h-3 text-amber-400" />
      <span>{timeLeft}s</span>
      <div className="w-12 h-1 bg-black/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'waiting' | 'chatting' | 'disconnected'
  const [onlineCount, setOnlineCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);

  // E2EE States
  const [localKeyPair, setLocalKeyPair] = useState(null);
  const [sharedKey, setSharedKey] = useState(null);
  const [safetyFingerprint, setSafetyFingerprint] = useState(null);

  // Voice Note Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Socket setup
  useEffect(() => {
    const s = io(SOCKET_SERVER_URL);
    setSocket(s);

    s.on('online_count', (count) => {
      setOnlineCount(count);
    });

    s.on('waiting', () => {
      setStatus('waiting');
      setMessages([]);
      setSharedKey(null);
      setSafetyFingerprint(null);
    });

    s.on('receive_public_key', async (data) => {
      try {
        if (!localKeyPair?.privateKey) return;
        const remotePubKey = await importPublicKey(data.publicKey);
        const derivedKey = await deriveSharedKey(localKeyPair.privateKey, remotePubKey);
        setSharedKey(derivedKey);

        const fingerprint = await generateSafetyFingerprint(derivedKey);
        setSafetyFingerprint(fingerprint);
      } catch (err) {
        console.error('Error establishing shared E2EE key:', err);
      }
    });

    s.on('receive_encrypted_payload', async (payload) => {
      try {
        if (!sharedKey) return;
        const decrypted = await decryptData(sharedKey, payload.ciphertext, payload.iv);

        const newMsg = {
          id: Date.now() + Math.random(),
          createdAt: Date.now(),
          type: decrypted.type || 'text',
          text: decrypted.text || null,
          audioUrl: decrypted.audioBase64 || null,
          sender: 'stranger'
        };

        setMessages((prev) => [...prev, newMsg]);
        setPartnerTyping(false);
      } catch (err) {
        console.error('Failed to decrypt message:', err);
      }
    });

    s.on('partner_typing', (isTyping) => {
      setPartnerTyping(isTyping);
    });

    s.on('partner_disconnected', () => {
      setStatus('disconnected');
      setPartnerTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          text: 'Stranger has disconnected.'
        }
      ]);
    });

    s.on('chat_left', () => {
      setStatus('disconnected');
      setPartnerTyping(false);
    });

    return () => {
      s.disconnect();
    };
  }, [localKeyPair, sharedKey]);

  // When matched, generate ECDH key pair and exchange public keys
  useEffect(() => {
    if (!socket) return;

    const handleMatched = async () => {
      setStatus('chatting');
      setMessages([
        {
          id: Date.now(),
          system: true,
          text: "You're now connected with a stranger. Establishing End-to-End Encryption..."
        }
      ]);

      try {
        const keyPair = await generateKeyPair();
        setLocalKeyPair(keyPair);
        const pubKeyBase64 = await exportPublicKey(keyPair.publicKey);
        socket.emit('send_public_key', { publicKey: pubKeyBase64 });
      } catch (err) {
        console.error('Key exchange error:', err);
      }
    };

    socket.on('matched', handleMatched);
    return () => socket.off('matched', handleMatched);
  }, [socket]);

  // Strict Disappearing Messages: Prune messages older than 30s
  useEffect(() => {
    const pruneInterval = setInterval(() => {
      const now = Date.now();
      setMessages((prev) =>
        prev.filter((m) => {
          if (m.system) return true; // keep system logs
          return now - m.createdAt < MESSAGE_LIFETIME_SECONDS * 1000;
        })
      );
    }, 1000);

    return () => clearInterval(pruneInterval);
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  // Keyboard shortcut (Escape to disconnect / start new)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (status === 'chatting') {
          handleDisconnect();
        } else if (status === 'disconnected' || status === 'idle') {
          handleFindPartner();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, socket]);

  const handleFindPartner = () => {
    if (!socket) return;
    setStatus('waiting');
    setMessages([]);
    setSharedKey(null);
    setSafetyFingerprint(null);
    setPartnerTyping(false);
    socket.emit('find_partner');
  };

  const handleDisconnect = () => {
    if (!socket) return;
    socket.emit('leave_chat');
    setStatus('disconnected');
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        system: true,
        text: 'You have disconnected.'
      }
    ]);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || status !== 'chatting' || !sharedKey || !socket) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const encrypted = await encryptData(sharedKey, {
        type: 'text',
        text: textToSend
      });

      socket.emit('send_encrypted_payload', encrypted);

      const newMsg = {
        id: Date.now(),
        createdAt: Date.now(),
        type: 'text',
        text: textToSend,
        sender: 'you'
      };

      setMessages((prev) => [...prev, newMsg]);
      socket.emit('typing', false);
    } catch (err) {
      console.error('Failed to encrypt text:', err);
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (socket && status === 'chatting') {
      socket.emit('typing', true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', false);
      }, 1500);
    }
  };

  // Voice Note Recording
  const startRecording = async () => {
    if (status !== 'chatting' || !sharedKey) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result;

          const encrypted = await encryptData(sharedKey, {
            type: 'audio',
            audioBase64: base64Audio
          });

          socket.emit('send_encrypted_payload', encrypted);

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              createdAt: Date.now(),
              type: 'audio',
              audioUrl: base64Audio,
              sender: 'you'
            }
          ]);
        };

        // stop tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Could not access microphone for voice message.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              AnonChat
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium flex items-center gap-1">
                <Lock className="w-3 h-3" /> E2EE
              </span>
            </h1>
            <p className="text-xs text-slate-400">Anonymous • Ephemeral 30s • AES-GCM Encrypted</p>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-3">
          {safetyFingerprint && status === 'chatting' && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
              <span className="text-sm">{safetyFingerprint.emojis}</span>
              <span className="font-mono font-semibold">#{safetyFingerprint.code}</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-xs font-medium text-slate-300">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span><strong className="text-white">{onlineCount}</strong> online</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      {status === 'idle' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400 shadow-xl shadow-indigo-500/10">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Encrypted & Ephemeral
          </h2>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed">
            Zero logs. Messages and voice notes are encrypted directly in your browser with <strong>AES-256-GCM</strong>. Every message automatically self-destructs after <strong>30 seconds</strong>.
          </p>

          <div className="grid grid-cols-2 gap-3 w-full mt-8 max-w-md text-left text-xs text-slate-400">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>End-to-End Encrypted (ECDH + AES)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>30-second self-destruct timer</span>
            </div>
          </div>

          <button
            onClick={handleFindPartner}
            className="mt-8 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer"
          >
            Start Chatting
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto overflow-hidden">
          {/* Safety Bar */}
          {safetyFingerprint && status === 'chatting' && (
            <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Lock className="w-3.5 h-3.5" /> End-to-End Encrypted
              </span>
              <span className="text-slate-400">
                Safety Code: <strong className="text-slate-200">{safetyFingerprint.emojis} #{safetyFingerprint.code}</strong>
              </span>
            </div>
          )}

          {/* Messages scroll box */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {status === 'waiting' && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-12">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">Looking for a stranger...</p>
                <p className="text-xs text-slate-500">Connecting anonymously...</p>
              </div>
            )}

            {messages.map((m) => {
              if (m.system) {
                return (
                  <div key={m.id} className="flex justify-center my-2">
                    <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 font-medium">
                      {m.text}
                    </span>
                  </div>
                );
              }

              const isMe = m.sender === 'you';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[11px] font-semibold text-slate-500 mb-1 px-1">
                    {isMe ? 'You' : 'Stranger'}
                  </span>

                  <div
                    className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10'
                        : 'bg-slate-800/90 text-slate-100 rounded-bl-none border border-slate-700/50'
                    }`}
                  >
                    {m.type === 'audio' ? (
                      <AudioMessage src={m.audioUrl} />
                    ) : (
                      <p className="break-words">{m.text}</p>
                    )}

                    <DisappearingIndicator createdAt={m.createdAt} />
                  </div>
                </div>
              );
            })}

            {partnerTyping && status === 'chatting' && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 italic px-2">
                <span>Stranger is typing</span>
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Action / Input Bar */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/60 backdrop-blur">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              {/* Stop / Next button */}
              {status === 'chatting' ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  title="Disconnect (Esc)"
                >
                  <UserX className="w-4 h-4" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFindPartner}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 shadow-lg shadow-indigo-600/20 cursor-pointer"
                  title="Find Next (Esc)"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Next</span>
                </button>
              )}

              {/* Voice Message Recorder Button */}
              {status === 'chatting' && (
                isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1.5 animate-pulse shrink-0 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>{recordingSeconds}s Send</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shrink-0 cursor-pointer"
                    title="Record encrypted voice note"
                  >
                    <Mic className="w-4 h-4 text-indigo-400" />
                  </button>
                )
              )}

              {/* Message Input */}
              <input
                type="text"
                disabled={status !== 'chatting' || !sharedKey}
                placeholder={
                  status === 'chatting'
                    ? sharedKey
                      ? 'Type an encrypted message... (Press Enter)'
                      : 'Securing connection...'
                    : status === 'waiting'
                    ? 'Connecting to a stranger...'
                    : 'Chat disconnected. Click Next to find a stranger.'
                }
                value={inputText}
                onChange={handleInputChange}
                className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={status !== 'chatting' || !sharedKey || !inputText.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors shrink-0 shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex justify-between items-center mt-2 px-1 text-[11px] text-slate-500">
              <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[10px]">Esc</kbd> to Stop / Next</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3 text-amber-400" /> Messages self-destruct in 30s
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
