import {
	Card,
	SkeletonLoader,
	Tab,
	Tabs,
	TabPanel,
	TabPanels,
	TabList,
	Heading,
} from "@twilio-paste/core";

import DigitalChannelNextBestAction from "./DigitalChannelNextBestAction";
// import ConversationSummaryCard from "./ConversationSummaryCard";

import { useEffect, useState } from "react";
import { withTaskContext } from "@twilio/flex-ui";

import { Manager } from "@twilio/flex-ui";

const manager = Manager.getInstance();

const DigitalChannelVirtualAssistant = (props) => {
	const [isLoading, setIsLoading] = useState(false);
	const [nextBestActionTranscript, setNextBestActionTranscript] = useState(null);
	// const [nextBestActionSummary, setNextBestActionSummary] = useState(null);

	// const newNextBestActionSummaryHandler = (newNextBestActionSummary) => {
	// 	setNextBestActionSummary(newNextBestActionSummary);
	// }
	useEffect(() => {
		if (props?.task?.attributes.conversationSid == null) {
			return;
		}

		async function fetchMessages() {
			try {
				const conversationsClient = manager.conversationsClient;
				const conversation = await conversationsClient.getConversationBySid(
					props.task.attributes.conversationSid
				);
				const messages = await conversation.getMessages();
				return messages.items;
			} catch (err) {
				console.error("Error fetching messages:", err);
				throw err;
			}
		}

		async function constructMessageJsonArrays(messages) {
			try {
				const messageJsonArray = [];
				const messageJsonArrayAfterHandoff = [];
				let foundHandoff = false;
				//We will use a uuidRegex to check for a WebChat identity as the author of the message in the logic below
				const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
				for (let i = 0; i < messages.length; i++) {
					const message = messages[i];
					if (!foundHandoff) {
						//The messages we care about for generating (before live agent handoff) the transcript are only the messages sent by the VirtualAgent, this is because those messages have the critical data we need to display, including the customer's message that prompted it's reply, allow us to reconstruct the full transcript of the Virtual Agent Conversation
						if (message.author !== "Dialogflow CX Virtual Agent") {
							continue;
						}
						const sentimentAnalysisResult =
							message.attributes.sentimentAnalysisResult || null;
						const messageJson = {
							author: message.author,
							dateCreated: message.dateCreated,
							dateUpdated: message.dateUpdated,
							conversationSid: props.task.attributes.conversationSid,
							messageSid: message.sid,
							virtualAgentReply: message.attributes.virtualAgentReply,
							customerIntent: message.attributes.customerIntent,
							confidence: message.attributes.match.confidence,
							sentimentAnalysisResult,
							sessionID: message.attributes.sessionID,
							intentDisplayName: message.attributes.match.intent
								? message.attributes.match.intent.displayName
								: message.attributes.match.matchType,
							customerName: props.task.attributes.customerName,
						};
						messageJsonArray.push(messageJson);
					} else {
						const messageAfterHandoffJson = {
							//Set the author to blank if its a phone number (SMS/Whatsapp customer) or a UUID (webchat customer). If it's not either, we assume it to be the Flex worker, which will help us later in the construction of pTranscript and nbaTranscript, since for the customer we will use "customerName", not author, in building the transcript
							author: message.author.startsWith("+") || uuidRegex.test(message.author)
							  ? ""
							  : props.task._task._worker.attributes.full_name,
							body: message.body,
							customerName: props.task.attributes.customerName,
						  };
						messageJsonArrayAfterHandoff.push(messageAfterHandoffJson);
					}
					if (message.attributes.liveAgentHandoff) {
						foundHandoff = true;
					}
				}
				return [messageJsonArray, messageJsonArrayAfterHandoff];
			} catch (err) {
				console.error("Error constructing message JSON arrays:", err);
				throw err;
			}
		}

		async function retrieveTranscriptFromConversationHistory() {
			try {
				const messages = await fetchMessages();
				const messageJsonArrays = await constructMessageJsonArrays(messages);
				return messageJsonArrays;
			} catch (err) {
				console.error(
					"Error retrieving transcript from conversation history:",
					err
				);
				throw err;
			}
		}

		setIsLoading(true);
		const retrieveTranscript = async () => {
			try {
				const conversationsTranscript =
					await retrieveTranscriptFromConversationHistory();

				let nbaTranscript = "";
				for (const item of conversationsTranscript[0]) {
					const { customerIntent, virtualAgentReply, customerName, author } =
						item;
					nbaTranscript += `${customerName}: ${customerIntent}\n${author}: ${virtualAgentReply}\n`;
				}

				if (conversationsTranscript[1].length > 0) {
					for (const item of conversationsTranscript[1]) {
						const { author, body, customerName } = item;
						if (author === "") {
							nbaTranscript += `${customerName}: ${body}\n`;
						} else {
							nbaTranscript += `${author}: ${body}\n`;
						}
					}
				}
				setNextBestActionTranscript(nbaTranscript);
			} catch (err) {
				console.error("Error retrieving transcript:", err);
			} finally {
				setIsLoading(false);
			}
		};

		retrieveTranscript();
	}, [props?.task?.attributes.conversationSid]);

	return (
		<Card>
			<Tabs
				selectedId="digitalChannelVirtualAssistant"
				baseId="openai"
			>
				<TabList aria-label="OpenAI Tab">
					<Tab id="digitalChannelVirtualAssistant">Virtual Assistant</Tab>
				</TabList>
					{isLoading ? (
						<>
							<Heading as="h3" variant="heading30">
								Loading....Please Wait
							</Heading>
							<SkeletonLoader height="150px" />
						</>
					) : (
						<TabPanels>
							<TabPanel>
								{nextBestActionTranscript && (
									<DigitalChannelNextBestAction
										events={props.task.attributes.events}
										customerData={props.task.attributes.customers}
										conversationSid={props.task.attributes.conversationSid}
										customerName={props.task.attributes.customerName}
										nextBestActionTranscript={nextBestActionTranscript}
										workerName={props.task._task._worker.attributes.full_name}
										customerEmail={props.task.attributes.emailAddress}
									/>
									// <ConversationSummaryCard nextBestActionTranscript={nextBestActionTranscript} onNewNextBestActionSummary={newNextBestActionSummaryHandler}/>
								)}
							</TabPanel>
						</TabPanels>
					)}
				</Tabs>
		</Card>
	);
};
export default withTaskContext(React.memo(DigitalChannelVirtualAssistant));
