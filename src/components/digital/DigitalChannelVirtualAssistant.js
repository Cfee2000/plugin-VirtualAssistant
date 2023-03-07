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

import DigitalChannelTranscript from "./DigitalChannelTranscript";
import DigitalChannelSummary from "./DigitalChannelSummary";
import DigitalChannelNextBestAction from "./DigitalChannelNextBestAction";

import { useEffect, useState } from "react";
import { withTaskContext } from "@twilio/flex-ui";

import { Manager } from "@twilio/flex-ui";

const manager = Manager.getInstance();

const DigitalChannelVirtualAssistant = (props) => {
	const [isLoading, setIsLoading] = useState(false);
	const [virtualAgentTranscript, setVirtualAgentTranscript] = useState(null);
	const [summaryPromptTranscript, setSummaryPromptTranscript] = useState(null);
	const [nextBestActionTranscript, setNextBestActionTranscript] =
		useState(null);

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
				setVirtualAgentTranscript(conversationsTranscript[0]);

				let pTranscript = "";
				let nbaTranscript = "";
				for (const item of conversationsTranscript[0]) {
					const { customerIntent, virtualAgentReply, customerName, author } =
						item;
					pTranscript += `${customerIntent}\n${virtualAgentReply}\n`;
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
				setSummaryPromptTranscript(pTranscript);
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
				baseId="fitted-tabs-example"
				variant="fitted"
			>
				<TabList aria-label="Fitted product tabs">
					<Tab id="voiceVirtualAssistant">Virtual Assistant</Tab>
				</TabList>
				<Tabs orientation="vertical" baseId="vertical-tabs-example">
					<TabList aria-label="Virtual Assistant Tabs">
					<Tab>
							Next Action{" "}
							<svg
								style={{ verticalAlign: "middle", marginLeft: "8px" }}
								xmlns="http://www.w3.org/2000/svg"
								width={28}
								height={28}
								viewBox="0 0 24 24"
							>
								<title>{"OpenAI icon"}</title>
								<path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z" />
							</svg>
						</Tab>
						<Tab>
							Summary{" "}
							<svg
								style={{ verticalAlign: "middle", marginLeft: "21px" }}
								xmlns="http://www.w3.org/2000/svg"
								width={28}
								height={28}
								viewBox="0 0 24 24"
							>
								<title>{"OpenAI icon"}</title>
								<path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z" />
							</svg>
						</Tab>
						<Tab>
							Transcript{" "}
							<svg
								style={{ verticalAlign: "middle", marginLeft: "12px" }}
								width={40}
								height={40}
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<g fill="none">
									<path
										d="m12.65 2.154 6.253 3.66c.424.232.69.674.695 1.156v8.033a1.341 1.341 0 0 1-.695 1.155L8.94 21.984a.341.341 0 0 1-.514-.284v-3.535l-3.419-2.007a1.341 1.341 0 0 1-.695-1.155V6.97c.006-.482.271-.924.695-1.156l6.254-3.66c.43-.247.96-.247 1.39 0z"
										fill="#aecbfa"
									/>
									<path
										d="M8.192 9.48a.382.382 0 0 0-.382.37v3.945l.001.04a.73.73 0 0 0 .353.584l.014.008 1.924 1.098v1.54l.001.03a.382.382 0 0 0 .559.309l.014-.008 5.103-2.955.036-.021a.73.73 0 0 0 .332-.594V9.862a.382.382 0 0 0-.56-.337l-.012.006-3.394 1.949-.029.016a.382.382 0 0 1-.362-.01l-.013-.006-3.395-1.95a.382.382 0 0 0-.19-.05z"
										fill="#669df6"
									/>
									<path
										d="M12.245 5.063a.478.478 0 0 0-.459-.009l-.013.008L8.03 7.175a.382.382 0 0 0-.013.657l.01.007 3.742 2.15c.144.082.32.084.465.006l.014-.008 3.684-2.15a.382.382 0 0 0 .008-.655l-.01-.006z"
										fill="#185abc"
									/>
								</g>
							</svg>
						</Tab>
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
										conversationSid={props.task.attributes.conversationSid}
										customerName={props.task.attributes.customerName}
										nextBestActionTranscript={nextBestActionTranscript}
										workerName={props.task._task._worker.attributes.full_name}
									/>
								)}
							</TabPanel>
							<TabPanel>
								{summaryPromptTranscript && (
									<DigitalChannelSummary
										promptTranscript={summaryPromptTranscript}
									/>
								)}
							</TabPanel>
							<TabPanel>
								{virtualAgentTranscript && (
									<DigitalChannelTranscript
										transcript={virtualAgentTranscript}
									/>
								)}
							</TabPanel>
						</TabPanels>
					)}
				</Tabs>
			</Tabs>
		</Card>
	);
};
export default withTaskContext(React.memo(DigitalChannelVirtualAssistant));
