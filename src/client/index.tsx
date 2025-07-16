import "./styles.css";

import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import createGlobe from "cobe";
import usePartySocket from "partysocket/react";

// The type of messages we'll be receiving from the server
import type { OutgoingMessage } from "../shared";
import type { LegacyRef } from "react";

function App() {
  // A reference to the canvas element where we'll render the globe
  const canvasRef = useRef<HTMLCanvasElement>();

  // The number of markers (connected users) on the globe
  const [markerCount, setMarkerCount] = useState(0);

  // 🆕 Global thumbs-up count
  const [thumbsUpCount, setThumbsUpCount] = useState(0);
  const latestThumbsUp = useRef(0); // 🆕 holds incoming updates without flooding React

  // A map of marker IDs to their positions
  const positions = useRef<
    Map<
      string,
      {
        location: [number, number];
        size: number;
      }
    >
  >(new Map());

  // Connect to the PartyServer server
  const socket = usePartySocket({
    room: "default",
    party: "globe",
    onMessage(evt) {
      const message = JSON.parse(evt.data as string) as OutgoingMessage;

      if (message.type === "add-marker") {
        // Add the marker to our map
        positions.current.set(message.position.id, {
          location: [message.position.lat, message.position.lng],
          size: message.position.id === socket.id ? 0.1 : 0.05,
        });
        setMarkerCount((c) => c + 1);
      } else if (message.type === "remove-marker") {
        // Remove the marker from our map
        positions.current.delete(message.id);
        setMarkerCount((c) => c - 1);
      }

      // 🆕 Handle incoming thumbs-up update
      else if (message.type === "counter-update") {
        latestThumbsUp.current = message.value; // do NOT immediately call setState
      }
    },
  });

  // 🆕 Update UI every 50ms based on the latest counter value
  useEffect(() => {
    const interval = setInterval(() => {
      setThumbsUpCount(latestThumbsUp.current);
    }, 50); // update UI 20 times/sec

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let phi = 0;

    const globe = createGlobe(canvasRef.current as HTMLCanvasElement, {
      devicePixelRatio: 2,
      width: 400 * 2,
      height: 400 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 0.8,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.8, 0.1, 0.1],
      glowColor: [0.2, 0.2, 0.2],
      markers: [],
      opacity: 0.7,
      onRender: (state) => {
        state.markers = [...positions.current.values()];
        state.phi = phi;
        phi += 0.01;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <div className="App">
      <h1>Where's everyone at?</h1>

      {markerCount !== 0 ? (
        <p>
          <b>{markerCount}</b> {markerCount === 1 ? "person" : "people"} connected.
        </p>
      ) : (
        <p>&nbsp;</p>
      )}

      <canvas
        ref={canvasRef as LegacyRef<HTMLCanvasElement>}
        style={{ width: 400, height: 400, maxWidth: "100%", aspectRatio: 1 }}
      />

      {/* 🆕 Global thumbs-up button */}
      <p>
        <button
          onClick={() => {
            socket.send(
              JSON.stringify({
                type: "increment-counter",
              })
            );
          }}
        >
          👍 Thumbs up +1
        </button>
        <br />
        <b>{thumbsUpCount}</b> total thumbs up
        <br />
          <span style={{ fontSize: "0.8em", color: "gray" }}>
            That's {Math.round(thumbsUpCount / (Date.now() / 1000))} thumbs up's per second!
        </span>
      </p>

      <p>
        Alex He dedicates this to{" "}
        <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Don't Click 👀</a>
      </p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
