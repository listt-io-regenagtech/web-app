// VideoStream.js (modified snippet for sending reset flag)
import React, { useEffect, useRef, useState } from 'react';

const VideoStream = ({ resetRequest }) => {
  const videoRef = useRef(null);
  const [feedAvailable, setFeedAvailable] = useState(false);

  useEffect(() => {
    const startWebRTC = async () => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state is', pc.iceConnectionState);
      };
      pc.ontrack = (event) => {
        console.log('ontrack event:', event);
        if (event.streams && event.streams[0]) {
          setFeedAvailable(true);
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
            videoRef.current.play().catch(err => console.error('Error playing video:', err));
          }
        }
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log('Local description set:', pc.localDescription);

        // Include the "reset" flag if resetRequest is true.
        const payload = { ...pc.localDescription.toJSON() };
        if (resetRequest) {
          payload.reset = true;
        }
        
        const response = await fetch('http://localhost:8080/offer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          console.error('Failed to get answer from server:', response.status, response.statusText);
          return;
        }
        const answer = await response.json();
        await pc.setRemoteDescription(answer);
        console.log('Remote description set:', answer);
      } catch (err) {
        console.error('Error during WebRTC negotiation:', err);
      }
    };

    startWebRTC().catch(err => console.error('WebRTC start error:', err));
  }, [resetRequest]);

  return (
    <div style={{ width: "560px", height: "315px", position: "relative", backgroundColor: "#000" }}>
      <video ref={videoRef} autoPlay playsInline muted controls={false} style={{ width: "560px", height: "315px", objectFit: "cover" }} />
      {!feedAvailable && (
        <div style={{
          position: "absolute", top: 0, left: 0, width: "560px", height: "315px",
          display: "flex", justifyContent: "center", alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.7)", color: "#fff", fontSize: "20px"
        }}>
          No video feed available
        </div>
      )}
    </div>
  );
};

export default VideoStream;

