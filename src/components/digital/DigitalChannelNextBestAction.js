import {
	Card,
	Heading,
	Stack,
	Paragraph,
	Button,
	SkeletonLoader,
	TextArea,
	AlertDialog,
} from "@twilio-paste/core";
import { LoadingIcon } from "@twilio-paste/icons/esm/LoadingIcon";

import { useEffect, useState } from "react";
import { Actions } from "@twilio/flex-ui";

import * as Flex from "@twilio/flex-ui";

const DigitalChannelNextBestAction = (props) => {
	const [nextBestAction, setNextBestAction] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [transcript, setTranscript] = useState(null);
	const [editNextBestAction, setEditNextBestAction] = useState(false);
	const [summary, setSummary] = useState(null);
	const [isLoadingSummary, setIsLoadingSummary] = useState(false);
	const [isLoadingSegment, setIsLoadingSegment] = useState(false);
	const [isSegmentAlertOpen, setIsSegmentAlertOpen] = useState(false);

	const handleSegmentAlertOpen = () => setIsSegmentAlertOpen(true);
	const handleSegmentAlertClose = () => setIsSegmentAlertOpen(false);

	function translatePromptToChatGPT(
		transcript,
		customerName,
		originalAssistant,
		liveAssistant
	) {
		if (!transcript || !customerName || !originalAssistant || !liveAssistant) {
			throw new Error("Missing required parameter");
		}
		console.log("Events");
		console.log(props.events);

		console.log("CustomerData");
		console.log(props.customerData);

		const events = JSON.parse(props.events);
		console.log(events);
		const eventDescriptions = events.events.map(event => {
			switch (event.event) {
			  case 'Product Viewed':
				return `${customerName} recently viewed a product: ${event.properties.product_name} priced at ${event.properties.product_currency}${event.properties.product_price}.`;
			  case 'Product Added':
				return `${customerName} added a product to their cart: ${event.properties.product_name} (size: ${event.properties.product_size}) priced at ${event.properties.product_currency}${event.properties.product_price}.`;
			  case 'Checkout Started':
				return `${customerName} started the checkout process with a subtotal of ${event.properties.order_currency}${event.properties.order_subtotal}.`;
			  case 'Order Placed':
				return `${customerName} placed an order (Order ID: ${event.properties.order_id}) with a total of ${event.properties.order_currency}${event.properties.order_total}.`;
			  case 'Chat Started':
				return `${customerName} started a chat with the conversation ID: ${event.properties.conversationSid}.`;
			  default:
				return '';
			}
		  }).join(' ');

	    let eventDescriptionText = "";
		if(eventDescriptions.length > 0){
			eventDescriptionText = `Recently, ${customerName} has recently been interacting with our website in the following ways:
		
			${eventDescriptions}`;
		}
		  
		const systemMessage1 = `${customerName} sends an inbound message to a Dialogflow CX Virtual Agent to start a conversation, either from the company's webchat on their main website, or via their SMS contact number`;
		
		let systemMessage2 = `You are ${liveAssistant}, an Owl Shoes concierge, and you are about to address ${customerName} live for the first time after her interaction with a Dialogflow CX Virtual Agent. Your response should be a single reply, accounting for the context and content of her previous interaction with the Virtual Agent. Address ${customerName} in whatever langauge she is using, and provide the next best action as appropriate for taking over as a live agent.

		As an Owl Shoes concierge, you provide intelligent, empathetic, and solution-oriented support. Your expertise includes product recommendations, returns and exchanges, handling complaints and tickets, pricing and promotions, as well as delivery updates and modifications. Remember, Owl Shoes only sells shoes (with the exception of a few exclusive VIP items), and you cannot sell any other products. IMPORTANT: You CANNOT place orders on behalf of the customer or add items to their cart. If the customer asks you to place an order, you must inform them that they need to complete the purchase themselves.

		Keep in mind that ${customerName} is a VIP customer who has been loyal to Owl Shoes for ${props.customerData.yearsLoyalty} years, has a lifetime purchase value of $${props.customerData.business_value} and has referred ${props.customerData.referralCount} people to our store. She is ${props.customerData.age} years old, and is a ${props.customerData.engagementFrequency} engaged customer. 
		
		When the context of the conversation is 'sales' and ${customerName} intends to buy shoes, seize the opportunity to upsell the Winter Sports Beanie for $30. You can send an instant digital message with the item, and when she clicks the item, it will automatically add to her cart. This is the only item you can send a link for.
		
		If the conversation context is an 'order return' and she intends to return an order, you can print and send shipping labels for expedited returns. You may offer promotional codes on future items as well.
		
		Ensure your response aligns with the given context, demonstrates empathy, and addresses ${customerName}'s needs with appropriate solutions. Be proactive, but not overly aggressive, in suggesting the Winter Sports Beanie when the opportunity arises, and do NOT mention sending links to any products other than the Winter Sports Beanie.`;



		let systemMessage3 = `You are ${liveAssistant}, an Owl Shoes concierge, and your role is to provide the next best action for ${customerName} in a single reply, accounting for the context and content of the conversation history, recent website interactions ${customerName} has had with Owl Shoes, and her VIP customer history. 
		
		As an Owl Shoes concierge, you provide intelligent, empathetic, and solution-oriented support. Your expertise includes product recommendations, returns and exchanges, handling complaints and tickets, pricing and promotions, as well as delivery updates and modifications. Remember, Owl Shoes only sells shoes (with the exception of a few exclusive VIP items), and you cannot sell any other products. IMPORTANT: You CANNOT place orders on behalf of the customer or add items to their cart. If the customer asks you to place an order, you must inform them that they need to complete the purchase themselves.
		
		Keep in mind that ${customerName} is a VIP customer who has been loyal to Owl Shoes for ${props.customerData.yearsLoyalty} years, has a lifetime purchase value of $${props.customerData.business_value} and has referred ${props.customerData.referralCount} people to our store. She is ${props.customerData.age} years old, and is a ${props.customerData.engagementFrequency} engaged customer.`;
		
		if (eventDescriptionText) {
			systemMessage2 += `\n${eventDescriptionText}`;
			systemMessage3 += `\n${eventDescriptionText}`;
		  }

		console.log(systemMessage2);
		console.log(systemMessage3);
		const lines = transcript.split("\n").filter((line) => line.trim() !== "");
		const translatedLines = [];
		let currentAssistant = originalAssistant;
		let hasLiveAssistantStarted = false;

		// Add system message 1 at the beginning
		translatedLines.push({ role: "system", content: systemMessage1 });

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			let messageParts = line.split(": ");
			if (
				messageParts.length < 2 ||
				!line.includes(": ") ||
				(!line.startsWith(customerName) &&
					!line.startsWith(liveAssistant) &&
					!line.startsWith(originalAssistant))
			) {
				//If we ever have a situation where the format is off, whether that's no prefix, or just that the prefix doesn't match any of our identities, then we're going to assume its the live agent, because the OpenAI API may return a bad prefix, whereas we should always be ensuring the Customer and Virtual Agent prefixes are there, and we control this ourselves
				if (!line.includes(": ")) {
					//If we don't find the delimiter, then just print the line and add our liveAssistant as the prefix
					translatedLines.push({
						role: "assistant",
						content: `${liveAssistant}: ${line}`,
					});
				} else {
					//If we do find the delimiter, this assumes there was no previous match in the if/else block on customerName, originalAssistant, or liveAssistant, so, we'll just assume liveAssisant here
					const messageParts = line.split(": ");
					translatedLines.push({
						role: "assistant",
						content: `${liveAssistant}: ${messageParts[1]}`,
					});
				}
				continue;
			}
			if (line.startsWith(customerName)) {
				// User message
				translatedLines.push({ role: "user", content: line });
			} else if (line.startsWith(originalAssistant)) {
				// Original assistant message
				const messageParts = line.split(": ");
				translatedLines.push({
					role: "assistant",
					content: `${originalAssistant}: ${messageParts[1]}`,
				});
			} else if (line.startsWith(liveAssistant)) {
				if(!hasLiveAssistantStarted){
					//On the first message that comes from the liveAssistant, insert systemMessage2 first, so that this is always part of our transcript
					translatedLines.push({ role: "system", content: systemMessage2 });					
				}
				hasLiveAssistantStarted = true;
				// Live assistant message
				const messageParts = line.split(": ");
				translatedLines.push({
					role: "assistant",
					content: `${liveAssistant}: ${messageParts[1]}`,
				});
			}
		}

		if (!hasLiveAssistantStarted) {
			//We haven't started with the live assistant yet, so we can assume the transcript ends with the live agent handoff, and thus we need our dedicate message for the transition to live agent
			translatedLines.push({ role: "system", content: systemMessage2 });
		} else {
			translatedLines.push({ role: "system", content: systemMessage3 });
		}

		return translatedLines;
	}

	const fetchNextBestAction = async (transcript, customerName, workerName) => {
		console.log("RETRIEVE NEXT BEST ACTION");
		console.log(transcript);
		let retries = 0;
		try {
			const convertedTranscript = translatePromptToChatGPT(
				transcript,
				customerName,
				"Dialogflow CX Virtual Agent",
				workerName
			);
			console.log("CONVERTED TRANSCRIPT");
			console.log(convertedTranscript);
			let response = await fetch(
				process.env.REACT_APP_OPENAI_CHATGPT_API_ENDPOINT,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
					},
					body: JSON.stringify({
						messages: convertedTranscript,
						temperature: 0.6,
						model: "gpt-3.5-turbo",
					}),
				}
			);

			if (!response.ok) {
				if (response.status === 429) {
					console.log("OPEN AI returned a 429. Will initiate retry logic");
				} else if (response.status === 500) {
					console.log("OPEN AI returned a 500. Will initiate retry logic");
				} else if (response.status === 502) {
					console.log("OPEN AI returned a 502. Will initiate retry logic");
				} else {
					throw new Error(
						`Error fetching digital channel next best actions: ${response.status}`
					);
				}
			}

			let data = await response.json();
			console.log("DATA");
			console.log(data);
			//console.log(response.body);

			while (
				(!Array.isArray(data.choices) ||
					data.choices.length === 0 ||
					!data.choices[0].message) &&
				retries < process.env.REACT_APP_MAX_RETRIES
			) {
				console.log(
					"OPENAI API CALL IS NOT RETURNING DATA FOR THE DIGITAL CHANNEL NEXT BEST ACTION RIGHT NOW. INITIATING RETRY LOGIC"
				);
				await new Promise((resolve) => {
					setTimeout(resolve, process.env.REACT_APP_RETRY_DELAY_MS);
				});
				response = await fetch(
					process.env.REACT_APP_OPENAI_CHATGPT_API_ENDPOINT,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
						},
						body: JSON.stringify({
							messages: convertedTranscript,
							temperature: 0.6,
							model: "gpt-3.5-turbo",
						}),
					}
				);
				data = await response.json();
				retries++;
				console.log("RETRIES: " + retries);
			}

			if (data.choices[0].message) {
				console.log("Here's the NBA Message Content");
				console.log(data.choices[0].message.content);
				//We only want to return to the Flex UI the part of the message, if applicable, after the ":" delimiter
				const messageParts = data.choices[0].message.content.split(": ");
				if (messageParts.length < 2) {
					return data.choices[0].message.content;
				}
				return messageParts[1];
			} else {
				throw new Error(
					"Failed to get digital channel next best action from OpenAI after retries"
				);
			}
		} catch (error) {
			console.error("Error fetching digital channel next best actions:", error);
			throw new Error("Error fetching digital channel next best actions.");
		}
	};

	const retrieveSummary = async (updatedTranscript) => {
		console.log("RETRIEVE SUMMARY");
		console.log(updatedTranscript);
		let retries = 0;
		try {
			setIsLoadingSummary(true);
			let response = await fetchSummary(updatedTranscript);
			let data = await response.json();

			while (
				!data.choices[0].text &&
				retries < process.env.REACT_APP_MAX_RETRIES
			) {
				console.log(
					"OPENAI API CALL IS NOT RETURNING DATA FOR THE DIGITAL CHANNEL SUMMARY RIGHT NOW. INITIATING RETRY LOGIC"
				);
				await new Promise((resolve) =>
					setTimeout(resolve, process.env.REACT_APP_RETRY_DELAY_MS)
				);
				response = await fetchSummary(updatedTranscript);
				data = await response.json();
				retries++;
				console.log("RETRIES: " + retries);
			}

			if (data.choices[0].text) {
				setSummary(data.choices[0].text);
			} else {
				throw new Error(
					"Failed to get digital channel summary from OpenAI after retries"
				);
			}
		} catch (error) {
			/* show error message */
			console.error(error);
		} finally {
			setIsLoadingSummary(false);
		}
	};

	const fetchSummary = async (updatedTranscript) => {
		const prompt = `In 10 sentences or less, provide a summarization of the following transcript: ${updatedTranscript}`;

		const response = await fetch(
			process.env.REACT_APP_OPENAI_GPT3_API_ENDPOINT,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
				},
				body: JSON.stringify({
					prompt: prompt,
					max_tokens: 1000,
					temperature: 0.8,
					model: "text-davinci-003",
				}),
			}
		);

		if (!response.ok) {
			throw new Error(`Failed to fetch voice call summary: ${response.status}`);
		}

		return response;
	};

	const updateSegment = async (payload) => {
		try {
			const token = `${process.env.REACT_APP_SEGMENT_WRITE_TOKEN}:`;
			const authorization = `Basic ${Buffer.from(token).toString("base64")}`;

			const response = await fetch(
				process.env.REACT_APP_SEGMENT_WRITE_ENDPOINT,
				{
					method: "POST",
					headers: {
						Authorization: authorization,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				}
			);

			if (!response.ok) {
				throw new Error("Segment update failed");
			}

			return response.json();
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	useEffect(() => {
		console.log("INITIAL USE EFFECT");
		const initialFetch = async () => {
			try {
				retrieveSummary(props.nextBestActionTranscript);
				setIsLoading(true);
				const initialNextBestActionText = await fetchNextBestAction(
					props.nextBestActionTranscript,
					props.customerName,
					props.workerName
				);
				setTranscript(props.nextBestActionTranscript);
				setNextBestAction(initialNextBestActionText);
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};

		initialFetch();
	}, []);

	useEffect(() => {
		console.log("IN TRANSCRIPT DEPENDENT useEFFECT");
		const conversationsClient = Flex.Manager.getInstance().conversationsClient;

		const handleNewMessage = async (message) => {
			try {
				let prevTranscript = transcript;
				const { author, body } = message;
				//We will use a uuidRegex to check for a WebChat identity as the author of the message in the logic below
				const uuidRegex =
					/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
				if (author.startsWith("+") || uuidRegex.test(author)) {
					setIsLoading(true);
					console.log("MESSAGE IS FROM THE CUSTOMER");
					prevTranscript += `${props.customerName}: ${body}\n`;

					const nextBestActionText = await fetchNextBestAction(
						prevTranscript,
						props.customerName,
						props.workerName
					);
					setNextBestAction(nextBestActionText);
				} else {
					prevTranscript += `${props.workerName}: ${body}\n`;
				}
				retrieveSummary(prevTranscript);
				setTranscript(prevTranscript);
			} catch (error) {
				console.error("Error updating transcript or fetching data:", error);
			} finally {
				setIsLoading(false);
			}
			return Promise.resolve();
		};

		conversationsClient.addListener("messageAdded", handleNewMessage);

		return () => {
			conversationsClient.removeListener("messageAdded", handleNewMessage);
		};
	}, [transcript]); // add transcript as a dependency

	useEffect(() => {
		if(summary)
		{
			console.log("IN CONVERSATION SET SUMMARY ATTRIBUTE useEFFECT");
			const setSummaryinConversationAttributes = async () => {
				try {
					const conversationsClient =
						Flex.Manager.getInstance().conversationsClient;

					console.log("CONVO SID : " + props.conversationSid);
					const conversation = await conversationsClient.getConversationBySid(
						props.conversationSid
					);
		
					const conversationAttributes = await conversation.getAttributes();
					console.log(conversationAttributes);
					console.log(conversationAttributes.summary);
					console.log("CONVERSATION STATE");
					console.log(conversation.state.current);
					if(conversation.state.current !== "closed")
					{
						console.log(summary);
						if (conversationAttributes.summary !== summary) {
							const newAttributes = { ...conversationAttributes, summary };
							console.log("NEW ATTRIBUTES");
							console.log(newAttributes);
							const result = await conversation.updateAttributes(newAttributes);
							console.log(result);
						}
					} else{
						console.warn("Conversation is in a 'closed' state. Cannot sync attributes. SOLUTION: End Chat in Flex and start a new chat.");
					}

				} catch (err) {
					console.error("Error fetching messages:", err);
					throw err;
				}
			};
			setSummaryinConversationAttributes();
		}

	}, [summary]);

	const sendMessage = (text) => {
		try {
			Actions.invokeAction("SendMessage", {
				conversationSid: props.conversationSid,
				body: text,
			});

			// // Update transcript state with new message
			// setTranscript((prevTranscript) => {
			// 	console.log("Previous transcript state:", prevTranscript);
			// 	const formattedMessage = `${props.workerName}: ${text}\n`;
			// 	return prevTranscript + formattedMessage;
			// });
		} catch (err) {
			console.error(err);
		}
	};

	const fetchNewNextBestAction = async (transcript) => {
		try {
			setIsLoading(true);
			const data = await fetchNextBestAction(
				transcript,
				props.customerName,
				props.workerName
			);
			setNextBestAction(data);
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchNewSummary = async (transcript) => {
		try {
			await retrieveSummary(transcript);
		} catch (error) {
			console.error(error);
		}
	};
	const pushSummaryToSegment = async (summary) => {
		const payloadSegment = {
			anonymousId: "flexSummary_" + props.customerEmail,
			event: "Transcript Summarization from Flex",
			properties: {
				email: props.customerEmail,
				summary: summary.replace(/^\n+/, ''),
			},
			type: "track",
		};

		try {
			setIsLoadingSegment(true);
			const response = await updateSegment(payloadSegment);
			console.log(response);
			console.log("Segment update successful");
		} catch (error) {
			console.error(error);
			console.log("Segment update failed");
		} finally {
			setIsLoadingSegment(false);
			handleSegmentAlertClose();
		}
	};

	const toggleNextBestActionEditable = () => {
		setEditNextBestAction((prevState) => !prevState);
	};

	return (
		<>
			<Stack orientation="vertical" spacing="space120">
				{isLoading ? (
					<>
						<Heading as="h3" variant="heading30">
							Loading....Please Wait
						</Heading>
						<SkeletonLoader height="150px" />
					</>
				) : (
					<>
						<Stack orientation="horizontal" spacing="space50">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width={40}
								height={40}
								viewBox="0 0 24 24"
							>
								<title>{"OpenAI icon"}</title>
								<path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z" />
							</svg>
							<Heading as="h3" variant="heading30" marginBottom="space0">
								Next Best Action
							</Heading>
							<Button
								variant="primary"
								size="small"
								onClick={() => fetchNewNextBestAction(transcript)}
							>
								<LoadingIcon decorative={true} color="white"></LoadingIcon>{" "}
								Refresh
							</Button>
						</Stack>
						<Card>
							{editNextBestAction ? (
								<>
									<TextArea
										key="editedResponse"
										id="editedResponse"
										value={nextBestAction}
										onChange={(e) => setNextBestAction(e.target.value)}
									></TextArea>
									<div style={{ marginTop: "20px" }}></div>
								</>
							) : (
								<Paragraph>{nextBestAction}</Paragraph>
							)}

							<Stack orientation="horizontal" spacing="space80">
								{editNextBestAction ? (
									<Button
										variant="primary"
										onClick={() => sendMessage(nextBestAction.trim())}
									>
										Send Edited Response
									</Button>
								) : (
									<Button
										variant="primary"
										onClick={() => sendMessage(nextBestAction)}
									>
										Send Response
									</Button>
								)}
								<Button
									variant="secondary"
									onClick={toggleNextBestActionEditable}
								>
									Toggle Edit Response
								</Button>
							</Stack>
						</Card>
					</>
				)}
				{isLoadingSummary ? (
					<>
						<Heading as="h3" variant="heading30">
							Loading....Please Wait
						</Heading>
						<SkeletonLoader height="150px" />
					</>
				) : (
					<>
						<Stack orientation="horizontal" spacing="space50">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width={40}
								height={40}
								viewBox="0 0 24 24"
							>
								<title>{"OpenAI icon"}</title>
								<path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z" />
							</svg>
							<Heading as="h3" variant="heading30" marginBottom="space0">
								Full Conversation Summary
							</Heading>
							<Button
								variant="primary"
								size="small"
								onClick={() => fetchNewSummary(transcript)}
							>
								<LoadingIcon decorative={true} color="white"></LoadingIcon>{" "}
								Refresh
							</Button>
						</Stack>
						<Card>
							<Paragraph>{summary}</Paragraph>
							<Button variant="primary" onClick={handleSegmentAlertOpen}>
								Update Segment
							</Button>
							{isLoadingSegment ? (
								<>
									<Heading as="h3" variant="heading30">
										Loading....Please Wait
									</Heading>
									<SkeletonLoader height="150px" />
								</>
							) : (
								<>
									<AlertDialog
										heading="Update Segment with Summary"
										isOpen={isSegmentAlertOpen}
										onConfirm={() => pushSummaryToSegment(summary)}
										onConfirmLabel="Update"
										onDismiss={handleSegmentAlertClose}
										onDismissLabel="Cancel"
									>
										You are about to update the Segment Profile of{" "}
										{props.customerName} with the following summary:
										<br />
										<br />
										{summary}
										<br />
										<br />
										Click "Update" to proceed, or "Cancel" to return to Flex.
									</AlertDialog>
								</>
							)}
						</Card>{" "}
					</>
				)}
			</Stack>
		</>
	);
};

export default React.memo(DigitalChannelNextBestAction);
