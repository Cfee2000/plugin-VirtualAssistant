import React, { useState, useEffect } from "react";
import {
	ChatLog,
	ChatMessage,
	ChatMessageMeta,
	ChatMessageMetaItem,
	ChatBubble,
} from "@twilio-paste/core/chat-log";
import { Avatar } from "@twilio-paste/core";

const TranscriptionsComponent = () => {
	const [transcriptions, setTranscriptions] = useState([]);


	useEffect(() => {
		console.log("Connecting to WebSocket");
		const websocket = new WebSocket("wss://cfeehan.ngrok.io");

        websocket.onmessage = (event) => {
            console.log("WebSocket message received:", event.data);
            // other code to handle the received message
          };

		websocket.addEventListener("open", (event) => {
			console.log("WebSocket connected");
		});

        websocket.addEventListener("message", (event) => {
            console.log("WebSocket message received");
            const data = JSON.parse(event.data);
            console.log("WebSocket data:", data);
            if (data.event === "message" && data.transcription) {
              setTranscriptions((prevTranscriptions) => [
                ...prevTranscriptions,
                data.transcription,
              ]);
            }
          });

        websocket.addEventListener("media", (event) => {
            console.log("Media message");
        });

		websocket.addEventListener("close", (event) => {
			console.log("WebSocket closed");
		});

		websocket.addEventListener("error", (event) => {
			console.error("WebSocket error:", event);
		});

		return () => {
			console.log("Closing WebSocket");
			websocket.close();
		};
	}, []);

	console.log(
		"Rendering TranscriptionsComponent with transcriptions:",
		transcriptions
	);
	return (
		<ChatLog>
			{transcriptions.map((transcription, index) => (
				<ChatMessage
					key={index}
					variant={transcription.track === "inbound" ? "inbound" : "outbound"}
				>
					<ChatBubble>{transcription.transcript}</ChatBubble>
					<ChatMessageMeta
						aria-label={`said by ${
							transcription.track === "inbound" ? "Customer" : "Agent"
						}`}
					>
						<ChatMessageMetaItem>
							{transcription.track === "inbound" && (
								<Avatar name="Customer" size="sizeIcon20" />
							)}
							{transcription.track === "inbound" ? "Customer" : "You"}
						</ChatMessageMetaItem>
					</ChatMessageMeta>
				</ChatMessage>
			))}
		</ChatLog>
	);
};

export default TranscriptionsComponent;
