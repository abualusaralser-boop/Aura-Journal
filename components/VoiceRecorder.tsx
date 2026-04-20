'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
}

export default function VoiceRecorder({ onTranscription }: VoiceRecorderProps) {
  const { t } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick the best supported MIME type
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4']
        .find(m => MediaRecorder.isTypeSupported(m)) ?? '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      setDuration(0);

      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsProcessing(true);

        const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        audioChunksRef.current = [];
        stream.getTracks().forEach(t => t.stop());

        const formData = new FormData();
        formData.append('audio', audioBlob, `recording.${ext}`);

        const apiKey = localStorage.getItem('aura-api-key');
        const settings = localStorage.getItem('aura-settings');
        const dialect = settings ? JSON.parse(settings).dialect : 'sudanese';
        
        try {
          const response = await fetch('/api/transcribe', { 
            method: 'POST', 
            body: formData,
            headers: {
              ...(apiKey ? { 'x-api-key': apiKey } : {}),
              'x-dialect': dialect || 'sudanese'
            }
          });
          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error ?? 'Transcription failed');
          }
          const data = await response.json();
          onTranscription(data.text);
        } catch (error) {
          console.error('Transcription Error:', error);
          alert(t('transcribeError'));
        } finally {
          setIsProcessing(false);
          setDuration(0);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert(t('micError'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      {!isRecording ? (
        <button
          id="btn-start-recording"
          className="button-primary"
          onClick={startRecording}
          disabled={isProcessing}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          {isProcessing
            ? <><Loader2 className="animate-spin" size={20} /><span>{t('processing')}</span></>
            : <><Mic size={20} /><span>{t('startRecording')}</span></>}
        </button>
      ) : (
        <div style={{ display: 'flex', width: '100%', gap: '12px', alignItems: 'center' }}>
          <button
            id="btn-stop-recording"
            className="button-danger"
            onClick={stopRecording}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Square size={20} fill="currentColor" />
            <span>{t('stopRecording')}</span>
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            color: '#ef4444', fontWeight: 700, minWidth: 90,
          }}>
            <span className="recording-indicator" />
            {fmt(duration)}
          </div>
        </div>
      )}
    </div>
  );
}
