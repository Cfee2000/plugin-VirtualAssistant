import {
	Card,
	Heading,
	Stack,
	Paragraph,
	Button,
	SkeletonLoader,
	TextArea,
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

	const fetchNextBestAction = async (transcript, customerName, workerName) => {
		console.log("RETRIEVE NEXT BEST ACTION");
		console.log(transcript);
		console.log("CustomerName");
		console.log(customerName);
		let retries = 0;
		try {
			const promptToUse = `The following JSON data, delimited by the % symbol, represents customer data associated to ${customerName} that you must be aware of during your conversation:
			%{
				"traits":{
				   "firstName":"John",
				   "lastName":"Doe",
				   "fullName" : "John Doe",
				   "email":"john.doe@example.com",
				   "phone":"+1-555-555-5555",
				   "yearsLoyalty":"3",
				   "lifetimePurchaseValue":"$500",
				   "engagementFrequency":"weekly",
				   "referralCount":"5",
				   "daysSinceLastPurchase":"30",
				   "gender":"male",
				   "age":"35",
				   "address":{
					  "street":"123 Main St",
					  "city":"Anytown",
					  "state":"CA",
					  "zip":"12345",
					  "country":"US"
				   },
				   "preferences":{
					  "brands":[
						 "Owl Shoe",
						 "Acme Shoe"
					  ],
					  "categories":[
						 "running",
						 "athletic"
					  ],
					  "sizes":[
						 "10",
						 "10.5"
					  ],
					  "colors":[
						 "blue",
						 "black"
					  ]
				   }
				}
			 }%
			
			Full Transcript, delimited by the "%" symbol: \n%${transcript}%\n\n You are ${workerName}, a Customer Service Representative, and are currently connected to ${customerName} live. As you can see from the transcript, ${customerName} was previously connected to a Dialogflow CX Virtual Agent that wasn’t fully able to resolve their inquiry. You need to pick up where the transcript leaves off, and provide an intelligent, empathetic, and solution oriented approach to your next response to ${customerName}. You should be extremely cognizant of the information ${customerName} has already shared with either the Virtual Agent or yourself, and absolutely do not ask the customer for information that is already available in the transcript. With all that in mind, respond to ${customerName} with the next best action, and do so in the first person without prefixing your response.`;
			let response = await fetch("https://api.openai.com/v1/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.REACT_APP_OPEN_AI_APIKEY}`,
				},
				body: JSON.stringify({
					prompt: promptToUse,
					max_tokens: 1000,
					temperature: 0.8,
					model: "text-davinci-003",
				}),
			});

			if (!response.ok) {
				throw new Error(
					`Error fetching digital channel next best actions: ${response.status}`
				);
			}

			let data = await response.json();

			while (
				!data.choices[0].text &&
				retries < process.env.REACT_APP_MAX_RETRIES
			) {
				console.log(
					"OPENAI API CALL IS NOT RETURNING DATA FOR THE DIGITAL CHANNEL NEXT BEST ACTION RIGHT NOW. INITIATING RETRY LOGIC"
				);
				await new Promise((resolve) => {
					setTimeout(resolve, process.env.REACT_APP_RETRY_DELAY_MS);
				});
				response = await fetchSummary(transcript);
				data = await response.json();
				retries++;
				console.log("RETRIES: " + retries);
			}

			if (data.choices[0].text) {
				return data.choices[0].text;
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

		const response = await fetch("https://api.openai.com/v1/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${process.env.REACT_APP_OPEN_AI_APIKEY}`,
			},
			body: JSON.stringify({
				prompt: prompt,
				max_tokens: 1000,
				temperature: 0.8,
				model: "text-davinci-003",
			}),
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch voice call summary: ${response.status}`);
		}

		return response;
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
				const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
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
			const data = await fetchNextBestAction(transcript);
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
							<Button variant="primary">
								Update Segment
							</Button>
						</Card>{" "}
					</>
				)}
			</Stack>
		</>
	);
};

export default React.memo(DigitalChannelNextBestAction);
